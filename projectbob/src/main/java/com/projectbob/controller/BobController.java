package com.projectbob.controller;

<<<<<<< HEAD
import org.springframework.beans.factory.annotation.*;
=======
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
>>>>>>> seon
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

<<<<<<< HEAD
import com.projectbob.domain.*;
import com.projectbob.service.*;
=======
import com.projectbob.domain.Menu;
import com.projectbob.domain.Shop;
import com.projectbob.service.BobService;
>>>>>>> seon

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
		return "views/oMain";
	}
	@PostMapping("/insertShop")
	public String insertShop(Shop shop) {
		System.out.println("id test"+shop.getId());
		shopService.insertShop(shop);
		return "redirect:oMain";
	}
	
	
	@GetMapping("/oService")
	public String oService() {
		return "views/oService";
	}
	
	
<<<<<<< HEAD
	
	  
=======
	  @Autowired private BobService bobService; // 가게 게시글 리스트 요청을 처리하는 메서드

>>>>>>> seon
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
		  
		  return "views/MenuDetail"; 
		  }
		  
		 
}
