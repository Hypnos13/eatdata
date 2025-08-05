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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper; // ObjectMapper 추가

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

// Lombok 대신 직접 Logger import
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PortoneServiceImpl implements PortoneService {

    // Lombok 대신 직접 Logger 객체 생성
    private static final Logger log = LoggerFactory.getLogger(PortoneServiceImpl.class);

    @Autowired
    private BobMapper bobMapper;
    
    @Autowired
    private BobService bobService;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper; // ObjectMapper 필드 추가

    @Value("${portone.api.key}")
    private String portoneApiKey;

    @Value("${portone.api.secret}")
    private String portoneApiSecret;

    public PortoneServiceImpl() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper(); // ObjectMapper 초기화
    }

    private String getAccessToken() throws Exception {
        log.info("PortoneService: Access Token 요청 - API Key: {}, API Secret: {}", portoneApiKey, portoneApiSecret); // 디버깅용 로그
        String tokenUrl = "https://api.iamport.kr/users/getToken";
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("imp_key", portoneApiKey);
        form.add("imp_secret", portoneApiSecret);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        ResponseEntity<Map> resp = restTemplate.exchange(tokenUrl, HttpMethod.POST, request, Map.class);

        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
            throw new RuntimeException("PortOne Access Token 발급 실패: " + resp.getStatusCode());
        }

        Map<String,Object> resBody = resp.getBody();
        @SuppressWarnings("unchecked")
        Map<String,Object> data = (Map<String,Object>) resBody.get("response");
        return (String) data.get("access_token");
    }

    @Override
    public Map<String, Object> preparePayment(int amount, String orderName, String customerId, String address1, String address2, String phone, String orderRequest) {
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("storeId", "store-d5e7696b-604a-4b03-a1f7-2637ff538712");
        paymentData.put("channelKey", "channel-key-3a2e28ac-f305-4e9e-add2-1b55f1c6e70c");
        paymentData.put("paymentId", "PAY_" + UUID.randomUUID().toString().replace("-", ""));
        paymentData.put("orderName", orderName);
        paymentData.put("totalAmount", amount);
        paymentData.put("currency", "KRW");
        paymentData.put("payMethod", "EASY_PAY");
        paymentData.put("customData", Map.of("customerId", customerId));
        log.info("PortoneService: 결제 준비 요청 - " + paymentData);
        return paymentData;
    }

    @Override
    public boolean verifyPayment(String paymentId, String orderId) {
        log.info("PortoneService: 결제 검증 요청 - paymentId: " + paymentId + ", orderId: " + orderId);
        try {
            String token = getAccessToken();
            String url = "https://api.iamport.kr/payments/" + paymentId; // imp_uid로 결제 정보 조회
            log.info("PortoneService: 결제 정보 조회 URL: {}", url); // 디버깅용 로그

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> resp = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode bodyNode = resp.getBody();

            if (bodyNode == null || !bodyNode.has("response")) {
                log.error("PortOne 결제 정보 조회 실패: 응답 body가 유효하지 않습니다.");
                return false;
            }

            JsonNode responseNode = bodyNode.path("response");
            String status = responseNode.path("status").asText();
            String impUid = responseNode.path("imp_uid").asText();
            int amount = responseNode.path("amount").asInt();

            // 결제 상태가 'paid' (결제 완료)이고, imp_uid가 일치하는지 확인
            if ("paid".equals(status) && paymentId.equals(impUid)) {
                log.info("PortOne 결제 검증 성공. imp_uid: {}, status: {}", impUid, status);
                return true;
            } else {
                log.error("PortOne 결제 검증 실패. imp_uid: {}, status: {}", impUid, status);
                return false;
            }

        } catch (Exception e) {
            log.error("PortOne 결제 검증 중 예외 발생. paymentId: {}", paymentId, e);
            return false;
        }
    }

    @Override
    public boolean cancelPayment(String impUid, String merchantUid, String reason, Integer amount) {
        log.info("PortoneService.cancelPayment 호출됨. impUid: {}, merchantUid: {}, reason: {}, amount: {}", impUid, merchantUid, reason, amount);
        try {
            String token = getAccessToken();
            String url = "https://api.iamport.kr/payments/cancel";

            Map<String, Object> body = new HashMap<>();
            body.put("cancel_reason", reason);

            if (impUid != null && !impUid.isBlank()) {
                body.put("imp_uid", impUid);
            } else {
                log.error("PortOne 결제 취소 실패: 필수 파라미터인 imp_uid가 없습니다.");
                return false;
            }
            
            if (amount != null) {
                body.put("amount", amount);
            }

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);
            HttpEntity<String> req = new HttpEntity<>(jsonBody, headers);

            log.info("PortOne 환불 요청 Body (JSON): {}", jsonBody);

            ResponseEntity<JsonNode> resp = restTemplate.exchange(url, HttpMethod.POST, req, JsonNode.class);
            JsonNode bodyNode = resp.getBody();

            if (bodyNode == null) {
                log.error("PortOne API 응답 body가 null입니다.");
                return false;
            }

            JsonNode responseNode = bodyNode.path("response");

            if (!responseNode.isMissingNode() && responseNode.has("cancel_date")) {
                log.info("PortOne 결제 취소 성공. imp_uid: {}", impUid);
                return true;
            }
            
            int code = bodyNode.path("code").asInt();
            String message = bodyNode.path("message").asText();
            log.error("PortOne 결제 취소 실패. imp_uid: {}, Code: {}, Message: {}", impUid, code, message);
            return false;

        } catch (Exception e) {
            log.error("PortOne 결제 취소 중 예외 발생. imp_uid: {}", impUid, e);
            return false;
        }
    }
}
