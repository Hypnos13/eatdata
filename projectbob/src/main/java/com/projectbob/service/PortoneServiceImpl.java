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
import com.fasterxml.jackson.databind.JsonNode;

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
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);

        // 3) POST (RestTemplate#postForEntity 로도 가능)
        ResponseEntity<Map> resp = restTemplate.exchange(
            tokenUrl,
            HttpMethod.POST,
            request,
            Map.class
        );

        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
            throw new RuntimeException("PortOne Access Token 발급 실패: " + resp.getStatusCode() + " - " + resp.getBody());
        }

        Map<String,Object> resBody = resp.getBody();
        @SuppressWarnings("unchecked")
        Map<String,Object> data = (Map<String,Object>) resBody.get("response");
        return (String) data.get("access_token");
    }

    // 실제 PortOne API 연동 로직이 들어갈 부분
    @Override
    public Map<String, Object> preparePayment(int amount, String orderName, String customerId, String address1, String address2, String phone, String orderRequest) {
        // ... (기존 preparePayment 로직은 동일) ...
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("storeId", "store-d5e7696b-604a-4b03-a1f7-2637ff538712"); // 실제 상점 ID
        paymentData.put("channelKey", "channel-key-3a2e28ac-f305-4e9e-add2-1b55f1c6e70c"); // 실제 채널 키
        paymentData.put("paymentId", "PAY_" + UUID.randomUUID().toString().replace("-", ""));
        paymentData.put("orderName", orderName);
        paymentData.put("totalAmount", amount);
        paymentData.put("currency", "KRW");
        paymentData.put("payMethod", "EASY_PAY"); // 카카오페이
        paymentData.put("customData", Map.of("customerId", customerId));

        System.out.println("PortoneService: 결제 준비 요청 - " + paymentData);
        return paymentData;
    }

    @Override
    public boolean verifyPayment(String paymentId, String orderId) {
        System.out.println("PortoneService: 결제 검증 요청 - paymentId: " + paymentId + ", orderId: " + orderId);
        // TODO: 실제 PortOne API 연동 시 이 부분을 제거하고 실제 검증 로직을 구현해야 합니다.
        return true; // 테스트를 위해 임시로 항상 true 반환
    }

    @Override
    public boolean cancelPayment(String impUid, String merchantUid, String reason, Integer amount) {
        try {
            String token = getAccessToken();
            String url   = "https://api.iamport.kr/payments/cancel";

            Map<String,Object> body = new HashMap<>();
            body.put("imp_uid", impUid);
            body.put("merchant_uid", merchantUid);
            body.put("cancel_reason", reason);
            if (amount != null) body.put("amount", amount);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);
            HttpEntity<Map<String,Object>> req = new HttpEntity<>(body, headers);

            ResponseEntity<JsonNode> resp = restTemplate.postForEntity(url, req, JsonNode.class);
            JsonNode res = resp.getBody().path("response");
            return res.has("cancel_date");
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}