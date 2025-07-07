package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	public List<Shop> shopList(); //shopList 페이지
	
	public Shop getShopDetail(int s_id); // s_id를 받아 Shop 객체 반환
		
	// menuDetail 페이지에 사용
	public List<Menu> getMenuListByShopId(int s_id); 	
	public List<MenuOption> getMenuOptionsByMenuId(int m_id);
	public List<String> getMenuCategoriesByShopId(int s_id);
}

