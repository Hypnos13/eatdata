package com.projectbob.mapper;

import java.util.*;

import org.apache.ibatis.annotations.*;

import com.projectbob.domain.*;

@Mapper
public interface ShopMapper {
	
	//가게 등록
	public void insertShop(Shop shop);
	
	//가게리스트
	public List<Shop> shopList();
	
}
