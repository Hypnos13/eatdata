package com.projectbob.service;

import java.util.Map;

public interface PortoneService {
    Map<String, Object> preparePayment(int amount, String orderName, String customerId, String address1, String address2, String phone, String orderRequest);
    boolean verifyPayment(String paymentId, String orderId);
    boolean cancelPayment(String impUid, String merchantUid, String reason, Integer amount);
}
