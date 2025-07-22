package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.projectbob.domain.Cart;
import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	
	Cart findCartItem(@Param("id") String id, @Param("mId") int mId, @Param("moId") int moId);

	int insertCart(Cart cart);

	int updateCart(Cart cart);

	public List<Shop> shopList(@Param("category") String category,@Param("keyword") String keyword); //shopList 페이지
	
	public Shop getShopDetail(int sId); // s_id를 받아 Shop 객체 반환
		
	// menuDetail 페이지에 사용
	public List<Menu> getMenuListByShopId(int sId); 	
	
	// 메뉴옵션 선택하는 모달창에서 사용
	public List<MenuOption> getMenuOptionsByMenuId(int mId);		
	public List<String> getMenuCategoriesByShopId(int sId);
	
	// 가게 번호에 해당하는 리뷰리스트에 사용
	public List<Review> reviewList(int sId);

	
	// shop 하트 증가	
		int plusHeart(int sId);
		Integer getHeartCount(int sId);
		
	// 댓글을 DB에 등록하는 메서드
	public void addReview(Review review);
	

	

}

