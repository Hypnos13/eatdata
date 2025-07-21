package com.projectbob.ajax;

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
import com.projectbob.domain.CartAddRequestDto;
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
	

	
	// 메뉴 옵션 목록
	@GetMapping("/ajax/menu/options")
	public List<MenuOption> getMenuOptions(@RequestParam("mId") int mId){
		log.info("MenuAjaxController: getMenuOptions() called, mId={}", mId);
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
	


	@PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody CartAddRequestDto dto) {
        try {
            bobService.addCartItem(dto);

            List<Cart> updatedCart = bobService.getCartListByUser(dto.getUId());

            return ResponseEntity.ok(Map.of("status", "success", "cartList", updatedCart));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("status", "fail", "message", e.getMessage()));
        }
    }
	
	
	
	
	

}
