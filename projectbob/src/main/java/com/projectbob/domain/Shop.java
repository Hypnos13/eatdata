package com.projectbob.domain;


import java.sql.*;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Shop {
	private int sId;
	private String id;
	private String name;
	private String phone;
<<<<<<< HEAD
	private String zipcode;
	private String address1;
	private String address2;
	private String owner;
	private int s_number;
	private String category;
	private double rating;
	private int heart;
	private String op_time;
	private String off_day;
	private String min_price;
	private String s_license;
	private String s_cert;
=======
	private String address1;
	private String address2;
	private String owner;
	private int sNumber;
	private String category;
	private double rating;
	private int heart;
	private String opTime;
	private String offDay;
	private String minPrice;
	private String sLicense;
	private String sCert;
>>>>>>> seon
	private String status;
	private String info;
	private String notice;
	private String sInfo;
	private Timestamp regDate;
	private Timestamp modiDate;

}
