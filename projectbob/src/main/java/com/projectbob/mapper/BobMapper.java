package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	public List<Shop> shopList();

}
