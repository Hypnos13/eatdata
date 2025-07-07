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
public class Shop {
	private int s_id;
	private String id;
	private String name;
	private String phone;
	private String address1;
	private String address2;
	private String s_number;
	private String category;
	private double rating;
	private int heart;
	private String op_time;
	private String off_day;
	private String min_price;
	private String s_license;
	private String s_cert;
	private String status;
	private String info;
	private String notice;
	private String s_info;
	private Timestamp reg_date;
	private Timestamp modi_date;

}
