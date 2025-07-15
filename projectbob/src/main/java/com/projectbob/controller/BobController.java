package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
import java.util.*;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.projectbob.domain.*;
import com.projectbob.service.*;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class BobController {

    private final LoginController loginController;
	
	@Autowired private BobService bobService; // 가게 전체 게시글 리스트 요청을 처리하는 메서드
	
    BobController(LoginController loginController) {
        this.loginController = loginController;
    }

	@GetMapping({"/", "/main"})
	public String Main() {		
		return "views/main";
	}
	 
	@GetMapping("/menu")
	public String menu() {
		return "views/menudetail";
	}
	/*
	 * @GetMapping("/pay") public String pay() { return "views/pay"; }
	 */
	
	@GetMapping("/end")
	public String completed() {
		return "views/completed";
	}
	
	  @GetMapping("/shopList") 
	  public String shopList(@RequestParam(value="category",required=false,
			  	defaultValue="전체보기") String category,
			  Model model) {
	  log.info("BobController: shopList() called, category={}", category); 
	  model.addAttribute("sList",bobService.shopList(category));
	  model.addAttribute("selectedCategory", category);
	  	return "views/shopList"; 
	  }

//	  @GetMapping("/shopList")
//	  public String shopList(@RequestParam(name="category", defaultValue="전체보기") String category, Model model) {
//	      model.addAttribute("selectedCategory", category);
//		  log.info("BobController: shopList() called"); 
//		  model.addAttribute("sList",bobService.shopList()); 
//	      return "views/shopList"; 


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
		  

}
