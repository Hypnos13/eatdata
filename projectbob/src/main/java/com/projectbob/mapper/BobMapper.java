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
	
    
    /**
     * 장바구니 항목의 수량을 업데이트합니다.
    
     */
    int updateCartItemQuantity(@Param("caId") Integer caId, @Param("quantity") Integer quantity,
                               @Param("totalPrice") Integer totalPrice, @Param("userId") String userId,
                               @Param("guestId") String guestId);

    /**
     * 장바구니 개별 항목과 그에 연결된 모든 옵션 항목을 삭제합니다.
  
     */
    int deleteCartItemAndOptions(@Param("caId") Integer caId, @Param("userId") String userId, @Param("guestId") String guestId);

    /**
     * 사용자 또는 비회원의 모든 장바구니 항목을 삭제합니다.
 
     */
    int deleteAllCartItemsByUserOrGuest(@Param("userId") String userId, @Param("guestId") String guestId);
    
    /**
     * 장바구니 항목을 DB에 삽입합니다.
     * useGeneratedKeys="true"와 keyProperty="caId" 설정으로 삽입 후 생성된 ca_id가 Cart 객체에 설정됩니다.
 
     */
    void insertCart(Cart cart);

    /**
     * 사용자 ID 또는 비회원 ID로 모든 장바구니 항목을 조회합니다.
     * 메인 메뉴와 옵션 항목을 모두 포함합니다.
     */
    List<Cart> selectCartByUserOrGuest(@Param("userId") String userId, @Param("guestId") String guestId);
    
    
    /**
     * 사용자 ID 또는 비회원 ID로 메인 메뉴 장바구니 항목만 조회합니다.
     * ca_pid가 NULL인 항목(즉, 메인 메뉴)만 반환합니다.
     */
    List<Cart> selectMainCartItemsByUserOrGuest(@Param("userId") String userId, @Param("guestId") String guestId);

	public List<Shop> shopList(@Param("category") String category,@Param("keyword") String keyword); //shopList 페이지
	
	public Shop getShopDetail(int sId); // s_id를 받아 Shop 객체 반환
		
	// menuDetail 페이지에 사용
	public List<Menu> getMenuListByShopId(int sId); 	
	
	// 메뉴옵션 선택하는 모달창에서 사용
	public List<MenuOption> getMenuOptionsByMenuId(@Param("mId")int mId);		
	public List<String> getMenuCategoriesByShopId(int sId);
	
	// 가게 번호에 해당하는 리뷰리스트에 사용
	public List<Review> reviewList(int sId);

	
	// shop 하트 증가	
		int plusHeart(int sId);
		Integer getHeartCount(int sId);
		
	// 댓글을 DB에 등록하는 메서드
	public void addReview(Review review);
	

	

}

