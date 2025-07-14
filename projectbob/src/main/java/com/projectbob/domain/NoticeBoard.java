package com.projectbob.domain;

import java.sql.Date;
import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NoticeBoard {

	int no;
	String title, content, disivion;
	Timestamp regDate, modiDate, startDay, endDay;
	
}
