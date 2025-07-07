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
public class MenuOption {
	private int mo_id;
	private int m_id;
	private String m_option;
	private String content;
	private int price;
	private Timestamp reg_date;
	private Timestamp modi_date;
	private String status;
}
