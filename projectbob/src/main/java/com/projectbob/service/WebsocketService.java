package com.projectbob.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.projectbob.domain.*;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class WebsocketService {
	
	private final SimpMessagingTemplate template;
	
	@Autowired
	public WebsocketService(SimpMessagingTemplate template) {
		this.template = template;
	}
	
	//배차완료 알림
	public void sendDispatchAcceptedToShop(Orders order) {
	    log.info("[WebSocket] 점주에게 배차 완료 알림 전송: {}", order);
	    Map<String, Object> payload = Map.of(
	        "oNo", order.getONo(),
	        "newStatus", "DISPATCHED",
	        "message", "라이더가 배차되었습니다!"
	    );
	    // '/topic/orderStatus/shop/{가게ID}' 채널을 구독하는 점주에게 메시지 전송
	    template.convertAndSend("/topic/orderStatus/shop/" + order.getSId(), payload);
	}
	
	// 배차요청

	public void sendDispatchToRiders(DispatchInfo dispatchInfo) {
	    log.info("[WebSocket] 라이더에게 배차 요청 전송: {}", dispatchInfo);
	    // '/topic/rider/requests' 채널을 구독하는 모든 라이더에게 메시지 전송
	    template.convertAndSend("/topic/rider/requests", dispatchInfo);
	}
	
	// 주문정보 푸시
	public void sendNewOrder(NewOrder order) {
		if (order.getRegDate() != null) {
	        order.setRegDateMs(order.getRegDate().getTime());
	    }
	    log.info("[WebSocket] sendNewOrder: {}", order);
	    template.convertAndSend("/topic/newOrder/" + order.getShopId(), order);
	}
	
	//주문 상태 변경 푸시
	public void sendOrderStatusChange(int oNo, int shopId, String newStatus, int newPendingCount) {
	    Map<String,Object> payload = Map.of(
	        "oNo", oNo,
	        "newStatus", newStatus,
	        "newPendingCount", newPendingCount
	    );
	    // 헤더 알림 및 가게 전체 업데이트용
	    template.convertAndSend("/topic/orderStatus/shop/" + shopId, payload);
	    // 개별 주문 상세 업데이트용
	    template.convertAndSend("/topic/orderStatus/order/" + oNo, payload);
	}


    // 사용자에게 주문 상태 변경 알림을 보내는 메소드
    public void sendOrderStatusUpdateToUser(String userId, Map<String, Object> payload) {
        log.info("[WebSocket] sendOrderStatusUpdateToUser: userId={}, payload={}", userId, payload);
        template.convertAndSendToUser(userId, "/queue/order-updates", payload);
    }
    
	/*
	 * public void sendNewOrder(int shopId, int orderId) { NewOrder msg = new
	 * NewOrder(orderId); template.convertAndSend("/topic/orders/" + shopId, msg); }
	 */

    /**
     * 특정 고객에게 배달 예상 시간 등 상세 정보를 전송합니다.
     * @param userId 고객의 ID
     * @param dispatchInfo 전송할 배달 정보
     */
    public void sendDeliveryInfoToCustomer(String userId, DispatchInfo dispatchInfo) {
        log.info("고객에게 배달 정보 전송. userId: {}, info: {}", userId, dispatchInfo);
        template.convertAndSendToUser(
            userId,
            "/queue/delivery-info", // 배달 정보 전용 주소
            dispatchInfo
        );
    }
    
}
