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

	/*
	 * @GetMapping("/main2") public String Main2() { return "views/main2"; }
	 */
	@GetMapping("/menu")
	public String menu() {
		return "views/MenuDetail";
	}
	@GetMapping("/pay")
	public String pay() {
		return "views/pay";
	}
	@GetMapping("/end")
	public String completed() {
		return "views/completed";
	}
	
	
	  @Autowired private BobService bobService; // 가게 전체 게시글 리스트 요청을 처리하는 메서드
	  
	  @GetMapping("/shopList") 
	  public String shopList(Model model) {
	  log.info("BobController: shopList() called"); 
	  model.addAttribute("sList",bobService.shopList()); 
	  	return "views/shopList"; 
	  }
	  
	  // 가게 상세보기 메서드
	  @GetMapping("/MenuDetail")
	  public String getMenuDetail(Model model, @RequestParam("s_id") int s_id) {
		  // 가게 정보 가져오기
		  Shop shop = bobService.getShopDetail(s_id);
		  model.addAttribute("shop", shop);
		  // 해당 가게의 메뉴 목록 가져오기
		  List<Menu> menuList = bobService.getMenuListOption(s_id);
		  model.addAttribute("menuList",menuList);
		  // 메뉴 카테고리 목록 가져오기
		  List<String> menuCategory = bobService.getMenuCategoriesByShopId(s_id);
		  model.addAttribute("menuCategory", menuCategory);
		  
		 
		  return "views/MenuDetail";
	  }
	 
	
}
