package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
import java.util.*;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.projectbob.domain.*;
import com.projectbob.service.*;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
@RequestMapping("/owner")
public class ShopController {
	
	@Autowired
	private ShopService shopService;
	
	@Autowired
	private FileUploadService fileUploadService;
	
	@PostMapping("/insertShop")
	public String insertShop(
			@RequestParam("sNumber") String sNumber, @RequestParam("owner") String owner, 
			@RequestParam("phone") String phone, @RequestParam("name") String name, 
			@RequestParam("zipcode") String zipcode, @RequestParam("address1") String address1, 
			@RequestParam("address2") String address2, @RequestParam("sLicenseFile") MultipartFile sLicenseFile, 
			Model model ) {
		
		
		
		
		
		return "redirect:oMain";
	}
	
	
	@GetMapping("/shopMain")
	public String shopMain() {
		return "shop/shopMain";
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
