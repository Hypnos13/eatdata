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
	private int oNo;
	private int sId;
	private String id;
	private int totalPrice;
	private String payment;
	private String oAddress;
	private String request;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;
	private int quantity;

}
