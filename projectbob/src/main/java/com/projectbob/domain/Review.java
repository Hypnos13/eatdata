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
public class Review {
	private int rNo;
	private String id;
	private int sId;
	private int mId;
	private String content;
	private int rating;
	private String rPicture;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;

}
