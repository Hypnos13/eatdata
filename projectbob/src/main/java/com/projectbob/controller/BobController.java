package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.*;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.projectbob.domain.*;
import com.projectbob.service.*;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class BobController {
	
    
    @Autowired
	private LoginController loginController;
	
	@Autowired
	private BobService bobService; // 가게 전체 게시글 리스트 요청을 처리하는 메서드
	
	
	@PostMapping("/getAddress")
	public ResponseEntity<Map<String, Object>> getAddresses(HttpSession session) {
	    Map<String, Object> responseBody = new HashMap<>();
	    String userId = (String) session.getAttribute("loginId");

	    System.out.println("[DEBUG] 세션 userId: " + userId);

	    if (userId == null || userId.trim().isEmpty()) {
	        responseBody.put("success", false);
	        responseBody.put("message", "로그인이 필요합니다.");
	        responseBody.put("addressList", Collections.emptyList());
	        return ResponseEntity.status(401).body(responseBody);
	    }

	    try {
	        List<Addressbook> addresses = bobService.getAddressesByUserId(userId);
	        System.out.println("[DEBUG] 조회된 주소 수: " + addresses.size());

	        // 디버그용 주소 상세 출력
	        addresses.forEach(addr -> System.out.printf("[DEBUG] 주소 no: %d, aName: %s, address1: %s, address2: %s%n",
	                addr.getNo(), addr.getAName(), addr.getAddress1(), addr.getAddress2()));

	        responseBody.put("success", true);
	        responseBody.put("message", "사용자 ID로 주소 조회 성공");
	        responseBody.put("addressList", addresses);
	        return ResponseEntity.ok(responseBody);
	    } catch (Exception e) {
	        System.err.println("주소 조회 중 오류 발생: " + e.getMessage());
	        responseBody.put("success", false);
	        responseBody.put("message", "주소 조회 중 서버 오류가 발생했습니다.");
	        responseBody.put("addressList", Collections.emptyList());
	        return ResponseEntity.internalServerError().body(responseBody);
	    }
	}

	@GetMapping({"/", "/main"})
	public String Main() {		
		return "views/main";
	}
	 
	
	@GetMapping("/end")
	public String completed() {
		return "views/completed";
	}
	
	  @GetMapping("/shopList") 
	  public String shopList(@RequestParam(value="category",required=false,
			  	defaultValue="전체보기") String category,
			  @RequestParam(value="keyword", required= false, defaultValue="null")String keyword,
			  Model model,@RequestParam(value="address", required = false) String address) {
	  log.info("BobController: shopList() called, category={}", category); 
	  if (keyword == null || "null".equals(keyword)) keyword = "";
		if(category == null) category = "전체보기";
		 log.info("category = {}", category);
	  model.addAttribute("sList",bobService.shopList(category,keyword));
	  model.addAttribute("selectedCategory", category);
	  model.addAttribute("userAddress", address);
	  	return "views/shopList"; 
	  }


	  	// 가게 상세보기 메서드		
		  @GetMapping("/MenuDetail") 
		  public String getMenuDetail(Model model,HttpSession session,	  
		  @RequestParam("sId") int sId) {
		  log.info("BobController: /MenuDetail 호출. 요청 s_id: {}", sId); // 가게 정보 가져오기
		  session.setAttribute("lastShopId", sId);
		  
		  Shop shop = bobService.getShopDetail(sId);
		  List<Menu> menuList = bobService.getMenuListByShopId(sId);
		  model.addAttribute("shop", shop);
		  model.addAttribute("menuList", menuList);
		  
		  List<Review> reviewList = bobService.reviewList(sId);
		  model.addAttribute("reviewList", reviewList);
		  
		 //model.addAttribute("member", member);
		  
		  double reviewAvg = 0.0;
		  if (!reviewList.isEmpty()) {
			  reviewAvg = reviewList.stream().mapToInt(Review::getRating).average().orElse(0.0);			  
		  }
		  model.addAttribute("reviewAvg", reviewAvg);
		  
		  String userId = (String) session.getAttribute("userId");
		    String guestId = (String) session.getAttribute("guestId"); // 비회원 guestId

		    CartSummaryDto cartSummary = bobService.getCartByUser(userId, guestId);

		  List<Cart> cartList = cartSummary.getCartList();
		  int totalQuantity = cartSummary.getTotalQuantity();
		  int totalPrice = cartSummary.getTotalPrice();
		    
		  model.addAttribute("cartList",cartList);
		  model.addAttribute("totalQuantity",totalQuantity);
		  model.addAttribute("totalPrice",totalPrice);
		  log.info("장바구니 총 수량: {}, 총액: {}", totalQuantity, totalPrice); 
		 
		  
		  return "views/MenuDetail"; 
		  }
		  
	// 모달창 메뉴옵션보기 메서드
		  @GetMapping("/menuOptions")
		  @ResponseBody
		  public List<MenuOption> menuOptions(@RequestParam("mId") int mId){
			  return bobService.getMenuOptionsByMenuId(mId);
		  }
		  
		  

		  //데이터저장용  임시방편
		  @GetMapping("/pay")
		  public String payPageGet(HttpSession session, Model model) {
		      String userId = (String) session.getAttribute("userId");
		      String guestId = (String) session.getAttribute("guestId");

		      // 세션 기준 주문 내역 조회
		      CartSummaryDto cartSummary = bobService.getCartSummaryForUserOrGuest(userId, guestId);

		      // 뷰에 데이터 전달
		      model.addAttribute("orderSummary", cartSummary);
		      model.addAttribute("orderedItems", cartSummary.getCartList());
		      model.addAttribute("finalTotalPrice", cartSummary.getTotalPrice());

		      return "views/pay";
		  }
		  
		  //스크립트ajax
		  @PostMapping("/payjs")
			public String payJsPage(@RequestBody OrderData orderData, HttpSession session, Model model) {
			    String userId = (String) session.getAttribute("userId");
			    String guestId = (String) session.getAttribute("guestId");

			    // 주문 처리 (DB 저장)
			    bobService.processAndAddCartItems(orderData.getCartList(), userId, guestId);

			    // 처리 후 주문 내역 다시 조회
			    CartSummaryDto cartSummary = bobService.getCartSummaryForUserOrGuest(userId, guestId);

			    // 뷰에 데이터 전달
			    model.addAttribute("orderSummary", cartSummary);
			    model.addAttribute("orderedItems", cartSummary.getCartList());
			    model.addAttribute("finalTotalPrice", cartSummary.getTotalPrice());

			    // views/pay.jsp (또는 pay.html) 뷰를 그대로 렌더링해서 반환
			    return "views/pay";
			}
		
}
