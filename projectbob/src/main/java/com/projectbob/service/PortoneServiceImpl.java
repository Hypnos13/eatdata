package com.projectbob.service;

import com.projectbob.domain.Orders;
import com.projectbob.mapper.BobMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PortoneServiceImpl implements PortoneService {

    @Autowired
    private BobMapper bobMapper;
    
    @Autowired
    private BobService bobService;

    private final RestTemplate restTemplate;

    private final String portoneApiKey;
    private final String portoneApiSecret;

    @Autowired
    public PortoneServiceImpl(@Value("${portone.api.key}") String portoneApiKey,
                              @Value("${portone.api.secret}") String portoneApiSecret) {
        this.restTemplate = new RestTemplate();
        this.portoneApiKey = portoneApiKey;
        this.portoneApiSecret = portoneApiSecret;
    }

    private String getAccessToken() throws Exception {
        String tokenUrl = "https://api.iamport.kr/users/getToken";

        System.out.println("PortoneService: Access Token 요청 - imp_key: " + portoneApiKey + ", imp_secret: " + portoneApiSecret);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("imp_key",    portoneApiKey);
        form.add("imp_secret", portoneApiSecret);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                tokenUrl,
                HttpMethod.POST,
                request,
                Map.class
            );

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                System.err.println("PortOne Access Token 발급 실패: " + resp.getStatusCode() + " - 응답 바디: " + resp.getBody());
                if(resp.getBody() != null) {
                    System.err.println("PortOne Access Token 발급 실패 상세 응답: " +   resp.getBody().toString());
                }
                throw new RuntimeException("PortOne Access Token 발급 실패: " + resp.getStatusCode() + " - " + resp.getBody());
            }

            Map<String,Object> resBody = resp.getBody();
            @SuppressWarnings("unchecked")
            Map<String,Object> data = (Map<String,Object>) resBody.get("response");
            return (String) data.get("access_token");
        } catch (Exception e) {
            System.err.println("PortOne Access Token 요청 중 예외 발생: " + e.getMessage());
            throw e;
        }
    }

    @Override
    public Map<String, Object> preparePayment(int amount, String orderName, String customerId, String address1, String address2, String phone, String orderRequest, String payMethod) {
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("storeId", "store-d5e7696b-604a-4b03-a1f7-2637ff538712");
        
        if ("TOSSPAY".equals(payMethod)) {
            paymentData.put("channelKey", "channel-key-11bfbde5-7c32-4bed-8f91-d5f1a15785f9");
            paymentData.put("easyPayProvider", "EASY_PAY_PROVIDER_TOSS");
        } else if ("KAKAO".equals(payMethod)) {
            paymentData.put("channelKey", "channel-key-3a2e28ac-f305-4e9e-add2-1b55f1c6e70c");
            paymentData.put("easyPayProvider", "EASY_PAY_PROVIDER_KAKAO");
        }
        
        paymentData.put("paymentId", "PAY_" + UUID.randomUUID().toString().replace("-", "")); // paymentId 생성 및 추가
        paymentData.put("merchant_uid", "ORDER_" + System.currentTimeMillis()); // merchant_uid 생성 및 추가
        paymentData.put("orderName", orderName);
        paymentData.put("totalAmount", amount);
        paymentData.put("currency", "KRW");
        paymentData.put("payMethod", "EASY_PAY");
        
        paymentData.put("customData", Map.of("customerId", customerId, "address1", address1, "address2", address2, "phone", phone, "orderRequest", orderRequest));

        System.out.println("PortoneService: 최종 결제 데이터 - " + paymentData);
        return paymentData;
    }

    @Override
    public boolean verifyPayment(String merchantUid) {
        System.out.println("PortoneService: verifyPayment 결제 검증 요청 - merchant_uid: " + merchantUid);
        try {
            String accessToken = getAccessToken();
            String paymentInfoUrl = "https://api.iamport.kr/payments/find?merchant_uid=" 
                + URLEncoder.encode(merchantUid, StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> resp = restTemplate.exchange(
                paymentInfoUrl,
                HttpMethod.GET,
                request,
                Map.class
            );

            System.out.println("PortoneService: 결제 조회 응답 status=" + resp.getStatusCode());
            System.out.println("PortoneService: 결제 조회 응답 body=" + resp.getBody());

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                System.err.println("PortOne 결제 내역 조회 실패: " + resp.getStatusCode() + " - 응답 바디: " + resp.getBody());
                return false;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> resBody = (Map<String, Object>) resp.getBody();
            @SuppressWarnings("unchecked")
            Map<String, Object> paymentData = (Map<String, Object>) resBody.get("response");

            // 금액 검증
            Number amountNum = (Number) paymentData.get("amount");
            int portoneAmount = amountNum.intValue();
            int actualOrderAmount = bobService.getActualOrderAmount(merchantUid);
            if (portoneAmount != actualOrderAmount) {
                System.err.println("결제 금액 불일치: PortOne 금액 " + portoneAmount + ", DB 금액 " + actualOrderAmount);
                return false;
            }

            // 상태 확인
            String status = (String) paymentData.get("status");
            if (!"paid".equalsIgnoreCase(status)) {
                System.err.println("결제 상태 비정상: " + status);
                return false;
            }

            System.out.println("결제 검증 성공: merchant_uid=" + merchantUid);
            return true;
        } catch (Exception e) {
            System.err.println("결제 검증 중 오류 발생: " + e.getMessage());
            return false;
        }
    }

}