package com.projectbob.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.projectbob.domain.LikeList;
import com.projectbob.domain.Member;

import com.projectbob.domain.Addressbook;

import com.projectbob.domain.Cart;
import com.projectbob.domain.CartSummaryDto;
import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Orders;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;
import com.projectbob.domain.NewOrder;
import com.projectbob.mapper.BobMapper;
import com.projectbob.mapper.ShopMapper;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BobService {

	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;

	@Autowired
	private LoginService loginService;

	public Menu getMenuCal(int mId) {
		return bobMapper.getMenuCal(mId);
	}

	public List<Addressbook> getAddressesByUserId(String userId) { // 반환 타입 변경
		System.out.println("[DEBUG] 서비스에 전달된 userId: " + userId);
		List<Addressbook> addresses = bobMapper.findAddressesById(userId);
		System.out.println("[DEBUG] 서비스에서 조회된 주소 개수: " + (addresses == null ? 0 : addresses.size()));
		return addresses;
	}

	public CartSummaryDto getCartSummaryForUserOrGuest(String userId, String guestId) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("guestId", guestId);


	        List<Cart> allCartItems = bobMapper.selectCartByUserOrGuest(params);
            log.info("getCartSummaryForUserOrGuest - userId: {}, guestId: {}, retrieved cart items size: {}",
                     userId, guestId, allCartItems != null ? allCartItems.size() : 0);


		// 각 Cart 항목의 totalPrice를 해당 항목의 단가 * 수량으로 재계산
		allCartItems.forEach(item -> {
			int unitPrice = 0;
			if (item.getCaPid() == null) { // 메인 메뉴
				unitPrice = item.getMenuPrice();
			} else { // 옵션
				unitPrice = item.getOptionPrice();
			}
			item.setTotalPrice(unitPrice * item.getQuantity());
		});

		int totalQuantity = 0;
		int totalPrice = 0;

		if (allCartItems != null && !allCartItems.isEmpty()) {
			// 메인 메뉴 항목의 수량만 총 수량에 합산
			totalQuantity = allCartItems.stream().filter(item -> item.getCaPid() == null) // ca_pid가 없는 것이 메인 메뉴
					.mapToInt(Cart::getQuantity).sum();
			// 모든 장바구니 항목의 totalPrice 합산 (메인 메뉴 + 옵션)
			totalPrice = allCartItems.stream().mapToInt(Cart::getTotalPrice).sum();
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
				.filter(item -> caId != null && item.getCaId() != null && item.getCaId().equals(caId)).findFirst()
				.orElse(null);

		if (itemToDelete == null) {
			throw new IllegalArgumentException("삭제할 장바구니 항목을 찾을 수 없습니다.");
		}
		// 옵션 항목은 독립적으로 삭제할 수 없다는 비즈니스 로직 확인
		if (itemToDelete.getCaPid() != null) { // ca_pid가 있으면 옵션 항목임
			throw new IllegalArgumentException("옵션 항목은 단독으로 삭제할 수 없습니다. 메인 메뉴 항목을 삭제해주세요.");
		}

		params.put("caId", caId);
		bobMapper.deleteCartItemAndOptions(params);

		// 5. 삭제 후 업데이트된 전체 장바구니 목록 반환 (여기서도 Map 사용)
		return bobMapper.selectCartByUserOrGuest(params);
	}

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
				.filter(item -> item.getCaId() != null && item.getCaId().equals(caId)).findFirst().orElse(null);

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

	/*
	 * 사용자 또는 비회원 ID로 모든 장바구니 항목을 조회합니다.
	 */
	public CartSummaryDto getCartByUser(String userId, String guestId) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("guestId", guestId);

		List<Cart> allCartItems = bobMapper.selectCartByUserOrGuest(params);

		int totalQuantity = allCartItems.stream().filter(item -> item.getCaPid() == null).mapToInt(Cart::getQuantity)
				.sum();

		// 전체 총액은 각 카트 항목의 totalPrice를 모두 합산합니다.
		// 이 totalPrice는 DB에 (단가 * 수량)으로 정확히 저장되어 있다고 가정합니다.
		int overallTotalPrice = allCartItems.stream().mapToInt(Cart::getTotalPrice).sum();

		log.info("장바구니 총 수량: {}, 계산된 최종 총액: {}", totalQuantity, overallTotalPrice);
		// --- 수정된 부분 끝 ---

		return new CartSummaryDto(allCartItems, totalQuantity, overallTotalPrice);

	}

	@Transactional
	public void processAndAddCartItems(List<Cart> cartItems, String userId, String guestId) {
		Integer parentCaId = null; // 메인 메뉴의 ca_id를 저장할 변수

		for (Cart c : cartItems) {
			if (c.getMoIds() == null || c.getMoIds().isEmpty()) {

				Cart mainMenuCart = new Cart();
				mainMenuCart.setMId(c.getMId());
				mainMenuCart.setMoId(null);
				mainMenuCart.setCaPid(null);
				mainMenuCart.setQuantity(c.getQuantity());
				mainMenuCart.setSId(c.getSId());

				mainMenuCart.setUnitPrice(c.getMenuPrice());
				mainMenuCart.setTotalPrice(c.getMenuPrice() * c.getQuantity());

				mainMenuCart.setId(userId);
				mainMenuCart.setGuestId(guestId);

				// 로그 출력
				log.info("[메인 메뉴] mId: {}, quantity: {}, unitPrice: {}, totalPrice: {}", c.getMId(), c.getQuantity(),
						c.getMenuPrice(), mainMenuCart.getTotalPrice());

				// DB 삽입
				bobMapper.insertCart(mainMenuCart);
				parentCaId = mainMenuCart.getCaId();

			} else {
				// ✅ 옵션 처리
				if (parentCaId == null) {
					log.error("옵션 항목을 추가하기 전에 메인 메뉴 항목이 필요합니다. (mId: {})", c.getMId());
					throw new IllegalStateException("옵션 항목은 메인 메뉴 없이 추가될 수 없습니다.");
				}

				List<Integer> moIds = c.getMoIds();
				List<Integer> optionPrices = c.getOptionPrices();

				for (int i = 0; i < moIds.size(); i++) {
					Integer moId = moIds.get(i);
					Integer optionPrice = optionPrices.get(i);

					Cart optionCart = new Cart();
					optionCart.setMId(c.getMId());
					optionCart.setMoId(moId);
					optionCart.setCaPid(parentCaId);
					optionCart.setQuantity(c.getQuantity());
					optionCart.setSId(c.getSId());

					optionCart.setUnitPrice(optionPrice);
					optionCart.setTotalPrice(optionPrice * c.getQuantity());

					optionCart.setId(userId);
					optionCart.setGuestId(guestId);

					log.info("[옵션] moId: {}, quantity: {}, unitPrice: {}, totalPrice: {}, parentCaId: {}", moId,
							c.getQuantity(), optionPrice, optionCart.getTotalPrice(), parentCaId);

					bobMapper.insertCart(optionCart);
				}
			}

		}
		log.info("Cart items processed and added to DB.");
	}


	@Autowired
    private ShopMapper shopMapper;
	//가게 검색하기
//	public List<Shop> searchList(String keyword){
//		return bobMapper.searchList(keyword);
//	}


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

	/*
	 * public List<Review> reviewList(int sId){ return bobMapper.reviewList(sId); }
	 */
	public List<Review> getReviewList(int sId) {
		return bobMapper.getReviewList(sId);
	}

	// 가게 (하트) 증가

	public List<Review> reviewList(int sId) {
		return bobMapper.reviewList(sId);
	}

	// 가게 찜 (하트) 증가

	public int plusHeart(int sId) {
		return bobMapper.plusHeart(sId);
	}

	public Integer getHeartCount(int sId) {
		return bobMapper.getHeartCount(sId);
	}

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
		return Map.of("liked", !exists, "heartCount", newCount);
	}

	// 내가 찜한 가게 목록
	public List<Integer> getLikeShopList(String userId) {
		return bobMapper.getLikeShopList(userId);
	}

	// 댓글 등록하는 메서드
	@Transactional
	public void addReview(Review review) {
		if(review.getONo() != null) {
			int existingReviewCount = bobMapper.countReviewByOrderNo(review.getONo());
			if(existingReviewCount > 0) {
				throw new IllegalStateException("해당 주문에 대한 리뷰가 이미 존재합니다.");
			}
		}
		bobMapper.addReview(review);
		// 평점 업데이트 로직을 별도 트랜잭션으로 분리
		this.updateShopRating(review.getSId());
	}

	// 가게 평점 업데이트 (별도 트랜잭션)
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void updateShopRating(int sId) {
		shopMapper.updateShopRatingBySId(sId);
	}

	//댓글 수정하는 메서드
	@Transactional
	public void updateReview(Review review) {
		bobMapper.updateReview(review);
		shopMapper.updateShopRatingBySId(review.getSId());
	}



	//댓글 삭제하는 메서드
	@Transactional
	public void deleteReview(int rNo, int sId) {
		bobMapper.deleteReview(rNo);
		shopMapper.updateShopRatingBySId(sId);
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

	
	// 회원이 특정 가게에서 주문한 내역이 있는지 확인하는 메서드
	public boolean hasUserOrderedFromShop(String userId, int sId) {
		log.info("hasUserOrderedFromShop 호출됨 - userId: {}, sId: {}", userId, sId);
		if (userId == null || userId.trim().isEmpty()) {
			log.info("hasUserOrderedFromShop: userId가 null 또는 비어있어 false 반환");
			return false;
		}
		int orderCount = bobMapper.countOrdersByUserIdAndShopId(userId, sId);
		log.info("bobMapper.countOrdersByUserIdAndShopId 결과 : {} (userId: {}, sId: {})", orderCount, userId, sId);
		return orderCount > 0;
	}
	
	// 회원이 특정 가게에서 아직 리뷰를 작성하지 않은 주문 목록을 가져오는 메서드
	public List<com.projectbob.domain.Orders> getReviewableOrdersForShop(String userId, int sId){
		if (userId == null || userId.trim().isEmpty()) {
			return new ArrayList<>();
		}
		return bobMapper.getReviewableOrders(userId, sId);
	}
	
	// 사용자가 특정 주문에 대해 리뷰를 작성했는지 확인하는 메서드
	public boolean hasUserReviewedForOrder(String userId, int oNo) {
		return bobMapper.countReviewByOrderNoAndUserId(userId, oNo) > 0;
	}

	// 주문 번호로 주문 정보 가져오기
	public Orders getOrderByOrderNo(String orderId) {
		return bobMapper.selectOrderByOrderNo(orderId);
	}

	// 메뉴 이름으로 mId 가져오기
	public Integer getMenuIdByName(String menuName) {
		return bobMapper.selectMenuIdByName(menuName);
	}
	
	
	// 결제정보 가져오기
	
	 public NewOrder getNewOrder(int orderId) {
		 Orders o =	 bobMapper.selectOrderId(orderId);
		 if (o == null) {
			 throw new IllegalArgumentException("해당 주문을 못찾음: " + orderId);
		 }
		 String shopName = this.getShopDetail(o.getSId()).getName();
		 
		 NewOrder newo = new NewOrder();
		 newo.setOrderId(o.getONo());
		 newo.setShopId(o.getSId());
		 newo.setShopName(shopName);
		 newo.setMenus(o.getMenus());
		 newo.setTotalPrice(o.getTotalPrice());
		 newo.setPayment(o.getPayment());
		 newo.setAddress(o.getOAddress());
		 newo.setPhone(loginService.getMember(o.getId()).getPhone());
		 newo.setRequest(o.getRequest());
		 newo.setStatus(o.getStatus());
		 newo.setRegDate(o.getRegDate());
		 return newo;
	 }
	 
	 // 주문 번호로 실제 주문 금액을 가져오는 메서드
	 public int getActualOrderAmount(String orderId) {
		 Orders order = bobMapper.selectOrderByPaymentUid(orderId);
		 if (order != null) {
			 return order.getTotalPrice();
		 }
		 throw new IllegalArgumentException("해당 주문 ID(" + orderId + ")에 대한 주문을 찾을 수 없습니다.");
	 }
	 
	 // 주문페이지에서 결제완료 페이지로 보내기
	 @Transactional
	 public int createOrder(Map<String, Object> req, HttpSession session, String paymentUid) {
		 String userId = (String) session.getAttribute("loginId");
		 String guestId = (String) session.getAttribute("guestId");
		 log.info("createOrder (after session retrieval) - userId: {}, guestId: {}", userId, guestId);
		 String payment = (String) req.get("paymentMethod");
		 System.out.println("BobService - paymentMethod from request: " + payment);

		 // 로그인한 사용자가 있다면 guestId를 무시 (임시 방편)
		 if (userId != null) {
			 guestId = null;
		 }
		 String address = req.get("address1") + " " + req.get("address2");
		 String phone = (String) req.get("phone");
		 String request = (String) req.get("orderRequest");
		 
		 CartSummaryDto cartSummary =getCartSummaryForUserOrGuest(userId, guestId);

		 log.info("createOrder - userId: {}, guestId: {}, cartSummary is null: {}, cartList size: {}",
		          userId, guestId, (cartSummary == null), (cartSummary != null ? cartSummary.getCartList().size() : "N/A"));

		 if (cartSummary == null || cartSummary.getCartList().isEmpty()) {
			 throw new IllegalStateException("주문할 상품이 장바구니에 없습니다.");
		 }
		 
		 Orders order = new Orders();
		 order.setSId(cartSummary.getCartList().get(0).getSId());
		 order.setId(userId != null ? userId : guestId); // 이 라인 바로 다음
		 System.out.println("BobService - Setting Order ID to: " + order.getId()); // 이 로그를 추가
		 order.setTotalPrice(cartSummary.getTotalPrice());
		 order.setPayment(payment);
		 order.setPaymentUid(paymentUid); // paymentUid 설정
		 order.setOAddress(address);
		 order.setRequest(request);
		 log.info("createOrder - Setting OAddress: '{}', Request: '{}'", order.getOAddress(), order.getRequest());
		 order.setStatus("PENDING");
		 // quantity와 menus 정보 설정
		 order.setQuantity(cartSummary.getTotalQuantity());
		 
		 // 주문 메뉴 문자열 생성 로직 개선
		 Map<Integer, List<Cart>> groupedCartItems = cartSummary.getCartList().stream()
		         .collect(Collectors.groupingBy(Cart::getMId)); // mId로 그룹화

		 StringBuilder orderedMenusBuilder = new StringBuilder();
		 for (Map.Entry<Integer, List<Cart>> entry : groupedCartItems.entrySet()) {
		     List<Cart> menuItems = entry.getValue();
		     Cart mainMenu = menuItems.stream()
		                             .filter(item -> item.getCaPid() == null)
		                             .findFirst()
		                             .orElse(null);

		     if (mainMenu != null) {
		         orderedMenusBuilder.append(mainMenu.getMenuName());
		         orderedMenusBuilder.append(" * ").append(mainMenu.getQuantity());

		         List<String> options = menuItems.stream()
		                                         .filter(item -> item.getCaPid() != null && item.getCaPid().equals(mainMenu.getCaId()))
		                                         .map(Cart::getOptionName)
		                                         .collect(Collectors.toList());

		         if (!options.isEmpty()) {
		             orderedMenusBuilder.append(" (").append(String.join(", ", options)).append(")");
		         }
		         orderedMenusBuilder.append(", ");
		     }
		 }
		 // 마지막 ", " 제거
		 String orderedMenus = orderedMenusBuilder.toString();
		 if (orderedMenus.endsWith(", ")) {
		     orderedMenus = orderedMenus.substring(0, orderedMenus.length() - 2);
		 }
		 order.setMenus(orderedMenus);
		 
		 bobMapper.insertOrder(order);
		 int newOrderNo = order.getONo();
		 
		 return newOrderNo;
	 }
	 


}
