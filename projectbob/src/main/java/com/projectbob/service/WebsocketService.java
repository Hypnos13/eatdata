package com.projectbob.service;

import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.projectbob.dto.NewOrder;

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
	
	/*
	 * public void sendNewOrder(int shopId, int orderId) { NewOrder msg = new
	 * NewOrder(orderId); template.convertAndSend("/topic/orders/" + shopId, msg); }
	 */
}
