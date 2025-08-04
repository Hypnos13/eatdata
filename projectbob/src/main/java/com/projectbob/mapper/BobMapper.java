package com.projectbob.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;



import com.projectbob.domain.LikeList;
import com.projectbob.domain.Addressbook;

import com.projectbob.domain.Cart;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Orders;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	
	Menu getMenuCal(int mId);
	
	//주문 읽기
	List<Orders> findOrdersByStatusAndShop(@Param("status") String status, @Param("sId") int sId);
	
	// 주문페이지에서 주문완료 페이지로 보내기
	public int insertOrder(Orders order);
	

	 List<Addressbook> findAddressesById(@Param("userId") String userId);

	  /**
     * 특정 장바구니 항목(caId)의 상세 정보를 조회합니다.
     * (메뉴의 m_id와 옵션의 mo_id를 포함)
     */
    Cart selectCartItemDetails(Integer caId);

    /**
     * 특정 메뉴의 기본 가격을 조회합니다.
     */
    Integer selectMenuBasePrice(Integer mId);

    /**
     * 특정 장바구니 메인 항목(caId)에 연결된 모든 옵션들의 기본 가격 합계를 조회합니다.
     */
    Integer selectTotalOptionPriceForCartItem(Integer caId);
    
    /**
     * 장바구니 항목의 수량을 업데이트합니다.
    
     */
    int updateCartItemQuantity(Map<String, Object> params);

    /**
     * 장바구니 개별 항목과 그에 연결된 모든 옵션 항목을 삭제합니다.
  
     */
    void deleteCartItemAndOptions(Map<String, Object> params);

    /**
     * 사용자 또는 비회원의 모든 장바구니 항목을 삭제합니다.
 
     */
    int deleteAllCartItemsByUserOrGuest(Map<String, Object> params);
    
    /**
     * 장바구니 항목을 DB에 삽입합니다.
     * useGeneratedKeys="true"와 keyProperty="caId" 설정으로 삽입 후 생성된 ca_id가 Cart 객체에 설정됩니다.
 
     */
    void insertCart(Cart cart);

    /**
     * 사용자 ID 또는 비회원 ID로 모든 장바구니 항목을 조회합니다.
     * 메인 메뉴와 옵션 항목을 모두 포함합니다.
     */
    List<Cart> selectCartByUserOrGuest(Map<String, Object> params);
    
    
    /**
     * 사용자 ID 또는 비회원 ID로 메인 메뉴 장바구니 항목만 조회합니다.
     * ca_pid가 NULL인 항목(즉, 메인 메뉴)만 반환합니다.
     */
    List<Cart> selectMainCartItemsByUserOrGuest(Map<String, Object> params);

	public List<Shop> shopList(@Param("category") String category,@Param("keyword") String keyword); //shopList 페이지
	
	public Shop getShopDetail(int sId); // s_id를 받아 Shop 객체 반환
		
	// menuDetail 페이지에 사용
	public List<Menu> getMenuListByShopId(int sId); 	
	
	// 메뉴옵션 선택하는 모달창에서 사용
	public List<MenuOption> getMenuOptionsByMenuId(@Param("mId")int mId);		
	public List<String> getMenuCategoriesByShopId(int sId);
	
	// 가게 번호에 해당하는 리뷰리스트에 사용
	public List<Review> reviewList(int sId);
	public List<Review> getReviewList(int sId);

	
	// shop 하트 증가	
		int plusHeart(int sId);
		Integer getHeartCount(int sId);
		
	// 찜
	public int isLiked(LikeList likeList);
	
	// 찜 추가
	public int addLikeList(LikeList likeList);
	
	// 찜 삭제
	public int deleteLikeList(LikeList likeList);
	
	// 가게 찜 수
	public int shopCountLike(@Param("sId") int sId);
	
	// 찜 추가 시 shop.heart + 1 , - 1
	public int incrementHeart(@Param("sId") int sId);
	public int decrementHeart(@Param("sId") int sId);
	
	// 내가 찜한 가게 목록
	public List<Integer> getLikeShopList(String userId);
		
	// 댓글을 DB에 등록하는 메서드
	public void addReview(Review review);
	
	//댓글 수정하는 메서드
	public void updateReview(Review review);
	
	//댓글 삭제하는 메서드
	public void deleteReview(int rNo);
	
	// 댓글에 달린 대댓글 가져오기 메서드
	public ReviewReply reviewreplyList(@Param("rNo") int rNo);
	
	// 대댓글 DB에 등록하는 메서드
	public void addReviewReply(ReviewReply reviewreply);
	
	// 가게 전체 대댓글
	public List<ReviewReply> getReviewReplyList(@Param("sId") int sId);
	
	// 대댓글 수정
	public void updateReviewReply(ReviewReply reviewreply);
	
	// 대댓글 삭제
	public void deleteReviewReply(@Param("rrNo") int rrNo);
	
	// 대댓글 개수조회
	public int countReviewReply(@Param("rNo") int rNo);
	
	// 주문 번호에 해당하는 주문 레코드를 DB에서 가져오기
	public Orders selectOrderId(@Param("orderId") int orderId);
	public Orders selectOrderByPaymentUid(@Param("paymentUid") String paymentUid);
	
	// 회원이 특정 가게에서 주문한 내역이 있는지 확인
	public int countOrdersByUserIdAndShopId(@Param("userId") String userId, @Param("sId") int sId);

	// 회원이 특정 가게에서 리뷰 가능한 주문 목록 조회
	public List<Orders> getReviewableOrders(@Param("userId") String userId, @Param("sId") int sId);
	
	// 특정 주문 번호에 대한 리뷰 개수 조회
	public int countReviewByOrderNo(@Param("oNo") int oNo);
	
	// 특정 주문 번호와 사용자 ID에 대한 리뷰 개수 조회
	public int countReviewByOrderNoAndUserId(@Param("userId") String userId, @Param("oNo") int oNo);

	// 주문 번호로 주문 정보 조회
	public Orders selectOrderByOrderNo(@Param("orderId") String orderId);

	// 메뉴 이름으로 mId 조회
	public Integer selectMenuIdByName(@Param("menuName") String menuName);
	

}

