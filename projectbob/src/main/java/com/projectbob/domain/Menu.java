package com.projectbob.domain;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Menu {
	private int mId;
	private int sId;
	private String category;
	private String name;
	private int price;
	private String mInfo;
	private String mPictureUrl;
	private int liked;
	private Timestamp regDate;
	private Timestamp modiDate;
	private String status;

	private List<MenuOption> options;
	
<<<<<<< HEAD
	 private BigDecimal calories; // 열량
	 private BigDecimal carbs;    // 탄수화물
	 private BigDecimal protein;  // 단백질
	 private BigDecimal fat;      // 지방
	 private BigDecimal sfa;      // 포화지방
	 private BigDecimal sugar;    // 당
	 private BigDecimal sodium;   // 나트륨
	 private BigDecimal servingSize; // 제공량
=======
	private Double calories;
    private Double carbs;
    private Double protein;
    private Double fat;
    private Double sfa;
    private Double sugar;
    private Double sodium;
    private Integer servingSize;
>>>>>>> hong

}
