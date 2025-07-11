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
	private int caId;
	private int mId;
	private int moId;
	private String id;
	private int sId;
	private int quantity;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;
	private int oNo;
	private int totalPrice;

}
