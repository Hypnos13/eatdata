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
public class Coupon {
	private int cNo;
	private String id;
	private String name;
	private String content;
	private int disPrice;
	private int minPrice;
	private Timestamp regDate;
	private Timestamp modiDate;
	private Timestamp delDate;
	private String status;

}
