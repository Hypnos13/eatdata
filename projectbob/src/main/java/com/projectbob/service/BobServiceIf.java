package com.projectbob.service;

import java.util.List;

import com.projectbob.domain.Menu;
import com.projectbob.domain.Shop;

public interface BobServiceIf {
	Shop getShopDetail(int s_id);
	List<Shop> shopList();
	List<Menu> getMenuListOption(int s_id);
	List<String> getMenuCategoriesByShopId(int s_id);

}
