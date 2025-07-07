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
	private int m_id;
	private int s_id;
	private String category;
	private String name;
	private int price;
	private String m_info;
	private String m_picture;
	private int liked;
	private Timestamp reg_date;
	private Timestamp modi_date;
	
	private List<MenuOption> options;
}
