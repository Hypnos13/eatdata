package com.projectbob.domain;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Orders {
	private int oNo; //주문번호
	private int sId;//가게id
	private String id; //회원id
	private int totalPrice;//총 가격
	private String payment; // 결제수단
	private String oAddress; // 배달주소
	private String request; //요청사항
	private Timestamp regDate;//생성일
	private Timestamp modiDate;//수정일
	private String status;//상태
	private int quantity;//수량
	private String menus; //주문메뉴

}
