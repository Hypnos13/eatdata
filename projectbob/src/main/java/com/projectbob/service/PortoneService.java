package com.projectbob.service;

import java.util.Map;

public interface PortoneService {
    Map<String, Object> preparePayment(int amount, String orderName, String customerId, String address1, String address2, String phone, String orderRequest, String payMethod);
    boolean verifyPayment(String merchantUid);
}
