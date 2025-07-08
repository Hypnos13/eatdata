package com.projectbob.mapper;

import java.util.*;

import org.apache.ibatis.annotations.*;

import com.projectbob.domain.*;

@Mapper
public interface ShopMapper {
	public List<Shop> shopList();

}
