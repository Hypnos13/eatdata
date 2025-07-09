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
public class BobContoller {
	
	@Autowired
	private ShopService shopService;

	@GetMapping({"/", "/main"})
	public String Main() {
		return "views/main";
	}
	
	@GetMapping({"/oMain"})
	public String oMain() {
		return "views/oMain";
	}
	
	@PostMapping("/insertShop")
	public String insertShop(Shop shop) {
		shopService.insertShop(shop);
		return "redirect:oMain";
	}
	
	@GetMapping({"/shopList"})
	public String shopList(Model model) {
		model.addAttribute("sList", shopService.shopList());
		return "oMain";
	}
	
}
