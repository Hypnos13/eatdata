package com.projectbob.controller;

import com.projectbob.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Controller
public class RiderController {

    @Autowired
    private ShopService shopService; // <-- BobService 대신 ShopService 주입

    // WebsocketService는 더 이상 직접 호출할 필요가 없으므로 삭제

    @PostMapping("/rider/orders/{orderId}/accept")
    @ResponseBody
    public ResponseEntity<?> acceptDispatch(@PathVariable("orderId") int orderId) { // Long -> int 로 변경
        // 1. DB 업데이트와 모든 알림 전송을 한 번에 처리하는 강력한 서비스 메서드 호출
        shopService.updateOrderStatus(orderId, "DISPATCHED");

        return ResponseEntity.ok(Map.of("success", true, "message", "배차를 수락했습니다."));
    }
}