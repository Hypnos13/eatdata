package com.projectbob.domain;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

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
	@JsonProperty("s_id")
	private int sId;
	private int mId;
	private String content;
	private int rating;
	private String rPicture;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;
	
	private String menuName;
	
	private List<ReviewReply> replies = new ArrayList<>();
}
