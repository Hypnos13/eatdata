package com.projectbob.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
public class BobService implements BobServiceIf{
	
	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	
	// 전체 게시글을 읽어와 반환하는 메서드
	@Override
	public List<Shop> shopList(){
		log.info("BobService: shopList()");
		return bobMapper.shopList();
	}
	
	// s_id에 해당하는 게시글을 읽어와 반환하는 메서드
	@Override
	public Shop getShopDetail(int s_id) {
		log.info("BobService: getShopDetail(int s_id)");		
		return bobMapper.getShopDetail(s_id);
	}
	
	
	
	// menudetail 페이지
	@Override
	public List<Menu> getMenuListOption(int s_id){
		List<Menu> menuList = bobMapper.getMenuListByShopId(s_id);
		for (Menu menu : menuList) {
			//각 메뉴의 ID로 해당 메뉴의 옵션 목록을 가져와 Menu 객체에 설정
			List<MenuOption> options = bobMapper.getMenuOptionsByMenuId(menu.getM_id());
			menu.setOptions(options);
		}
		return menuList;
	}
	@Override
	public List<String> getMenuCategoriesByShopId(int s_id){
		return bobMapper.getMenuCategoriesByShopId(s_id);
	}

	
	
	
	
}
