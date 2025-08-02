package com.projectbob.service;

import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.projectbob.domain.NewOrder;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class WebsocketService {
	
	private final SimpMessagingTemplate template;
	
	@Autowired
	public WebsocketService(SimpMessagingTemplate template) {
		this.template = template;
	}
	
	
	// 주문정보 푸시
	public void sendNewOrder(NewOrder order) {
		log.info("[WebSocket] sendNewOrder: {}", order);
		template.convertAndSend("/topic/newOrder/" + order.getShopId(), order);
	}
	
    //주문 상태 변경 푸시
    public void sendOrderStatusChange(int oNo, int shopId, String newStatus) {
        Map<String,Object> payload = Map.of(
          "oNo", oNo,
          "newStatus", newStatus
        );
        // 헤더 알림
        template.convertAndSend("/topic/orderStatus/shop/" + shopId, payload);
        // 테이블 업데이트
        template.convertAndSend("/topic/orderStatus/order/" + oNo, payload);
    }
    
	/*
	 * public void sendNewOrder(int shopId, int orderId) { NewOrder msg = new
	 * NewOrder(orderId); template.convertAndSend("/topic/orders/" + shopId, msg); }
	 */
    
}
