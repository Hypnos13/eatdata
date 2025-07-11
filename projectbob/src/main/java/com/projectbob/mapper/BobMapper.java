package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	public List<Shop> shopList(String category); //shopList 페이지
	
	public Shop getShopDetail(int sId); // s_id를 받아 Shop 객체 반환
		
	// menuDetail 페이지에 사용
	public List<Menu> getMenuListByShopId(int sId); 	
	
	// 메뉴옵션 선택하는 모달창에서 사용
	public List<MenuOption> getMenuOptionsByMenuId(int mId);
	
	
	public List<String> getMenuCategoriesByShopId(int sId);
}

