package com.projectbob.domain;

<<<<<<< HEAD
import java.sql.*;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Menu {
	private int mId;
	private String sId;
=======
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
>>>>>>> develop
	private String category;
	private String name;
	private int price;
	private String mInfo;
	private String mPicture;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;
<<<<<<< HEAD

=======
	
	private List<MenuOption> options;
>>>>>>> develop
}
