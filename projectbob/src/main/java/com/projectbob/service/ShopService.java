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
	
	
	
}
