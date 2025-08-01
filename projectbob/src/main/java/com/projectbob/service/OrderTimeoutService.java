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

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void autoRejectStaleOrders() {
        Timestamp cutoff = new Timestamp(System.currentTimeMillis() - 1 * 60_000);

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

        log.info("자동 만료 처리된 주문 갯수: {}건", updated);
    }
}
