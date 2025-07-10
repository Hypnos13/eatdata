package com.projectbob.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.projectbob.domain.Menu;
import com.projectbob.domain.Shop;
import com.projectbob.service.BobService;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class BobController {

	@GetMapping({"/", "/main"})
	public String Main() {		
		return "views/main";
	}
	 
	@GetMapping("/menu")
	public String menu() {
		return "views/menudetail";
	}
	@GetMapping("/pay")
	public String pay() {
		return "views/pay";
	}
	@GetMapping("/end")
	public String completed() {
		return "views/completed";
	}
	@GetMapping("/oMain")
	public String oMain() {
		return "views/oMain";
	}
	@GetMapping("/oService")
	public String oService() {
		return "views/oService";
	}
	
	
	  @Autowired private BobService bobService; // 가게 게시글 리스트 요청을 처리하는 메서드
	  
<<<<<<< HEAD
	  @GetMapping("/shopList") 
	  public String shopList(@RequestParam(value="category",required=false,
			  	defaultValue="전체보기") String category,
			  Model model) {
	  log.info("BobController: shopList() called, category={}", category); 
	  model.addAttribute("sList",bobService.shopList(category));
	  model.addAttribute("selectedCategory", category);
	  	return "views/shopList"; 
=======

	  @GetMapping("/shopList")
	  public String shopList(@RequestParam(name="category", defaultValue="전체보기") String category, Model model) {
	      model.addAttribute("selectedCategory", category);
//		  log.info("BobController: shopList() called"); 
//		  model.addAttribute("sList",bobService.shopList()); 
	      return "views/shopList"; 
>>>>>>> 64250a810bb92fa73ea407fac98699ed5a1bfa06
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
		  
		  return "views/MenuDetail"; 
		  }
		  
		 
}
