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
public class Member {

	private String id, name, nickname, pass, phone, address1, address2, email, birthday, division, isuse;
	private int point;
	private Timestamp regDate, modiDate;
	
}
