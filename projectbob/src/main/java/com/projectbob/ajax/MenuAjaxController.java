package com.projectbob.ajax;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
	
	 /**
     * 장바구니에 항목을 추가합니다.
     * 클라이언트로부터 받은 장바구니 항목 리스트를 처리하고,
     * 회원/비회원 ID를 관리하며, 최종 장바구니 상태와 총 가격을 반환합니다.

     */
    @PostMapping("/addCart") // POST 요청을 /cart/add 경로로 매핑합니다.
    public Map<String, Object> addCart(@RequestBody List<Cart> cartItems, HttpSession session) {
        Map<String, Object> result = new HashMap<>();

        try {
            System.out.println("Received cartItems.size() = " + cartItems.size());

            // 1. 회원ID 또는 guestId 설정
            String userId = null;
            String guestId = null;

            // 요청받은 cartItems 중 첫 번째 항목에서 사용자 ID와 게스트 ID를 가져옵니다.
            // (클라이언트에서 보낼 때 모든 cartItems에 동일한 ID를 설정했다고 가정)
            if (!cartItems.isEmpty()) {
                userId = cartItems.get(0).getId(); // 회원 ID
                guestId = cartItems.get(0).getGuestId(); // 비회원 ID (클라이언트에서 보냈을 경우)
            }

            // 비회원이고 guestId가 없으면 세션에서 가져오거나 새로 생성합니다.
            if ((userId == null || userId.trim().isEmpty()) && (guestId == null || guestId.trim().isEmpty())) {
                guestId = (String) session.getAttribute("guestId");
                if (guestId == null) {
                    // 새로운 guestId 생성: "guest-" + 현재 시간 + UUID의 일부
                    guestId = "guest-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                            + "-" + UUID.randomUUID().toString().substring(0, 8);
                    session.setAttribute("guestId", guestId); // 세션에 저장
                    System.out.println("Generated new guestId: " + guestId);
                } else {
                    System.out.println("Using existing guestId from session: " + guestId);
                }
                // 요청받은 모든 cartItems에 생성/조회된 guestId를 설정합니다.
                // 이 guestId는 서비스 계층으로 전달되어 DB에 저장됩니다.
                for (Cart cart : cartItems) {
                    cart.setGuestId(guestId);
                }
            } else {
                System.out.println("User ID: " + userId + ", Guest ID: " + guestId);
            }

            // 2. 서비스 계층에 장바구니 항목 처리 요청
            // 이 메서드 내에서 메인 메뉴와 옵션 항목이 순차적으로 DB에 삽입됩니다.
            bobService.processAndAddCartItems(cartItems, userId, guestId);
            System.out.println("Cart items processed and added to DB.");

            // 3. 업데이트된 장바구니 리스트 가져오기 (메인 메뉴 및 옵션 포함 모든 항목)
            List<Cart> updatedCartList = bobService.getCartByUser(userId, guestId);
            System.out.println("Updated cart list retrieved. Size: " + updatedCartList.size());

            // 4. 총 가격 계산 (서비스에서 반환된 리스트를 기반으로 다시 계산)
            // 각 카트 항목(메인 메뉴 또는 옵션)의 total_price를 모두 합산하여 전체 장바구니의 총액을 계산합니다.
            int totalPrice = updatedCartList.stream()
                    .mapToInt(Cart::getTotalPrice) // 각 항목의 totalPrice 필드를 가져와 합산
                    .sum();
            System.out.println("Calculated total price: " + totalPrice);

            // 5. 응답 결과 설정
            result.put("success", true);
            result.put("cartList", updatedCartList); // 업데이트된 전체 장바구니 목록
            result.put("guestId", guestId); // 현재 사용 중인 guestId (비회원인 경우)
            result.put("totalPrice", totalPrice); // 계산된 총 가격

        } catch (Exception e) {
            e.printStackTrace(); // 서버 로그에 스택 트레이스 출력
            result.put("success", false);
            result.put("message", "장바구니 추가 중 오류가 발생했습니다: " + e.getMessage()); // 클라이언트에게 오류 메시지 전달
            System.err.println("Error adding cart items: " + e.getMessage());
        }

        return result;
    }

    /**
     * 사용자 또는 비회원 ID로 장바구니 내용을 조회합니다.
     */
    @GetMapping("/cartList")
    public Map<String, Object> getCartList(
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "guestId", required = false) String guestId,
            HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 요청 파라미터에 userId, guestId가 없으면 세션에서 guestId를 가져옴
            if ((userId == null || userId.trim().isEmpty()) && (guestId == null || guestId.trim().isEmpty())) {
                guestId = (String) session.getAttribute("guestId");
            }

            List<Cart> cartList = bobService.getCartByUser(userId, guestId);
            int totalPrice = cartList.stream().mapToInt(Cart::getTotalPrice).sum();

            result.put("success", true);
            result.put("cartList", cartList);
            result.put("totalPrice", totalPrice);
            result.put("guestId", guestId); // 현재 사용 중인 guestId 반환
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "장바구니 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    /**
     * 장바구니 항목의 수량을 업데이트합니다.
     */
    @PostMapping("/updateQuantity")
    public Map<String, Object> updateCartQuantity(@RequestBody Map<String, Object> requestBody) {
        Map<String, Object> result = new HashMap<>();
        try {
            Integer caId = (Integer) requestBody.get("caId");
            Integer quantity = (Integer) requestBody.get("quantity");
            String userId = (String) requestBody.get("id");
            String guestId = (String) requestBody.get("guestId");

            if (caId == null || quantity == null || (userId == null && guestId == null)) {
                throw new IllegalArgumentException("필수 파라미터(caId, quantity, id/guestId)가 누락되었습니다.");
            }

            List<Cart> updatedCartList = bobService.updateCartItemQuantity(caId, quantity, userId, guestId);
            int totalPrice = updatedCartList.stream().mapToInt(Cart::getTotalPrice).sum();

            result.put("success", true);
            result.put("cartList", updatedCartList);
            result.put("totalPrice", totalPrice);
        } catch (IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "수량 업데이트 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    /**
     * 장바구니 개별 항목(메인 메뉴)과 그에 연결된 모든 옵션 항목을 삭제합니다.
     */
    @PostMapping("/deleteCart")
    public Map<String, Object> deleteCartItem(@RequestBody Map<String, Object> requestBody) {
        Map<String, Object> result = new HashMap<>();
        try {
            Integer caId = (Integer) requestBody.get("caId");
            String userId = (String) requestBody.get("id");
            String guestId = (String) requestBody.get("guestId");

            if (caId == null || (userId == null && guestId == null)) {
                throw new IllegalArgumentException("필수 파라미터(caId, id/guestId)가 누락되었습니다.");
            }

            List<Cart> updatedCartList = bobService.deleteCartItem(caId, userId, guestId);
            int totalPrice = updatedCartList.stream().mapToInt(Cart::getTotalPrice).sum();

            result.put("success", true);
            result.put("cartList", updatedCartList);
            result.put("totalPrice", totalPrice);
        } catch (IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "항목 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    /**
     * 사용자 또는 비회원의 모든 장바구니 항목을 삭제합니다.
     */
    @PostMapping("/removeAll")
    public Map<String, Object> removeAllCartItems(@RequestBody Map<String, Object> requestBody) {
        Map<String, Object> result = new HashMap<>();
        try {
            String userId = (String) requestBody.get("userId");
            String guestId = (String) requestBody.get("guestId");

            if (userId == null && guestId == null) {
                throw new IllegalArgumentException("삭제할 사용자 또는 게스트 정보가 없습니다.");
            }

            List<Cart> updatedCartList = bobService.deleteAllCartItems(userId, guestId);
            int totalPrice = updatedCartList.stream().mapToInt(Cart::getTotalPrice).sum();

            result.put("success", true);
            result.put("cartList", updatedCartList);
            result.put("totalPrice", totalPrice);
        } catch (IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "전체 장바구니 삭제 중 오류가 발생했습니다: " + e.getMessage());
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
