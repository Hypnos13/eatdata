package com.projectbob.service;

import java.util.List;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.Shop;

public interface BobServiceIf {
	Shop getShopDetail(int sId);
	List<Shop> shopList(String category);
	List<Menu> getMenuListByShopId(int sId);
	List<MenuOption> getMenuOptionsByMenuId(int mId);
//	List<Menu> getMenuListOption(int sId);
//	List<String> getMenuCategoriesByShopId(int sId);
	List<Review> reviewList(int sId);

}
