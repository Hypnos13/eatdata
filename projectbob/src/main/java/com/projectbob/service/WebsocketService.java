package com.projectbob.service;

import org.apache.ibatis.annotations.Param;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.projectbob.dto.NewOrder;

@Service
public class WebsocketService {
	
	private final SimpMessagingTemplate template;
	
	public WebsocketService(SimpMessagingTemplate template) {
		this.template = template;
	}
	
	
	/*
	 * public void sendNewOrder(int shopId, int orderId) { NewOrder msg = new
	 * NewOrder(orderId); template.convertAndSend("/topic/orders/" + shopId, msg); }
	 */
}
