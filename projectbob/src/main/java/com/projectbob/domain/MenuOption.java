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
public class MenuOption {
	private int moId;
	private int mId;
	private String mOption;
	private String content;
	private int price;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;
}
