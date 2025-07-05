package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	public List<Shop> shopList(); //shopList 페이지
	
	public Shop getMenuDetail(int s_id); // s_id를 받아 Shop 객체 반환
}
