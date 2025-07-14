package com.projectbob.domain;


import java.sql.*;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Shop {
	private int sId;
	private String id;
	private String name;
	private String phone;
	private String zipcode;
	private String address1;
	private String address2;
	private String owner;
	private int sNumber;
	private String category;
	private String sPictureURL;
	private double rating;
	private int heart;
	private String opTime;
	private String offDay;
	private String minPrice;
	private String sLicenseURL;
	private String sCertURL;
	private String status;
	private String info;
	private String notice;
	private String sInfo;
	private Timestamp regDate;
	private Timestamp modiDate;

}
