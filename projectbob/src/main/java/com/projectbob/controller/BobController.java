package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
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
	
	//회원인지 비회원인지 체크 
	 private String resolveId(HttpSession session) {
	        String id = (String) session.getAttribute("loginId");
	        if (id == null) {
	            id = (String) session.getAttribute("guestId"); // 비회원용
	        }
	        return id;
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
		  public String getMenuDetail(Model model,		  
		  @RequestParam("sId") int sId) {
		  log.info("BobController: /MenuDetail 호출. 요청 s_id: {}", sId); // 가게 정보 가져오기
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
		  
		  return "views/MenuDetail"; 
		  }
		  
	// 모달창 메뉴옵션보기 메서드
		  @GetMapping("/menuOptions")
		  @ResponseBody
		  public List<MenuOption> menuOptions(@RequestParam("mId") int mId){
			  return bobService.getMenuOptionsByMenuId(mId);
		  }
		  
		  

		  // menudetail 에서 pay로 
		  @PostMapping("/pay")
		  public String payPage(
				  @RequestParam("menuId") Long menuId,
				  @RequestParam("count") int count,
				  @RequestParam("optionIds") String optionIds,
				  @RequestParam("totalPrice") int totalPrice,
				  Model model) {
			  System.out.println("menuId=" + menuId + " count=" + count + " optionIds=" + optionIds + " totalPrice=" + totalPrice);
			  model.addAttribute("menuId", menuId);
			  model.addAttribute("count", count);
			  model.addAttribute("optionIds", optionIds);
			  model.addAttribute("totalPrice", totalPrice);
			  
			  return "views/pay";			  
		  }
		  
		  
			// ▶ 장바구니 목록 조회
		    @GetMapping("/getmenuList")
		    public List<Cart> getCart(HttpSession session) {
		        String id = resolveId(session);
		        if (id == null) return Collections.emptyList(); // guestId도 없으면 빈값
		        return bobService.getCart(id);
		    }

		    // ▶ 메뉴 추가
		    @PostMapping("/addMenu")
		    public String addCart(@RequestBody Cart cart, HttpSession session) {
		        // 1. 로그인 ID 확인
		        String id = (String) session.getAttribute("loginId");

		        // 2. 로그인 안 된 경우 guestId 생성
		        if (id == null) {
		            id = (String) session.getAttribute("guestId");

		            // 3. 세션에 guestId가 없다면 새로 생성해서 저장
		            if (id == null) {
		                id = "guest_" + UUID.randomUUID().toString().substring(0, 8);
		                session.setAttribute("guestId", id);
		            }
		        }
		        // 4. cart에 ID 설정 후 저장
		        cart.setId(id);
		        return bobService.insertCart(cart) ? "success" : "fail";
		    }

		    // ▶ 수량 및 가격 수정
		    @PutMapping("/countUpdate")
		    public String updateCart(@RequestBody Cart cart, HttpSession session) {
		        String id = resolveId(session);
		        if (id == null || !id.equals(cart.getId())) return "login_required";
		        return bobService.updateCartQuantity(cart) ? "success" : "fail";
		    }

		    // ▶ 개별 항목 삭제
		    @DeleteMapping("/deleteMenu")
		    public String deleteCartItem(@RequestBody Cart cart, HttpSession session) {
		        String id = resolveId(session);
		        if (id == null || !id.equals(cart.getId())) return "login_required";
		        return bobService.deleteMenu(cart) ? "deleted" : "fail";
		    }

		    // ▶ 장바구니 전체 삭제
		    @DeleteMapping("/deleteMenuall")
		    public String deleteAllCart(HttpSession session) {
		        String id = resolveId(session);
		        if (id == null) return "login_required";
		        return bobService.deleteAllCart(id) ? "cleared" : "fail";
		    }
		    
		    //대기 컨트롤러 추가
//		    @PostMapping("/login")
//		    public String login(@RequestParam String id, @RequestParam String pw, HttpSession session) {
//		        if (userService.login(id, pw)) {
//		            // 1. 로그인 성공 → 세션 저장
//		            session.setAttribute("loginId", id);
		//
//		            // 2. guestId가 있다면 → cart 데이터 이전
//		            String guestId = (String) session.getAttribute("guestId");
//		            if (guestId != null) {
//		                bobService.transferGuestCartToUser(guestId, id);
//		                session.removeAttribute("guestId"); // 사용 완료 후 삭제
//		            }
		//
//		            return "redirect:/main";
//		        } else {
//		            return "redirect:/login?error";
//		        }
//		    }
		    
		    //대기 서비스단추가
//		    public void transferGuestCartToUser(String guestId, String loginId) {
//		        bobMapper.updateCartOwner(guestId, loginId);
//		    }
		    
		    //대기 쿼리추가
//		    <update id="updateCartOwner">
//		    UPDATE cart
//		    SET id = #{loginId}
//		    WHERE id = #{guestId}
//		    </update>

		  
		
}
