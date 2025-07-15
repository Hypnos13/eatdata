package com.projectbob.mapper;

import java.util.*;

import org.apache.ibatis.annotations.*;

import com.projectbob.domain.*;

@Mapper
public interface ShopMapper {
	
	//메뉴 옵션 등록
	public void insertMenuOption(MenuOption menuOption);
	
	//메뉴 등록
	public void insertMenu(Menu menu);
	
	//가게 등록
	public void insertShop(Shop shop);
	
	//가게리스트
	public List<Shop> shopList();

	//가게 정보
	public Shop findByOwnerId(String ownerId);
	
	//가게 유무 확인후 보여주기
	List<Shop> findShopListByOwnerId(String ownerId);
	
}
