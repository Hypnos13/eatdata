package com.projectbob.domain;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Member {

	private String id, name, nickname, pass, phone, address1, address2, email, birthday, disivion;
	private int pont;
	private Timestamp regdate, modi_date;
	
}
