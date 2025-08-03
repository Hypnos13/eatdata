package com.projectbob.service;



import java.sql.Timestamp;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.projectbob.domain.Orders;
import com.projectbob.mapper.ShopMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class OrderTimeoutService {

    @Autowired private ShopMapper shopMapper;
    @Autowired private WebsocketService websocketService;

    @Scheduled(initialDelay = 180_000, fixedRate = 60_000)
    @Transactional
    public void autoRejectStaleOrders() {
        // ▶ 20초 이전의 PENDING 주문만 거절 대상으로 삼음
        Timestamp cutoff = new Timestamp(System.currentTimeMillis() - 60_000);

        log.info("autoRejectStaleOrders triggered – cutoff={}", cutoff);
        
        List<Orders> stale = shopMapper.findOrdersByStatusAndRegDate("PENDING", cutoff);
        if (stale.isEmpty()) return;

        // 상태 업데이트
        int updated = shopMapper.updateStatusByStatusAndRegDate("PENDING", cutoff, "REJECTED");

        // WebSocket 푸시
        for (Orders o : stale) {
            websocketService.sendOrderStatusChange(
                o.getONo(),    // 주문번호
                o.getSId(),    // 가게ID
                "REJECTED"     // 새 상태
            );
        }

        log.info("자동 만료 처리된 주문 갯수: {}건 (cutoff={})", updated, cutoff);
    }
}
