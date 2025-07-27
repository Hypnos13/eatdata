package com.projectbob.service;

<<<<<<< HEAD
import java.util.HashMap;
import java.util.List;
import java.util.Map;
=======
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
>>>>>>> d4cc63f3bbc9a24ab2d24813d806be42e6b7a5f2

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

<<<<<<< HEAD
import com.projectbob.domain.LikeList;
import com.projectbob.domain.Member;
=======
import com.projectbob.domain.Cart;
import com.projectbob.domain.CartSummaryDto;
>>>>>>> d4cc63f3bbc9a24ab2d24813d806be42e6b7a5f2
import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Orders;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;
import com.projectbob.dto.NewOrder;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BobService {

	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	
<<<<<<< HEAD
	@Autowired
	private LoginService loginService;
	
=======
	 public CartSummaryDto getCartSummaryForUserOrGuest(String userId, String guestId) {
	        Map<String, Object> params = new HashMap<>();
	        params.put("userId", userId);
	        params.put("guestId", guestId);
>>>>>>> d4cc63f3bbc9a24ab2d24813d806be42e6b7a5f2

	        List<Cart> allCartItems = bobMapper.selectCartByUserOrGuest(params);

	        int totalQuantity = 0;
	        int totalPrice = 0;

	        if (allCartItems != null && !allCartItems.isEmpty()) {
	            // 메인 메뉴 항목의 수량만 총 수량에 합산
	            totalQuantity = allCartItems.stream()
	                                        .filter(item -> item.getCaPid() == null) // ca_pid가 없는 것이 메인 메뉴
	                                        .mapToInt(Cart::getQuantity)
	                                        .sum();
	            // 모든 장바구니 항목의 totalPrice 합산 (메인 메뉴 + 옵션)
	            totalPrice = allCartItems.stream()
	                                     .mapToInt(Cart::getTotalPrice)
	                                     .sum();
	        }

	        return new CartSummaryDto(allCartItems, totalQuantity, totalPrice);
	    }

	
	@Transactional
	public List<Cart> deleteCartItem(Integer caId, String userId, String guestId) {
	    // 1. 매퍼에 전달할 파라미터 맵 생성
	    Map<String, Object> params = new HashMap<>();
	    params.put("userId", userId);
	    params.put("guestId", guestId);

	    // 2. 현재 사용자/게스트의 장바구니 항목 조회
	    List<Cart> currentCartItems = bobMapper.selectCartByUserOrGuest(params);

	    
	    Cart itemToDelete = currentCartItems.stream()
	                                        .filter(item -> caId != null && item.getCaId() != null && item.getCaId().equals(caId))
	                                        .findFirst()
	                                        .orElse(null);

	    if (itemToDelete == null) {
	        throw new IllegalArgumentException("삭제할 장바구니 항목을 찾을 수 없습니다.");
	    }
	    // 옵션 항목은 독립적으로 삭제할 수 없다는 비즈니스 로직 확인
	    if (itemToDelete.getCaPid() != null) { // ca_pid가 있으면 옵션 항목임
	        throw new IllegalArgumentException("옵션 항목은 단독으로 삭제할 수 없습니다. 메인 메뉴 항목을 삭제해주세요.");
	    }

	    params.put("caId",caId);
	    bobMapper.deleteCartItemAndOptions(params);

	    // 5. 삭제 후 업데이트된 전체 장바구니 목록 반환 (여기서도 Map 사용)
	    return bobMapper.selectCartByUserOrGuest(params);
	}
    /**
     * 사용자 또는 비회원의 모든 장바구니 항목을 삭제합니다.
   
     */
	@Transactional
	public List<Cart> deleteAllCartItems(String userId, String guestId) {
	    Map<String, Object> params = new HashMap<>();
	    params.put("userId", userId);
	    params.put("guestId", guestId);

	    // Mybatis 매퍼에 Map 형태로 파라미터 전달
	    bobMapper.deleteAllCartItemsByUserOrGuest(params);

	    return bobMapper.selectCartByUserOrGuest(params);
	}

	
	@Transactional
	public List<Cart> updateCartItemQuantity(Integer caId, Integer newQuantity, String userId, String guestId) {
		if (caId == null || newQuantity == null || (userId == null && guestId == null)) {
			throw new IllegalArgumentException("필수 파라미터(caId, quantity, id/guestId)가 누락되었습니다.");
		}
		if (newQuantity < 1) {
			throw new IllegalArgumentException("수량은 1 이상이어야 합니다.");
		}

		Map<String, Object> selectParams = new HashMap<>();
		selectParams.put("userId", userId);
		selectParams.put("guestId", guestId);
		List<Cart> currentFullCartItems = bobMapper.selectCartByUserOrGuest(selectParams);

		Cart itemToUpdate = currentFullCartItems.stream()
				.filter(item -> item.getCaId() != null && item.getCaId().equals(caId))
				.findFirst()
				.orElse(null);

		if (itemToUpdate == null) {
			throw new IllegalArgumentException("업데이트할 장바구니 항목을 찾을 수 없습니다.");
		}

		// 메인 메뉴 항목이든 옵션 항목이든, 해당 항목의 순수 단가를 기반으로 totalPrice를 계산
		int itemBasePrice;
		if (itemToUpdate.getCaPid() == null) { // 메인 메뉴
			itemBasePrice = itemToUpdate.getMenuPrice(); // 순수 메뉴 단가
		} else { // 옵션 항목
			itemBasePrice = itemToUpdate.getOptionPrice(); // 순수 옵션 단가
		}

		int newTotalPriceForItem = itemBasePrice * newQuantity; // 새로운 총 가격 계산

		// 해당 장바구니 항목의 수량과 총 가격 업데이트
		Map<String, Object> updateItemParams = new HashMap<>();
		updateItemParams.put("caId", caId);
		updateItemParams.put("quantity", newQuantity);
		updateItemParams.put("totalPrice", newTotalPriceForItem); // 새로 계산된 totalPrice
		updateItemParams.put("userId", userId);
		updateItemParams.put("guestId", guestId);
		bobMapper.updateCartItemQuantity(updateItemParams);

		// 중요: 메인 메뉴의 수량 변경 시, 해당 메인 메뉴에 딸린 모든 옵션들의 수량과 totalPrice도 함께 업데이트
		if (itemToUpdate.getCaPid() == null) { // 업데이트된 항목이 메인 메뉴인 경우에만
			for (Cart item : currentFullCartItems) {
				if (item.getCaPid() != null && item.getCaPid().equals(caId)) { // 현재 메인 메뉴에 연결된 옵션인 경우
					int newOptionTotalPrice = item.getOptionPrice() * newQuantity; // 옵션 단가 * 새로운 수량

					Map<String, Object> updateOptionParams = new HashMap<>();
					updateOptionParams.put("caId", item.getCaId()); // 옵션의 ca_id
					updateOptionParams.put("quantity", newQuantity); // 새로운 수량
					updateOptionParams.put("totalPrice", newOptionTotalPrice); // 새로 계산된 옵션의 totalPrice
					updateOptionParams.put("userId", userId);
					updateOptionParams.put("guestId", guestId);
					bobMapper.updateCartItemQuantity(updateOptionParams);
				}
			}
		}

		// 최종적으로 업데이트된 전체 장바구니 목록을 다시 조회하여 반환
		return bobMapper.selectCartByUserOrGuest(selectParams);
	}
	
	 /**
     * 사용자 또는 비회원 ID로 메인 메뉴 장바구니 항목만 조회합니다.
     */
	public List<Cart> getMainCartItemsByUser(String userId, String guestId) {
	    Map<String, Object> params = new HashMap<>();
	    params.put("userId", userId);
	    params.put("guestId", guestId);
	    return bobMapper.selectMainCartItemsByUserOrGuest(params); // Map 형태로 파라미터 전달
	}
	
	 /* 사용자 또는 비회원 ID로 모든 장바구니 항목을 조회합니다.
     */
	public CartSummaryDto getCartByUser(String userId, String guestId) {
	    Map<String, Object> params = new HashMap<>();
	    params.put("userId", userId);
	    params.put("guestId", guestId);
	    

	    List<Cart> allCartItems = bobMapper.selectCartByUserOrGuest(params);
	    
	    int totalQuantity = allCartItems.stream()
				.filter(item -> item.getCaPid() == null)
				.mapToInt(Cart::getQuantity)
				.sum();

		// 전체 총액은 각 카트 항목의 totalPrice를 모두 합산합니다.
		// 이 totalPrice는 DB에 (단가 * 수량)으로 정확히 저장되어 있다고 가정합니다.
		int overallTotalPrice = allCartItems.stream()
				.mapToInt(Cart::getTotalPrice)
				.sum();

		log.info("장바구니 총 수량: {}, 계산된 최종 총액: {}", totalQuantity, overallTotalPrice);
		// --- 수정된 부분 끝 ---

		return new CartSummaryDto(allCartItems, totalQuantity, overallTotalPrice);
	    

	}
	
	/**
     * 장바구니 항목을 처리하고 DB에 추가합니다.
     * 전달받은 각 메뉴 선택에 대해 메인 메뉴 항목을 먼저 삽입하고,
     * 생성된 ca_id를 옵션 항목의 ca_pid로 사용하여 옵션들을 삽입합니다.
     */
	@Transactional
	public void processAndAddCartItems(List<Cart> cartItems, String userId, String guestId) {
		Integer parentCaId = null; // 메인 메뉴의 ca_id를 저장할 변수

		for (Cart c : cartItems) {
			// 메인 메뉴 항목인지, 옵션 항목인지 구분
			if (c.getMoIds() == null || c.getMoIds().isEmpty()) { // moIds가 없으면 메인 메뉴 항목으로 간주
				// --- 수정된 부분 시작 ---
				// 1) 메인 메뉴 아이템 삽입 (ca_pid는 NULL)
				Cart mainMenuCart = new Cart();
				mainMenuCart.setMId(c.getMId());
				mainMenuCart.setMoId(null);
				mainMenuCart.setCaPid(null); // 메인 메뉴는 최상위 항목
				mainMenuCart.setQuantity(c.getQuantity());
				mainMenuCart.setSId(c.getSId());

				// 프론트에서 계산된 순수 메뉴 단가와 총 가격을 그대로 사용
				mainMenuCart.setUnitPrice(c.getMenuPrice()); // mainMenuCart의 unitPrice는 순수 메뉴 단가
				mainMenuCart.setTotalPrice(c.getMenuPrice() * c.getQuantity()); // mainMenuCart의 totalPrice는 순수 메뉴 가격 * 수량

				mainMenuCart.setId(userId);
				mainMenuCart.setGuestId(guestId);

				bobMapper.insertCart(mainMenuCart);
				parentCaId = mainMenuCart.getCaId(); // 생성된 ca_id를 부모 ID로 저장
			
			} else {
			
				// 2) 옵션 아이템 삽입 (ca_pid는 메인 메뉴의 ca_id)
				if (parentCaId == null) {
					log.error("옵션 항목을 추가하기 전에 부모 메인 메뉴 항목의 caId를 찾을 수 없습니다. (mId: {})", c.getMId());
					throw new IllegalStateException("옵션 항목은 메인 메뉴 없이 추가될 수 없습니다.");
				}

				// 프론트에서 넘어온 첫 번째 moId와 optionPrice를 사용 (각 옵션별로 별도의 Cart 객체가 넘어온다고 가정)
				Integer moId = c.getMoIds().get(0); // 첫 번째 (유일한) 옵션 ID
				Integer optionPrice = c.getOptionPrices().get(0); // 첫 번째 (유일한) 옵션 가격

				Cart optionCart = new Cart();
				optionCart.setMId(c.getMId()); // 어떤 메뉴의 옵션인지 mId를 가집니다.
				optionCart.setMoId(moId);
				optionCart.setCaPid(parentCaId); // 부모 ca_id를 설정하여 메인 메뉴와 연결
				optionCart.setQuantity(c.getQuantity());
				optionCart.setSId(c.getSId());

				// 프론트에서 계산된 순수 옵션 단가와 총 가격을 그대로 사용
				optionCart.setUnitPrice(optionPrice); // optionCart의 unitPrice는 순수 옵션 단가
				optionCart.setTotalPrice(optionPrice * c.getQuantity()); // optionCart의 totalPrice는 순수 옵션 단가 * 수량

				optionCart.setId(userId);
				optionCart.setGuestId(guestId);

				bobMapper.insertCart(optionCart);
			}
		}
		log.info("Cart items processed and added to DB.");
	}
		
	  
	
	
	
	// 전체 게시글을 읽어와 반환하는 메서드

	public List<Shop> shopList(String category, String keyword) {
		log.info("BobService: shopList(), category={}", category);

		return bobMapper.shopList(category, keyword);
	}

	// s_id에 해당하는 게시글을 읽어와 반환하는 메서드

	public Shop getShopDetail(int sId) {
		log.info("BobService: getShopDetail(int s_id) 호출, 요청 s_id: {}", sId);
		return bobMapper.getShopDetail(sId);
	}

	public List<Menu> getMenuListByShopId(int sId) {

		return bobMapper.getMenuListByShopId(sId);
	}

	// 메뉴 옵션 모달창

	public List<MenuOption> getMenuOptionsByMenuId(int mId) {
		return bobMapper.getMenuOptionsByMenuId(mId);
	}

	// @Override
//	public List<String> getMenuCategoriesByShopId(int s_id){
//		return bobMapper.getMenuCategoriesByShopId(s_id);
//	}

	// 가게 번호에 해당하는 리뷰리스트에 사용
<<<<<<< HEAD
	/*
	 * public List<Review> reviewList(int sId){ return bobMapper.reviewList(sId); }
	 */	
			public List<Review> getReviewList(int sId){
	    return bobMapper.getReviewList(sId);
	}

	
	// 가게 (하트) 증가
=======
	public List<Review> reviewList(int sId) {
		return bobMapper.reviewList(sId);
	}

	// 가게 찜 (하트) 증가
>>>>>>> d4cc63f3bbc9a24ab2d24813d806be42e6b7a5f2
	public int plusHeart(int sId) {
		return bobMapper.plusHeart(sId);
	}

	public Integer getHeartCount(int sId) {
		return bobMapper.getHeartCount(sId);
	}
<<<<<<< HEAD
	
	// 가게 찜하기
	public int isLiked(LikeList likeList) {
		return bobMapper.isLiked(likeList);
	}
	
	// 찜 등록
	public int addLikeList(LikeList likeList) {
		return bobMapper.addLikeList(likeList);
	}
	
	// 찜 삭제
	public int deleteLikeList(LikeList likeList) {
		return bobMapper.deleteLikeList(likeList);
	}
	
	// 가게 찜
	public int shopCountLike(int sId) {
		return bobMapper.shopCountLike(sId);
	}
			
	// 찜 버튼 토글
	@Transactional
	public Map<String, Object> toggleLike(LikeList likeList) {
		boolean exists = bobMapper.isLiked(likeList) > 0;
		int sId = likeList.getSId();
		int newCount;
		
		if (exists) {
			bobMapper.deleteLikeList(likeList);
			bobMapper.decrementHeart(likeList.getSId());
			
		} else {
			bobMapper.addLikeList(likeList);
			bobMapper.incrementHeart(likeList.getSId());
			
		}		
		newCount = bobMapper.getHeartCount(likeList.getSId());
		return Map.of(
				"liked", !exists,
				"heartCount", newCount
				);
	}
	
	// 내가 찜한 가게 목록
	public List<Integer> getLikeShopList(String userId){
		return bobMapper.getLikeShopList(userId);
	}
	
	
=======

>>>>>>> d4cc63f3bbc9a24ab2d24813d806be42e6b7a5f2
	// 댓글 등록하는 메서드
	public void addReview(Review review) {
		bobMapper.addReview(review);
	}
<<<<<<< HEAD
	
	//댓글 수정하는 메서드
	public void updateReview(Review review) {
		bobMapper.updateReview(review);
	}
	
	//댓글 삭제하는 메서드
	public void deleteReview(int rNo) {
		bobMapper.deleteReview(rNo);
	}
	
	// 대댓글 리스트
	/*
	 * public ReviewReply reviewreplyList(int rNo){ return
	 * bobMapper.reviewreplyList(rNo); }
	 */
	
	// 대댓글 등록/수정하는 메서드	
	  public void addReviewReply(ReviewReply reviewreply) {
		  int count = bobMapper.countReviewReply(reviewreply.getRNo());
		  if (count == 0) {
			  bobMapper.addReviewReply(reviewreply);
		  } else {
			  bobMapper.updateReviewReply(reviewreply);
		  }
	   }
	 
	// 가게 번호에 해당하는 전체 대댓글을 rNo(리뷰 번호) 기준으로 Map에 담아 반환
	public Map<Integer, ReviewReply> getReviewReplyMap(int sId) {
	    List<ReviewReply> replyList = bobMapper.getReviewReplyList(sId); // getReviewReplyList는 sId(가게) 전체 대댓글 가져옴
	    Map<Integer, ReviewReply> map = new HashMap<>();
	    for (ReviewReply reply : replyList) {
	        map.put(reply.getRNo(), reply); // rNo 기준 맵핑
	    }
	    return map;
	}

	// 대댓글 수정하기
	public void updateReviewReply(ReviewReply reviewreply) {
		bobMapper.updateReviewReply(reviewreply);
	}

	// 대댓글 삭제하기
	public void deleteReviewReply(int rrNo) {
		bobMapper.deleteReviewReply(rrNo);
	}
	
	
	// 결제정보 가져오기
	/*
	 * public NewOrder getNewOrder(int orderId) { Orders o =
	 * bobMapper.selectOrderId(orderId); String menuName =
	 * bobMapper.selectMenuNameByOrderId(orderId); NewOrder dto = NewOrder.builder()
	 * .orderId(o.getONo()) .shopId(o.getSId()) .menuName(menuName)
	 * .quantity(o.getQuantity()) .totalPrice(o.getTotalPrice())
	 * .address(o.getOAddress())
	 * .phone(loginService.getMember(o.getId()).getPhone()) .request(o.getRequest())
	 * .status("PENDING") .build(); return dto; }
	 */
	
	
=======



>>>>>>> d4cc63f3bbc9a24ab2d24813d806be42e6b7a5f2
}
