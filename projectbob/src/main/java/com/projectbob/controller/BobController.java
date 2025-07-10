package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
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
	
	@Autowired private ShopService shopService;

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
		return "shop/oMain";
	}
	@PostMapping("/insertShop")
	public String insertShop(Shop shop) {
		System.out.println("id test"+shop.getId());
		shopService.insertShop(shop);
		return "redirect:oMain";
	}
	
	
	@GetMapping("/oService")
	public String oService() {
		return "shop/oService";
	}
	
	@GetMapping("/oBasicSet")
	public String oBasicSet() {
		return "shop/oBasicSet";
	}
	
	
	  
	  @GetMapping("/shopList") 
	  public String shopList(Model model) {
//	  log.info("BobController: shopList() called"); 
//	  model.addAttribute("sList",bobService.shopList()); 
	  	return "views/shopList"; 
	  }
	  
	  // 가게 상세보기 메서드
	  @GetMapping("/MenuDetail")
	  public String getMenuDetail(Model model, @RequestParam("s_id") int s_id) {
		  model.addAttribute("shop",bobService.getMenuDetail(s_id));
		  return "views/MenuDetail";
	  }
	 
	
}
