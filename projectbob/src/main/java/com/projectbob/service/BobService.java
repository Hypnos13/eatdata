package com.projectbob.service;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
public class BobService {
	
	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	
	//가게 검색하기
//	public List<Shop> searchList(String keyword){
//		return bobMapper.searchList(keyword);
//	}
	
	// 전체 게시글을 읽어와 반환하는 메서드
	
	public List<Shop> shopList(String category, String keyword){
		log.info("BobService: shopList(), category={}", category);	
		
		return bobMapper.shopList(category,keyword);
	}

	
	// s_id에 해당하는 게시글을 읽어와 반환하는 메서드
	
	public Shop getShopDetail(int sId) {
		log.info("BobService: getShopDetail(int s_id) 호출, 요청 s_id: {}",sId);
		return bobMapper.getShopDetail(sId);
	}
	
	
	
	// menudetail 페이지

	public List<Menu> getMenuListByShopId(int sId){
		
		return bobMapper.getMenuListByShopId(sId);
	}
	
	// 메뉴 옵션 모달창

	public List<MenuOption> getMenuOptionsByMenuId(int mId){
		return bobMapper.getMenuOptionsByMenuId(mId);
	}
	
	//@Override
//	public List<String> getMenuCategoriesByShopId(int s_id){
//		return bobMapper.getMenuCategoriesByShopId(s_id);
//	}
	
	// 가게 번호에 해당하는 리뷰리스트에 사용
	public List<Review> reviewList(int sId){
		return bobMapper.reviewList(sId);
	}

	
	
	
	
}
