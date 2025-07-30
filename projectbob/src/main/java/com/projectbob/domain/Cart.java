package com.projectbob.domain;

import java.sql.Timestamp;
import java.util.List;

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
	// 데이터베이스 컬럼에 직접 매핑되는 필드들
	  @JsonProperty("caId")
	    private Integer caId; // 카트 아이디 (PRIMARY KEY, AUTO_INCREMENT이므로 Integer로 선언하여 null 가능하게)
	    @JsonProperty("caPid")
	    private Integer caPid; // 부모 카트 아이디 (메인 메뉴와 옵션 연결용, NULL 허용)
	    @JsonProperty("mId")
	    private Integer mId; // 메뉴 아이디 (NOT NULL, int 대신 Integer로 선언하여 null 가능하게)
	    @JsonProperty("moId")
	    private Integer moId; // 메뉴 옵션 아이디 (NULL 허용)
	    @JsonProperty("id")
	    private String id; // 회원 아이디 (NULL 허용)
	    @JsonProperty("guestId")
	    private String guestId; // 비회원 게스트 아이디 (NULL 허용)
	    @JsonProperty("sId")
	    private Integer sId; // 가게 아이디 (NOT NULL, int 대신 Integer로 선언하여 null 가능하게)
	    private Integer quantity; // 수량 (int 대신 Integer로 선언하여 null 가능하게)
	    private Timestamp regDate; // 등록일
	    private Timestamp modiDate; // 수정일
	    private String status; // 상태 (예: '일반', '주문완료')
	    private Integer totalPrice; // 이 카트 항목의 총 가격 (메뉴 가격 * 수량 또는 옵션 가격 * 수량)
	    
	    private Integer unitPrice;

	 
	    private String menuName; 
	    private Integer menuPrice; 
	    private String optionName; 
	    private Integer optionPrice; 
	    private String optionGroupName; 
	    private Integer itemGroupTotalPrice;

	    private List<Integer> moIds;
	    private List<Integer> optionPrices;

}
