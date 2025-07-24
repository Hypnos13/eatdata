package com.projectbob.service;

import org.apache.ibatis.annotations.Param;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebsocketService {
	
	private final SimpMessagingTemplate template;
	
	public WebsocketService(SimpMessagingTemplate template) {
		this.template = template;
	}
	
	@Param shopId
	public void sendNewOrder(int shopId, NewOrderDto payload) {
		template.convertAndSend("/topic/orders/" + shopId, payload);
	}

}
