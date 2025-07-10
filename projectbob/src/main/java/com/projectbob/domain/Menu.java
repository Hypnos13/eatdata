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
public class Menu {
	private int mId;
	private int sId;
	private String category;
	private String name;
	private int price;
	private String mInfo;
	private String mPicture;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;
	
	private List<MenuOption> options;
}
