package com.projectbob.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

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
	
	
	  @Autowired private BobService bobService; // 가게 전체 게시글 리스트 요청을 처리하는 메서드
	  

	  @GetMapping("/shopList")
	  public String shopList(@RequestParam(name="category", defaultValue="전체보기") String category, Model model) {
	      model.addAttribute("selectedCategory", category);
//		  log.info("BobController: shopList() called"); 
//		  model.addAttribute("sList",bobService.shopList()); 
	      return "views/shopList"; 
	  }
	  
	  // 가게 상세보기 메서드
	  @GetMapping("/MenuDetail")
	  public String getMenuDetail(Model model, @RequestParam("s_id") int s_id) {
		  model.addAttribute("shop",bobService.getMenuDetail(s_id));
		  return "views/MenuDetail";
	  }
	 
	
}
