package com.projectbob.domain;

import java.sql.Timestamp;

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
public class ReviewReply {
	private int rrNo;
	@JsonProperty("rNo")
	private int rNo;
	@JsonProperty("sId")
	private int sId;
	private String id;
	private String content;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;

}
