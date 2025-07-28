package com.projectbob.domain;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LikeList {
	
	@JsonProperty("id")
	private String Id;
	@JsonProperty("sId")
	private int sId;
	private Timestamp regDate;
	private String status;

}
