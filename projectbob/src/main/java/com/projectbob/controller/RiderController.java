package com.projectbob.controller;

import com.projectbob.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
public class RiderController {

    @Autowired
    private ShopService shopService;

    @PostMapping("/rider/orders/{orderId}/accept")
    @ResponseBody
    public ResponseEntity<?> acceptDispatch(@PathVariable("orderId") int orderId,
                                            @RequestBody Map<String, Object> deliveryInfo) { // @RequestBody로 배달 시간 정보 받기
        
        // ShopService의 새 메소드를 호출하면서, 세 번째 인자로 deliveryInfo를 전달합니다.
        shopService.updateOrderStatus(orderId, "DISPATCHED", deliveryInfo);

        return ResponseEntity.ok(Map.of("success", true, "message", "배차를 수락했습니다."));
    }
}
