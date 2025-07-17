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
public class Cart {
	private int caId;//카트아이디
	private int mId;//메뉴아이디
	private int moId;//메뉴옵션 아이디
	private String id; // 회원아이디
	private int sId;//가게 아이디
	private int quantity; //수량
	private Timestamp regDate; //생성일
	private Timestamp modiDate; //수정일
	private String status;//상태
	private int totalPrice;//총 가격

}
