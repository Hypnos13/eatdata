package com.projectbob.domain;

import java.sql.Timestamp;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;


//주문 정보 DTO
 
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class NewOrder {
    private int orderId;         // 주문번호
    private int shopId;          // 가게 ID
    private String shopName;     // 가게명
    private String menus;        // 주문 메뉴 목록 (예: "치킨 x1, 콜라 x2")
    private int totalPrice;      // 총 결제 금액
    private String payment;      // 결제 수단
    private String address;      // 배달 주소
    private String phone;        // 전화번호
    private String request;      // 요청사항
    private String status;       // 주문 상태 (예: PENDING, ACCEPTED)
    private Timestamp regDate;   // 주문 생성 일시
}
