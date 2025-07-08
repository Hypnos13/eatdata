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
public class Client {
	private String id;
	private String name;
	private String nickname;
	private String pass;
	private String phone;
	private String address1;
	private String address2;
	private String email;
	private int point;
	private String birthday;
	private String division;
	private Timestamp reg_date;
	private Timestamp modi_date;
}
