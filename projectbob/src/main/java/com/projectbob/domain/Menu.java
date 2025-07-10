package com.projectbob.domain;

import java.sql.*;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Menu {
	private int mId;
	private String sId;
	private String category;
	private String name;
	private int price;
	private String mInfo;
	private String mPicture;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;

}
