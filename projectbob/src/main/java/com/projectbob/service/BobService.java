package com.projectbob.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.projectbob.domain.Cart;
import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BobService {

	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	
	
	@Transactional
	public List<Cart> deleteCartItem(Integer caId, String userId, String guestId) {
	    // 1. 매퍼에 전달할 파라미터 맵 생성
	    Map<String, Object> params = new HashMap<>();
	    params.put("userId", userId);
	    params.put("guestId", guestId);

	    // 2. 현재 사용자/게스트의 장바구니 항목 조회 (여기서도 Map 사용)
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
	    Map<String, Object> commonParams = new HashMap<>(); // 공통 파라미터 맵
	    commonParams.put("userId", userId);
	    commonParams.put("guestId", guestId);

	    List<Cart> currentCartItems = bobMapper.selectCartByUserOrGuest(commonParams);
	    Cart mainItem = currentCartItems.stream()
	                                    .filter(item -> item.getCaId() != null && item.getCaId().equals(caId))
	                                    .findFirst()
	                                    .orElse(null);

	    if (mainItem == null || mainItem.getMoId() != null) { // 메인 메뉴 항목이 아니면 오류
	        throw new IllegalArgumentException("메인 메뉴 항목만 수량을 변경할 수 있습니다.");
	    }

	    // 2. 메인 메뉴 항목의 새로운 총 가격 계산 및 업데이트 (Map 사용)
	    Integer newMainMenuTotalPrice = mainItem.getMenuPrice() * newQuantity;

	    Map<String, Object> updateParams = new HashMap<>(); // 업데이트 전용 파라미터 맵
	    updateParams.put("caId", caId);
	    updateParams.put("quantity", newQuantity);
	    updateParams.put("totalPrice", newMainMenuTotalPrice);
	    updateParams.put("userId", userId); // userId와 guestId도 포함
	    updateParams.put("guestId", guestId);
	    bobMapper.updateCartItemQuantity(updateParams);

	    // 3. 해당 메인 메뉴에 연결된 옵션 항목들도 수량 및 총 가격 업데이트
	    List<Cart> optionItems = currentCartItems.stream()
	                                            .filter(item -> item.getCaPid() != null && item.getCaPid().equals(caId))
	                                            .collect(Collectors.toList());

	    for (Cart optionItem : optionItems) {
	        Integer newOptionTotalPrice = optionItem.getOptionPrice() * newQuantity;

	        Map<String, Object> optionUpdateParams = new HashMap<>(); // 옵션 업데이트 전용 맵
	        optionUpdateParams.put("caId", optionItem.getCaId()); // 옵션의 caId
	        optionUpdateParams.put("quantity", newQuantity);
	        optionUpdateParams.put("totalPrice", newOptionTotalPrice);
	        optionUpdateParams.put("userId", userId); // userId와 guestId도 포함
	        optionUpdateParams.put("guestId", guestId);
	        bobMapper.updateCartItemQuantity(optionUpdateParams);
	    }

	    // 4. 업데이트된 전체 장바구니 목록 반환 (Map 사용)
	    return bobMapper.selectCartByUserOrGuest(commonParams);
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
	public List<Cart> getCartByUser(String userId, String guestId) {
	    Map<String, Object> params = new HashMap<>();
	    params.put("userId", userId);
	    params.put("guestId", guestId);
	    List<Cart> allCartItems = bobMapper.selectCartByUserOrGuest(params); // Map 형태로 파라미터 전달
	    return allCartItems;
	}
	
	/**
     * 장바구니 항목을 처리하고 DB에 추가합니다.
     * 전달받은 각 메뉴 선택에 대해 메인 메뉴 항목을 먼저 삽입하고,
     * 생성된 ca_id를 옵션 항목의 ca_pid로 사용하여 옵션들을 삽입합니다.
     */
    @Transactional // 이 메서드 내의 모든 DB 작업이 하나의 트랜잭션으로 처리됩니다.
    public void processAndAddCartItems(List<Cart> cartItems, String userId, String guestId) {
        for (Cart c : cartItems) {
            // 1) 메인 메뉴 단독 아이템 생성 (ca_pid는 NULL)
            Cart mainMenuCart = new Cart();
            mainMenuCart.setMId(c.getMId());
            mainMenuCart.setMoId(null); // 메인 메뉴는 moId가 null
            mainMenuCart.setCaPid(null); // 메인 메뉴는 ca_pid가 null (최상위 항목)
            mainMenuCart.setQuantity(c.getQuantity());
            mainMenuCart.setSId(c.getSId());
            // mainMenuCart.setMenuPrice(c.getMenuPrice()); // 이 값은 DB에 저장되지 않으므로 필요 없음
            // mainMenuCart.setOptionPrice(0); // 이 값은 DB에 저장되지 않으므로 필요 없음
            mainMenuCart.setTotalPrice(c.getMenuPrice() * c.getQuantity()); // 메인 메뉴 가격 * 수량
            // mainMenuCart.setMenuName(c.getMenuName()); // 이 값은 DB에 저장되지 않으므로 필요 없음
            mainMenuCart.setId(userId);
            mainMenuCart.setGuestId(guestId);

            // 메인 메뉴 항목을 DB에 삽입하고, 삽입 후 생성된 ca_id를 mainMenuCart 객체에 받아옵니다.
            // Mybatis의 useGeneratedKeys="true" keyProperty="caId" 설정 덕분입니다.
            bobMapper.insertCart(mainMenuCart);
            Integer parentCaId = mainMenuCart.getCaId(); // 생성된 ca_id를 부모 ID로 사용

            // 2) 옵션이 있을 경우, 각 옵션별 Cart 객체 생성 및 부모 ca_id 설정 후 삽입
            List<Integer> moIds = c.getMoIds();
            List<Integer> optionPrices = c.getOptionPrices();

            if (moIds != null && !moIds.isEmpty() && optionPrices != null && optionPrices.size() == moIds.size()) {
                for (int i = 0; i < moIds.size(); i++) {
                    Integer moId = moIds.get(i);
                    Integer optionPrice = optionPrices.get(i);

                    Cart optionCart = new Cart();
                    optionCart.setMId(c.getMId()); // 옵션도 어떤 메뉴에 속하는지 mId를 가집니다.
                    optionCart.setMoId(moId);
                    optionCart.setCaPid(parentCaId); // **여기서 부모 ca_id를 설정하여 메인 메뉴와 연결합니다.**
                    optionCart.setQuantity(c.getQuantity()); // 옵션도 메인 메뉴와 동일 수량으로 가정
                    optionCart.setSId(c.getSId());
                    // optionCart.setMenuPrice(0); // 이 값은 DB에 저장되지 않으므로 필요 없음
                    // optionCart.setOptionPrice(optionPrice); // 이 값은 DB에 저장되지 않으므로 필요 없음
                    optionCart.setTotalPrice(optionPrice * c.getQuantity()); // 옵션 가격 * 수량
                    // optionCart.setMenuName(c.getMenuName() + " (옵션)"); // 이 값은 DB에 저장되지 않으므로 필요 없음
                    optionCart.setId(userId);
                    optionCart.setGuestId(guestId);

                    // 옵션 항목을 DB에 삽입합니다.
                    bobMapper.insertCart(optionCart);
                }
            }
        }
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

	// 댓글 등록하는 메서드
	public void addReview(Review review) {
		bobMapper.addReview(review);
	}



}
