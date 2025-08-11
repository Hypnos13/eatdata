package com.projectbob.ajax;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; 
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.projectbob.domain.LikeList;
import com.projectbob.domain.Menu;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.projectbob.domain.Cart;
import com.projectbob.domain.CartSummaryDto;
import com.projectbob.domain.Coupon;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.OrderData;
import com.projectbob.domain.Orders;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;
import com.projectbob.service.BobService;
import com.projectbob.service.CustomerServiceService;
import com.projectbob.service.FileUploadService; 
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
public class MenuAjaxController {

	@Autowired
	private BobService bobService;
	
	@Autowired
	private  CustomerServiceService customerServiceService;

	 @Autowired
	 private FileUploadService fileUploadService; 

	@Value("${file.upload-dir}") // application.properties의 file.upload-dir 값을 주입
	private String uploadBaseDir;
	

	

	@PostMapping("/getCart")
    public ResponseEntity<Map<String, Object>> getCart(@RequestBody Map<String, String> request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        String userId = request.get("id");
        String guestId = request.get("guestId");

        // 요청 본문에서 ID가 없으면 세션에서도 확인
        if (userId == null || userId.isEmpty()) {
            userId = (String) session.getAttribute("loginId");
        }
        if (guestId == null || guestId.isEmpty()) {
            guestId = (String) session.getAttribute("guestId");
        }

        if ((userId == null || userId.isEmpty()) && (guestId == null || guestId.isEmpty())) {
            response.put("success", true);
            response.put("message", "사용자 정보가 없어 장바구니를 가져올 수 없습니다.");
            response.put("cartList", new ArrayList<>());
            response.put("totalPrice", 0);
            response.put("totalQuantity", 0);
            return ResponseEntity.ok(response);
        }

        try {
            // BobService의 공통 메서드 활용
            CartSummaryDto cartSummary = bobService.getCartSummaryForUserOrGuest(userId, guestId);
            
            List<Cart> cartList = cartSummary.getCartList();
            System.out.println("=== 장바구니 목록 ===");
            for (Cart item : cartList) {
                System.out.println("메뉴명: " + item.getMenuName());
                System.out.println("수량: " + item.getQuantity());
                System.out.println("가격: " + item.getTotalPrice());
                System.out.println("옵션명: " + item.getOptionName());
                System.out.println("---------------------");
            }
            
            
            response.put("success", true);
            response.put("message", "장바구니 로드 성공");
            response.put("cartList", cartSummary.getCartList());
            response.put("totalPrice", cartSummary.getTotalPrice());
            response.put("totalQuantity", cartSummary.getTotalQuantity());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "장바구니 로드 중 오류 발생: " + e.getMessage());
            response.put("cartList", new ArrayList<>());
            response.put("totalPrice", 0);
            response.put("totalQuantity", 0);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

	 /**
     * 장바구니에 항목을 추가합니다.
     * 클라이언트로부터 받은 장바구니 항목 리스트를 처리하고,
     * 회원/비회원 ID를 관리하며, 최종 장바구니 상태와 총 가격을 반환합니다.
     */
	 @PostMapping("/addCart")
	    public Map<String, Object> addCart(@RequestBody List<Cart> cartItems, HttpSession session) {
	        Map<String, Object> result = new HashMap<>();

	        try {

	        	String userId = (String) session.getAttribute("loginId"); // 세션에서 userId 가져오기
	            String guestId = (String) session.getAttribute("guestId"); // 세션에서 guestId 가져오기


	            // cartItems에 userId나 guestId가 포함되어 있다면 사용 (우선순위 높음)
	            if (!cartItems.isEmpty()) {
	                if (cartItems.get(0).getId() != null && !cartItems.get(0).getId().trim().isEmpty()) {
	                    userId = cartItems.get(0).getId();
	                }
	                if (cartItems.get(0).getGuestId() != null && !cartItems.get(0).getGuestId().trim().isEmpty()) {
	                    guestId = cartItems.get(0).getGuestId();
	                }
	            }

	            // userId와 guestId가 모두 없는 경우에만 새로운 guestId 생성
	            if ((userId == null || userId.trim().isEmpty()) && (guestId == null || guestId.trim().isEmpty())) {
	                guestId = "guest-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
	                            + "-" + UUID.randomUUID().toString().substring(0, 8);
	                session.setAttribute("guestId", guestId);
	            }

	            // --- 기존 장바구니에 다른 가게 상품이 있는지 확인하는 로직 추가 시작 ---
	            CartSummaryDto currentCartSummary = bobService.getCartByUser(userId, guestId);
	            if (currentCartSummary != null && !currentCartSummary.getCartList().isEmpty()) {
	                Integer existingShopId = currentCartSummary.getCartList().get(0).getSId();
	                Integer newShopId = cartItems.get(0).getSId();

	                if (!existingShopId.equals(newShopId)) {
	                    result.put("success", false);
	                    result.put("message", "장바구니에는 한 가게의 상품만 담을 수 있습니다. 기존 장바구니를 비우고 다시 시도해주세요.");
	                    return result;
	                }
	            }
	            // --- 기존 장바구니에 다른 가게 상품이 있는지 확인하는 로직 추가 끝 ---

	            // cartItems의 모든 항목에 최종 결정된 userId 또는 guestId 설정
	            for (Cart cart : cartItems) {
	                cart.setId(userId);
	                cart.setGuestId(guestId);
	            }

	            bobService.processAndAddCartItems(cartItems, userId, guestId);
	            System.out.println("Cart items processed and added to DB.");

	            // Get CartSummaryDto directly
	            CartSummaryDto cartSummary = bobService.getCartByUser(userId, guestId);

	            List<Cart> updatedCartList = cartSummary.getCartList();
	            int totalPrice = cartSummary.getTotalPrice();
	            int totalQuantity = cartSummary.getTotalQuantity();

	            System.out.println("Updated cart list retrieved. Size: " + updatedCartList.size());
	            System.out.println("Calculated total price: " + totalPrice);
	            System.out.println("Calculated total quantity: " + totalQuantity);

	            result.put("success", true);
	            result.put("cartList", updatedCartList);
	            result.put("guestId", guestId);
	            result.put("totalPrice", totalPrice);
	            result.put("totalQuantity", totalQuantity);

	        } catch (Exception e) {
	            e.printStackTrace();
	            result.put("success", false);
	            result.put("message", "장바구니 추가 중 오류가 발생했습니다: " + e.getMessage());
	            System.err.println("Error adding cart items: " + e.getMessage());
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

            // Perform the actual deletion
            List<Cart> updatedCartList = bobService.deleteAllCartItems(userId, guestId);
            
            // Calculate total price from the (now updated/empty) cart list
            int totalPrice = updatedCartList.stream().mapToInt(Cart::getTotalPrice).sum();

            result.put("success", true);
            result.put("cartList", updatedCartList); // Return the updated (likely empty) cart list
            result.put("totalPrice", totalPrice);   // Return the new total price (likely 0)
            result.put("message", "장바구니의 모든 상품이 성공적으로 삭제되었습니다."); // Add a success message

        } catch (IllegalArgumentException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Print stack trace for debugging on the server
            result.put("success", false);
            result.put("message", "전체 장바구니 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result; // Returns a JSON response
    }


	 
	
	// 메뉴 옵션 목록
    @GetMapping("/ajax/menu/options")
    public List<MenuOption> getMenuOptions(@RequestParam("mId") int mId ){
        List<MenuOption> options = bobService.getMenuOptionsByMenuId(mId);
        System.out.println("options: " + options);
        return options;
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
	
	// 찜 버튼
	@PostMapping("/like.ajax")
	public Map<String, Object> toggleLike(@RequestBody LikeList likeList){ 		
		return bobService.toggleLike(likeList);
			
	}
		
	// 댓글 쓰기 메서드
	@PostMapping(value = "/reviewWrite.ajax")
	@ResponseBody
	public Map<String, Object> addReview(@ModelAttribute Review review,
			@RequestParam(value="reviewUploadFile", required=false) MultipartFile rPicture){
		
		log.info("addReview 호출됨 - review 객체: {}", review);
		log.info("addReview - review.oNo: {}", review.getONo());
		
		// 유효성 검사 추가
		Map<String, Object> result = new HashMap<>();
		if (review.getONo() == null || review.getONo() == 0) {
		    result.put("success", false);
		    result.put("message", "리뷰할 주문을 선택해주세요.");
		    return result;
		}

		boolean hasReviewed = bobService.hasUserReviewedForOrder(review.getId(), review.getONo());
		if (hasReviewed) {
		    result.put("success", false);
		    result.put("message", "이미 리뷰를 작성한 주문입니다.");
		    return result;
		}

		// 주문 정보에서 메뉴 이름을 파싱하여 mId를 찾음
		Orders order = bobService.getOrderByOrderNo(String.valueOf(review.getONo()));
		if (order != null && order.getMenus() != null && !order.getMenus().isEmpty()) {
		    String[] menuItems = order.getMenus().split(",");
		    if (menuItems.length > 0) {
		        String firstMenuItem = menuItems[0].split("\\*")[0].trim();
		        Integer mId = bobService.getMenuIdByName(firstMenuItem);
		        if (mId != null) {
		            review.setMId(mId);
		        }
		    }
		}

		if (review.getMId() == 0) {
		    result.put("success", false);
		    result.put("message", "리뷰할 메뉴 정보를 찾을 수 없습니다.");
		    return result;
		}

		if(rPicture != null && !rPicture.isEmpty()) {
			try {
				String subDirectory = "review"; // 리뷰 이미지를 저장할 서브 디렉토리
				Path uploadPath = Paths.get(uploadBaseDir, subDirectory); // uploadBaseDir 사용

				// 디렉토리가 없으면 생성
				if (!java.nio.file.Files.exists(uploadPath)) { // java.nio.file.Files 사용
					java.nio.file.Files.createDirectories(uploadPath);
				}

				String originalFileName = rPicture.getOriginalFilename();
				String fileExtension = "";
				if(originalFileName != null && originalFileName.contains(".")) {
					fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
				}
				String savedFilename = UUID.randomUUID().toString() + fileExtension;

				Path targetLocation = uploadPath.resolve(savedFilename);

				log.info("MenuAjaxController: uploadBaseDir = {}", uploadBaseDir); 
				log.info("MenuAjaxController: subDirectory = {}", subDirectory);   
				log.info("MenuAjaxController: Constructed uploadPath = {}", uploadPath); 
				log.info("MenuAjaxController: Target file location = {}", targetLocation); 

				// 파일 저장
				/*
				 * rPicture.transferTo(targetLocation.toAbsolutePath().toFile());
				 * log.info("MenuAjaxController: File saved successfully to {}",
				 * targetLocation);
				 */

				// DB에 저장할 웹 접근 가능한 URL 형식으로 설정
				String fileUrl = fileUploadService.uploadFile(rPicture, subDirectory);
				review.setRPicture(fileUrl);
				log.info("MenuAjaxController: rPicture set to {}", review.getRPicture()); // 추가

			} catch (IOException e) {
				log.error("리뷰 이미지 업로드 중 IOException 발생: {}", e.getMessage(), e);
				result.put("success", false);
				result.put("message", "이미지 업로드 중 파일 시스템 오류가 발생했습니다.");
				return result;
			} catch (Exception e) {
				log.error("리뷰 이미지 업로드 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
				result.put("success", false);
				result.put("message", "이미지 업로드 중 알 수 없는 오류가 발생했습니다.");
				return result;
			}
		} else {
			review.setRPicture(null);
		}

		review.setStatus("일반");
		bobService.addReview(review);

		result.put("reviewList", bobService.getReviewList(review.getSId()));
		result.put("reviewReplyMap", bobService.getReviewReplyMap(review.getSId()));
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(review.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		result.put("shopOwnerId", shopOwnerId);
		result.put("success", true);

		return result;
	}

	//댓글 수정 메서드
	@PatchMapping("/reviewUpdate.ajax")
	@ResponseBody
	public Map<String, Object> updateReview(@ModelAttribute Review review,
			@RequestParam(value="reviewUploadFile", required=false) MultipartFile rPicture){

		// ... (유효성 검사 및 메뉴 정보 파싱 로직은 그대로 둡니다)

		// 파일 업로드 처리
		if (rPicture != null && !rPicture.isEmpty()) {
		    try {
				String subDirectory = "review"; // 리뷰 이미지를 저장할 서브 디렉토리
				Path uploadPath = Paths.get(uploadBaseDir, subDirectory); // uploadBaseDir 사용

				// 디렉토리가 없으면 생성
				if (!java.nio.file.Files.exists(uploadPath)) {
					java.nio.file.Files.createDirectories(uploadPath);
				}

		        String originalFileName = rPicture.getOriginalFilename();
		        String fileExtension = "";
		        if(originalFileName != null && originalFileName.contains(".")) {
		        	fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
		        }
		        String savedFilename = UUID.randomUUID().toString() + fileExtension;

		        Path targetLocation = uploadPath.resolve(savedFilename);

				log.info("MenuAjaxController: uploadBaseDir = {}", uploadBaseDir); // 추가
				log.info("MenuAjaxController: subDirectory = {}", subDirectory);   // 추가
				log.info("MenuAjaxController: Constructed uploadPath = {}", uploadPath); // 추가
				log.info("MenuAjaxController: Target file location = {}", targetLocation); // 추가

		        // 파일 저장
		        rPicture.transferTo(targetLocation.toAbsolutePath().toFile());
				log.info("MenuAjaxController: File saved successfully to {}", targetLocation); // 추가

		        // DB에 저장할 웹 접근 가능한 URL 형식으로 설정
				String fileUrl = fileUploadService.uploadFile(rPicture, subDirectory);
		        review.setRPicture(fileUrl);
				log.info("MenuAjaxController: rPicture set to {}", review.getRPicture()); // 추가

		    } catch (IOException e) {
		        log.error("리뷰 이미지 수정 중 IOException 발생: {}", e.getMessage(), e);
		        Map<String, Object> errorResult = new HashMap<>();
		        errorResult.put("success", false);
		        errorResult.put("message", "이미지 수정 중 파일 시스템 오류가 발생했습니다.");
		        return errorResult;
		    } catch (Exception e) {
		        log.error("리뷰 이미지 수정 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
		        Map<String, Object> errorResult = new HashMap<>();
		        errorResult.put("success", false);
		        errorResult.put("message", "이미지 수정 중 알 수 없는 오류가 발생했습니다.");
		        return errorResult;
		    }
		} else {
		    // 파일이 없는 경우: 기존 rPicture 값을 유지
		}

		bobService.updateReview(review);

		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", bobService.getReviewList(review.getSId()));
		result.put("reviewReplyMap", bobService.getReviewReplyMap(review.getSId()));
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(review.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		result.put("shopOwnerId", shopOwnerId);

		return result;
	}

	// 댓글 삭제 메서드
	@DeleteMapping("/reviewDelete.ajax")
	public Map<String, Object> deleteReview(@RequestParam("rNo") int rNo,
			@RequestParam("sId")int sId){
		bobService.deleteReview(rNo, sId);
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", bobService.getReviewList(sId));
		result.put("reviewReplyMap", bobService.getReviewReplyMap(sId));
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(sId);
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		result.put("shopOwnerId", shopOwnerId);
		
		return result;
	}
	
	
	// 대댓글 쓰기 메서드	
	@PostMapping("/reviewReplyWrite.ajax")
	@ResponseBody
	public Map<String, Object> addReviewReply(@RequestParam("rNo") int rNo, @RequestParam("sId") int sId, @RequestParam("id") String id, @RequestParam("content") String content){
		ReviewReply reviewreply = new ReviewReply(); 
		reviewreply.setRNo(rNo);
		reviewreply.setSId(sId);
		reviewreply.setId(id);
		reviewreply.setContent(content);
		log.info("대댓글 등록 rNo: {}", reviewreply.getRNo());		
		log.info("대댓글 등록 reviewreply: {}", reviewreply);
		log.info("addReviewReply: reviewreply={}", reviewreply);
		log.info("addReviewReply: rNo={}, sId={}, id={}", reviewreply.getRNo(), reviewreply.getSId(), reviewreply.getId());
		reviewreply.setStatus("일반");
		bobService.addReviewReply(reviewreply);
				List<Review> reviewList = bobService.getReviewList(reviewreply.getSId());
		Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(reviewreply.getSId());
		
		// ---	추가할 로그 시작 ---
		log.info("MenuAjaxController: reviewList sId check:");
		for (Review r : reviewList) {
		    log.info("  Review rNo: {}, sId: {}", r.getRNo(), r.getSId());
		}
		// ---	추가할 로그 끝 ---

		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(reviewreply.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", reviewList);
		result.put("reviewReplyMap", reviewReplyMap);
		result.put("shopOwnerId", shopOwnerId);
		return result;
	}
	
	// 대댓글 수정 메서드
	@PatchMapping("/reviewReplyUpdate.ajax")
	@ResponseBody
	public Map<String, Object> updateReviewReply(@RequestBody ReviewReply reviewreply){
		bobService.updateReviewReply(reviewreply);
		
		List<Review> reviewList = bobService.getReviewList(reviewreply.getSId());
		Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(reviewreply.getSId());
		
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(reviewreply.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", reviewList);
		result.put("reviewReplyMap", reviewReplyMap);
		result.put("shopOwnerId", shopOwnerId);
		return result;
	}
	
	// 대댓글 삭제 메서드
	@DeleteMapping("/reviewReplyDelete.ajax")
	@ResponseBody
	public Map<String, Object> deleteReviewReply(@RequestParam("rrNo") int rrNo, @RequestParam("sId") int sId){
		bobService.deleteReviewReply(rrNo);
		
		List<Review> reviewList = bobService.getReviewList(sId);
		Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(sId);
		
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(sId);
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", reviewList);
		result.put("reviewReplyMap", reviewReplyMap);
		result.put("shopOwnerId", shopOwnerId);
		return result;
	}
	
	
	// 특정 가게에서 리뷰 가능한 주문 목록을 가져오는 메서드
	@GetMapping("/ajax/reviewableOrders")
	public ResponseEntity<List<Orders>> getReviewableOrders(@RequestParam("sId") int sId, HttpSession session){
		String userId = (String) session.getAttribute("loginId");
		if(userId == null || userId.trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		List<Orders> reviewableOrders = bobService.getReviewableOrdersForShop(userId, sId);
		return ResponseEntity.ok(reviewableOrders);
	}
	

}