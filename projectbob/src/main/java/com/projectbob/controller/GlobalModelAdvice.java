package com.projectbob.controller;

import java.util.List;
import java.util.stream.Collectors;

import java.sql.Timestamp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.SessionAttribute;
import org.springframework.ui.Model;

import com.projectbob.service.ShopService;

import jakarta.servlet.http.HttpServletRequest;

import com.projectbob.domain.Orders;

@ControllerAdvice
public class GlobalModelAdvice {

    private final ShopService shopService;

    @Autowired
    public GlobalModelAdvice(ShopService shopService) {
        this.shopService = shopService;
    }

    // 1) 헤더 알림
    @ModelAttribute("notifications")
    public List<NotificationDto> notifications(
            @SessionAttribute(name = "currentSId", required = false) Integer sId) {
        if (sId == null) return List.of();
        // 현재 가게 이름 조회 (모든 알림에 동일하므로 한 번만 호출)
        String shopName = shopService.findBySId(sId).getName();
        return shopService.findOrdersByStatusAndShop("PENDING", sId).stream()
            .map(o -> new NotificationDto(
                   o.getONo(),
                   shopName,
                   o.getRegDate().getTime()
            ))
            .collect(Collectors.toList());
    }

    @ModelAttribute("sessionNotifyCount")
    public int sessionNotifyCount(
            @ModelAttribute("notifications") List<?> notifications) {
        return notifications.size();
    }

    // 2) 전역 페이지 타이틀
    @ModelAttribute
    public void addGlobalAttributes(Model model, HttpServletRequest request) {
        String uri = request.getRequestURI();
        String pageTitle = "";
        if (uri.contains("shopBasic"))       pageTitle = "기본설정";
        else if (uri.contains("shopOpenTime")) pageTitle = "영업시간";
        else if (uri.contains("shopStatus"))   pageTitle = "영업상태";
        else if (uri.contains("menu"))         pageTitle = "메뉴관리";
        else if (uri.contains("shopNotice"))   pageTitle = "가게 공지";
        else if (uri.contains("reviewManage")) pageTitle = "리뷰 관리";
        model.addAttribute("pageTitle", pageTitle);
    }

    // DTO 클래스
    public static class NotificationDto {
        private final int orderId;
        private final String shopName;
        private final long timestamp;

        public NotificationDto(int orderId, String shopName, long timestamp) {
            this.orderId   = orderId;
            this.shopName  = shopName;
            this.timestamp = timestamp;
        }

        public int getOrderId()    { return orderId; }
        public String getShopName(){ return shopName; }
        public long getTimestamp() { return timestamp; }
    }
}
