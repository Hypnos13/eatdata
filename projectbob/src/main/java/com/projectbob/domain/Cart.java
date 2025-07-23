package com.projectbob.domain;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonProperty;

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
	private int caId;// 카트아이디
	@JsonProperty("mId")
	private int mId;// 메뉴아이디
	@JsonProperty("moId")
	private Integer moId;// 메뉴옵션 아이디
	@JsonProperty("id")
	private String id; // 회원아이디
	@JsonProperty("guestId")
	private String guestId; // 비회원 게스트아이디
	@JsonProperty("sId")
	private int sId;// 가게 아이디
	private int quantity; // 수량
	private Timestamp regDate; // 생성일
	private Timestamp modiDate; // 수정일
	private String status;// 상태
	private int totalPrice;// 총 가격

	private String menuName; // 메뉴 이름
	private int menuPrice; // 메뉴 기본 가격

	private String optionName; // 메뉴 옵션 이름
	private int optionPrice;

}
