package com.projectbob.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DispatchInfo {
    private int orderId;
    private int shopId;
    private String shopName;
    private String shopAddress;
    private String shopPhone;
    private String customerAddress;
    private String customerPhone;
    private String pickupTime;       // 예: "10분 후 (14:30)"
    private String deliveryTime;     // 예: "30분 후 (14:50)"
    private String status;           // 항상 "DISPATCH_REQUEST"
}