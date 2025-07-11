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
public class ShopController {    
	
	@Autowired private ShopService shopService;
	
	@GetMapping("/shopMain")
	public String shopMain() {
		return "shop/shopMain";
	}
	
	@PostMapping("/insertShop")
	public String insertShop(Shop shop) {
		System.out.println("id test"+shop.getId());
		shopService.insertShop(shop);
		return "redirect:shopMain";
	}
	
	@PostMapping("/insertMenu")
	public String insertMenu(Menu menu) {
		System.out.println("id test"+menu.getSId());
		shopService.insertMenu(menu);
		return "redirect:shopMain";
	}
	
	@GetMapping("/menuJoinForm")
	public String menuJoinForm() {
		return "shop/menuJoinForm";
	}
	
	@GetMapping("/shopInfo")
	public String shopInfo() {
		return "shop/shopInfo";
	}
	
	@GetMapping("/shopBasicSet")
	public String shopBasicSet() {
		return "shop/shopBasicSet";
	}
}
	