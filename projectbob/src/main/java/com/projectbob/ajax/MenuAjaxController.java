package com.projectbob.ajax;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.projectbob.domain.Cart;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.service.BobService;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
public class MenuAjaxController {
	
	@Autowired
	private BobService bobService;
	
	@PostMapping("/cart/removeAll")
	@ResponseBody
	public Map<String, Object> removeAllCart(HttpSession session) {
	    Map<String, Object> result = new HashMap<>();

	    try {
	        String userId = (String) session.getAttribute("userId");     // 로그인 회원 ID
	        String guestId = (String) session.getAttribute("guestId");   // 비회원 guestId

	        if (userId != null && !userId.trim().isEmpty()) {
	            bobService.deleteCartByUserId(userId);
	        } else if (guestId != null && !guestId.trim().isEmpty()) {
	            bobService.deleteCartByGuestId(guestId);
	        } else {
	            // 세션에 userId, guestId 둘 다 없으면 실패 처리
	            result.put("success", false);
	            result.put("message", "세션 정보가 없습니다.");
	            return result;
	        }

	        result.put("success", true);

	    } catch (Exception e) {
	        e.printStackTrace();
	        result.put("success", false);
	        result.put("message", "서버 오류");
	    }

	    return result;
	}

	
	@PostMapping("/addCart")
	@ResponseBody
	public Map<String, Object> addCart(@RequestBody List<Cart> cartItems, HttpSession session) {
	    Map<String, Object> result = new HashMap<>();

	    try {
	        // 회원 ID, 비회원 guestId 구분
	        String userId = cartItems.get(0).getId();
	        String guestId = cartItems.get(0).getGuestId();

	        // 비회원 guestId 없으면 세션에서 꺼내거나 새로 생성
	        if ((userId == null || userId.trim().isEmpty()) && (guestId == null || guestId.trim().isEmpty())) {
	            guestId = (String) session.getAttribute("guestId");
	            if (guestId == null) {
	                guestId = "guest-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
	                        + "-" + UUID.randomUUID().toString().substring(0, 8);
	                session.setAttribute("guestId", guestId);
	            }
	         
	            // cartItems의 모든 객체에 guestId 세팅
	            for (Cart cart : cartItems) {
	                cart.setGuestId(guestId);
	                System.out.println("mId: " + cart.getMId() + ", moId: " + cart.getMoId() + ", quantity: " + cart.getQuantity() +
	                        ", id: " + cart.getId() + ", guestId: " + cart.getGuestId() + ", sId: " + cart.getSId());
	            }
	        }

	        bobService.addCartItems(cartItems);  // 서비스 호출

	        List<Cart> updatedCartList = bobService.getCartByUser(userId, guestId);

	        result.put("success", true);
	        result.put("cartList", updatedCartList);
	        
	        result.put("guestId", guestId);
	        
	    } catch (Exception e) {
	        e.printStackTrace();
	        result.put("success", false);
	    }

	    return result;
	}
	 
	
	// 메뉴 옵션 목록
	@GetMapping("/ajax/menu/options")
	public List<MenuOption> getMenuOptions(@RequestParam("mId") int mId ){
		//log.info("MenuAjaxController: getMenuOptions() called, mId={}", mId);
		return bobService.getMenuOptionsByMenuId(mId);
	}
	
	// 리뷰 탭 하트
	@PostMapping("/heart.ajax")
	@ResponseBody
	public Map<String, Object> heart(@RequestParam("sId") int sId){
		int result = bobService.plusHeart(sId);
		Integer heartCount = bobService.getHeartCount(sId);
		Map<String, Object> map = new HashMap<>();
		map.put("success", result > 0);
		map.put("heartCount", heartCount);
		return map;
	}
		
	// 댓글 쓰기 메서드
	@PostMapping("/reviewWrite.ajax")
	public List<Review> addReview(Review review){
		bobService.addReview(review);
		return bobService.reviewList(review.getSId());
	}
	


	
	
	

}
