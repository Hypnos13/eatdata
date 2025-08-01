package com.projectbob.service;

import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.projectbob.dto.NewOrder;
import com.projectbob.mapper.ShopMapper;

@Service
public class WebsocketService {
	
	private final SimpMessagingTemplate template;
	
	@Autowired
	public WebsocketService(SimpMessagingTemplate template) {
		this.template = template;
	}
	
	/** 
     * shopId별로 구독자에게 주문 정보를 푸시합니다. 
     * @param shopId : 가게 고유번호
     * @param orderInfo : 전송할 주문 요약 DTO (orderId, shopName 등)
     */
    public void sendNewOrder(int shopId, Map<String, Object> orderInfo) {
        template.convertAndSend("/topic/newOrder/" + shopId, orderInfo);
    }
	
    /**
     * 주문 상태 변경을 구독자(가게 뷰)에게 푸시
     * @param oNo 변경된 주문 번호
     * @param shopId 해당 주문의 shopId
     * @param newStatus "REJECTED" 또는 "IN_PROGRESS" 등
     */
    public void sendOrderStatusChange(int oNo, int shopId, String newStatus) {
        Map<String,Object> payload = Map.of(
          "oNo", oNo,
          "newStatus", newStatus
        );
        // 헤더 알림
        template.convertAndSend("/topic/orderStatus/shop/" + shopId, payload);
        // 주문내역 테이블용
        template.convertAndSend("/topic/orderStatus/order/" + oNo, payload);
      }
    
	/*
	 * public void sendNewOrder(int shopId, int orderId) { NewOrder msg = new
	 * NewOrder(orderId); template.convertAndSend("/topic/orders/" + shopId, msg); }
	 */
    
}
