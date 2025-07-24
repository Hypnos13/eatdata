package com.projectbob.controller;

import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PaymentController {
	
	@GetMapping("/paymentkakao")
	public String showPaymentPage() {
		return "views/paymentkakao";
	}

	@GetMapping("/api/item")
	@ResponseBody
	public Map<String,Object> getDummyItem(){
		return Map.of(
				"id", "test-item",
				"name", "테스트 상품",
				"price", 1000,
				"currency", "KRW"
				);
	}
}
