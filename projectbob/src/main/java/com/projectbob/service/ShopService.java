package com.projectbob.service;

import java.util.*;

import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Service;

import com.projectbob.domain.*;
import com.projectbob.mapper.*;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ShopService {
	
	@Autowired
	private ShopMapper shopMapper;
	
	//메뉴 옵션 등록
	public void insertMenuOption(MenuOption menuOption) {
		shopMapper.insertMenuOption(menuOption);
	}
	
	//메뉴 등록
	public void insertMenu(Menu menu) {
		shopMapper.insertMenu(menu);
	}
	
	//가게 등록
	public void insertShop(Shop shop) {
		shopMapper.insertShop(shop);
	}
	
	//가게 리스트
	public List<Shop> shopList() {
		return shopMapper.shopList();
	}
	
	//가게 정보 불러오기
	public Shop findByOwnerId(String ownerId) {
	    return shopMapper.findByOwnerId(ownerId);
	}
	
	//가게 유무 판단해서 보여주기
	public List<Shop> findShopListByOwnerId(String ownerId) {
	    return shopMapper.findShopListByOwnerId(ownerId);
	}
	
	//다수 가게에서 현재 선택한 가게고정
	public Shop findByShopIdAndOwnerId(Integer sId, String ownerId) {
	    log.debug("가게 조회 요청 - sId: {}, ownerId: {}", sId, ownerId);
	    Shop shop = shopMapper.findByShopIdAndOwnerId(sId, ownerId);
	    if (shop == null) {
	        log.warn("가게를 찾을 수 없습니다. sId={}, ownerId={}", sId, ownerId);
	    }
	    return shop;
	}
	
	//기본정보 수정
	public void updateShopBasicInfo(Shop shop) {
	    // 업데이트 후 로그
	    int result = shopMapper.updateShopBasicInfo(shop);
	    log.info("업데이트 결과: {}", result);
	}
	
	public List<String[]> getOpenTimeList(Shop shop) {
	    String opTime = shop.getOpTime();
	    List<String[]> result = new ArrayList<>();
	    if (opTime == null || opTime.isBlank()) {
	        for (int i = 0; i < 7; i++) result.add(new String[] {"-", "-"});
	        return result;
	    }
	    String[] arr = opTime.split(",");
	    for (String s : arr) {
	        if (s.equals("휴무") || s.isBlank()) {
	            result.add(new String[] {"휴무", ""});
	        } else {
	            String[] t = s.split("-");
	            if (t.length == 2) result.add(new String[] {t[0], t[1]});
	            else result.add(new String[] {"-", "-"});
	        }
	    }
	    while (result.size() < 7) result.add(new String[] {"-", "-"});
	    return result;
	}
	
}
