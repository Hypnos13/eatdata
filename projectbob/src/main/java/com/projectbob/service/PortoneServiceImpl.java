package com.projectbob.service;

import com.projectbob.domain.Orders;
import com.projectbob.mapper.BobMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // application.properties에서 값 주입
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate; // HTTP 요청을 위한 RestTemplate
import org.springframework.util.LinkedMultiValueMap; // 추가
import org.springframework.util.MultiValueMap; // 추가
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PortoneServiceImpl implements PortoneService {

    @Autowired
    private BobMapper bobMapper;
    
    @Autowired
    private BobService bobService;

    // RestTemplate을 사용하여 외부 API 호출
    private final RestTemplate restTemplate;

    // PortOne API 키와 시크릿 (application.properties 또는 환경 변수에서 주입)
    @Value("${portone.api.key}")
    private String portoneApiKey;

    @Value("${portone.api.secret}")
    private String portoneApiSecret;

    // 생성자에서 RestTemplate 초기화
    public PortoneServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    // Access Token 발급 메서드 (PortOne API 문서 참고)
    private String getAccessToken() throws Exception {
        String tokenUrl = "https://api.iamport.kr/users/getToken"; // PortOne 토큰 발급 URL

        // 1) form-urlencoded 바디 준비
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("imp_key",    portoneApiKey);
        form.add("imp_secret", portoneApiSecret);

        // 2) 헤더 설정
        System.out.println("PortoneService: Access Token 요청 - imp_key: " + portoneApiKey + ", imp_secret: " + portoneApiSecret); // 이 줄 추가

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        
        System.out.println("PortOne Access Token 요청 - imp_key: " + portoneApiKey + ", imp_secret: " + portoneApiSecret);

        try { // try-catch 블록 추가
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
            System.err.println("PortOne Access Token 요청 중 예외 발생: " + e.getMessage()); // 예외 로깅 추가
            throw e; // 예외 다시 던지기
        }
    }

    // 실제 PortOne API 연동 로직이 들어갈 부분
    @Override
    public Map<String, Object> preparePayment(int amount, String orderName, String customerId, String address1, String address2, String phone, String orderRequest, String payMethod) {
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("storeId", "store-d5e7696b-604a-4b03-a1f7-2637ff538712"); // 실제 상점 ID
        
        if ("TOSSPAY".equals(payMethod)) {
            paymentData.put("channelKey", "channel-key-11bfbde5-7c32-4bed-8f91-d5f1a15785f9"); // 토스페이 채널 키
            paymentData.put("easyPayProvider", "EASY_PAY_PROVIDER_TOSS");
        } else if ("KAKAO".equals(payMethod)) {
            paymentData.put("channelKey", "channel-key-3a2e28ac-f305-4e9e-add2-1b55f1c6e70c"); // 카카오페이 채널 키
            paymentData.put("easyPayProvider", "EASY_PAY_PROVIDER_KAKAO");
        }
        
        paymentData.put("paymentId", "PAY_" + UUID.randomUUID().toString().replace("-", ""));
        paymentData.put("orderName", orderName);
        paymentData.put("totalAmount", amount);
        paymentData.put("currency", "KRW");
        paymentData.put("payMethod", payMethod); // PortOne SDK에 맞는 소문자로 변환 // 선택된 결제 수단 사용
        
        paymentData.put("customData", Map.of("customerId", customerId, "address1", address1, "address2", address2, "phone", phone, "orderRequest", orderRequest));

        System.out.println("PortoneService: 최종 결제 데이터 - " + paymentData);
        return paymentData;
    }

    @Override
    public boolean verifyPayment(String paymentId, String orderId) {  
        System.out.println("PortoneService: 결제 검증 요청 - paymentId: " + paymentId + ", orderId: " + orderId);
        try {
            String accessToken = getAccessToken();
            String paymentInfoUrl = "https://api.iamport.kr/payments/" + paymentId; // PortOne 결제 내역 조회 URL

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<Map> resp = restTemplate.exchange(
                paymentInfoUrl,
                HttpMethod.GET,
                request,
                Map.class
            );

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                System.err.println("PortOne 결제 내역 조회 실패: " + resp.getStatusCode() + " - 응답 바디: " + resp.getBody());
                return false;
            }

            Map<String, Object> resBody = resp.getBody();
            @SuppressWarnings("unchecked")
            Map<String, Object> paymentData = (Map<String, Object>) resBody.get("response");

            // 1. PortOne API에서 조회한 실제 결제 금액
            Double portoneAmountDouble = (Double) paymentData.get("amount");
            int portoneAmount = portoneAmountDouble.intValue();

            // 2. DB에 저장된 주문의 실제 금액 조회
            int actualOrderAmount = bobService.getActualOrderAmount(orderId);

            // 3. 두 금액 비교
            if (portoneAmount == actualOrderAmount) {
                System.out.println("결제 금액 검증 성공: PortOne 금액 " + portoneAmount + ", DB 금액 " + actualOrderAmount);
                return true;
            } else {
                System.err.println("결제 금액 불일치: PortOne 금액 " + portoneAmount + ", DB 금액 " + actualOrderAmount);
                return false;
            }

        } catch (Exception e) {
            System.err.println("결제 검증 중 오류 발생: " + e.getMessage());
            return false;
        }
    }
}