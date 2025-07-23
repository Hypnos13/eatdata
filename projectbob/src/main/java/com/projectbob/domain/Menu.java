package com.projectbob.domain;

import java.sql.*;
import java.util.*;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Menu {
	private int mId;
	private int sId;
	private String category;
	private String name;
	private int price;
	private String mInfo;
	private String mPictureUrl;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;

	private List<MenuOption> options;

}
