package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.projectbob.domain.*;
import com.projectbob.dto.NewOrder;
import com.projectbob.service.*;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class BobController {

    private final LoginController loginController;
	
	@Autowired 
	private BobService bobService; // 가게 전체 게시글 리스트 요청을 처리하는 메서드
	@Autowired
	private LoginService loginService;
	
	
    BobController(LoginController loginController) {
        this.loginController = loginController;
    }

	@GetMapping({"/", "/main"})
	public String Main() {		
		return "views/main";
	}
	
	@GetMapping("/end")
	public String completed() {
		return "views/completed";
	}
	
	@GetMapping("/ordercheckout")
	public String ordercheckout() {
		return "views/ordercheckout";
	}
	
	  @GetMapping("/shopList") 
	  public String shopList(@RequestParam(value="category",required=false,
			  	defaultValue="전체보기") String category,
			  @RequestParam(value="keyword", required= false, defaultValue="null")String keyword,
			  Model model,HttpSession session,
			  @RequestParam(value="address", required = false) String address) {
	  log.info("BobController: shopList() called, category={}", category); 
	  if (keyword == null || "null".equals(keyword)) keyword = "";
		if(category == null) category = "전체보기";
		 log.info("category = {}", category);
		 List<Shop> shopList = bobService.shopList(category,keyword);
		  		  
		  for (Shop shop : shopList) {
		      log.info("Shop in sList: sId={}, name={}", shop.getSId(), shop.getName());
		  }
	  model.addAttribute("sList",bobService.shopList(category,keyword));
	  model.addAttribute("selectedCategory", category);
	  model.addAttribute("userAddress", address);
	  
	  String loginId = (String) session.getAttribute("loginId");
	  if(loginId != null) {
		  List<Integer> likeShopList = bobService.getLikeShopList(loginId);
		  model.addAttribute("likeShopList", likeShopList);
	  }
	  
	  	return "views/shopList"; 
	  }


	  	// 가게 상세보기 메서드		
		  @GetMapping("/MenuDetail") 
		  public String getMenuDetail(Model model,		  
		  @RequestParam("sId") int sId,
		  HttpSession session) {
		  log.info("BobController: /MenuDetail 호출. 요청 s_id: {}", sId); // 가게 정보 가져오기
		  
		  Shop shop = bobService.getShopDetail(sId);
		  
		  if (shop != null) {
		      log.info("BobController: getMenuDetail - Retrieved shop sId: {}", shop.getSId());
		  } else {
		      log.warn("BobController: getMenuDetail - No shop found for sId: {}", sId);
		  }
		  
		  List<Menu> menuList = bobService.getMenuListByShopId(sId);
		  model.addAttribute("shop", shop);
		  model.addAttribute("menuList", menuList);
		  
		  List<Review> reviewList = bobService.getReviewList(sId);
		  model.addAttribute("reviewList", reviewList);
		  
		  // 회원 정보 세팅
		  String loginId = (String) session.getAttribute("loginId");
		  Member member = null;
		  if(loginId != null) {
			  member = loginService.getMember(loginId);
		  }
		 model.addAttribute("member", member);
		  
		 // 찜
		 boolean liked = false;
		 if(member != null) {
			 LikeList likeDto = new LikeList();
			 likeDto.setId(loginId);
			 likeDto.setSId(sId);
			 liked = bobService.isLiked(likeDto) > 0;			 
		 }
		 model.addAttribute("liked", liked);
		 model.addAttribute("heartCount", shop.getHeart());
		 
		 // 리뷰 탭
		  double reviewAvg = 0.0;
		  if (!reviewList.isEmpty()) {
			  reviewAvg = reviewList.stream().mapToInt(Review::getRating).average().orElse(0.0);			  
		  }
		  model.addAttribute("reviewAvg", reviewAvg);
		  
		  model.addAttribute("now", System.currentTimeMillis());
		  		  
		 Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(sId);
		 model.addAttribute("reviewReplyMap", reviewReplyMap);
		  
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
				  HttpSession session,
				  Model model) {
			  System.out.println("menuId=" + menuId + " count=" + count + " optionIds=" + optionIds + " totalPrice=" + totalPrice);
			  model.addAttribute("menuId", menuId);
			  model.addAttribute("count", count);
			  model.addAttribute("optionIds", optionIds);
			  model.addAttribute("totalPrice", totalPrice);
			  
			  String loginId = (String) session.getAttribute("loginId");
			  if(loginId != null) {
				  Member member = loginService.getMember(loginId);
				  model.addAttribute("member", member);
			  }
			  
			  return "views/pay";			  
		  }
		  
			/*
			 * @PostMapping("/pay") public String doPayment(@ModelAttribute NewOrder form,
			 * HttpSession session,Model model) {
			 * 
			 * int orderId = bobService.createOrder(form);
			 * WebsocketService.sendNewOrder(form.getShopId(), form.getOrderId());
			 * 
			 * model.addAttribute("orderId", orderId); model.addAttribute("shopId",
			 * form.getShopId());
			 * 
			 * return "views/ordercheckout"; }
			 * 
			 * @GetMapping("/end") public String completed() { return "views/completed"; }
			 */
	
		  

}
