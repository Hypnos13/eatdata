package com.projectbob.domain;

import java.sql.Timestamp;
import java.util.List;

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
public class CartAddRequestDto {
	 private String uId;
	    private int mId; // 메뉴 ID
	    private int sId; // 가게 ID
	    private int quantity; // 수량
	    private List<MenuOption> optionList; // 메뉴 옵션 리스트
}
