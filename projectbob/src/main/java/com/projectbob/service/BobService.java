package com.projectbob.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Shop;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BobService {
	
	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	
	// 전체 게시글을 읽어와 반환하는 메서드
	public List<Shop> shopList(){
		log.info("BobService: shopList()");
		return bobMapper.shopList();
	}
	
	// s_id에 해당하는 게시글을 읽어와 반환하는 메서드
	public Shop getMenuDetail(int s_id) {
		log.info("BobService: getMenuDetail(int s_id)");
		return bobMapper.getMenuDetail(s_id);
	}
	

}
