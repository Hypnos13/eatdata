package com.projectbob.controller;

import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PaymentController {
	
	@GetMapping("/paymentkakao")
	public String showKakaoPayPage() {
		return "views/paymentkakao";
	}
	
	@GetMapping("/paymenttoss")
	public String showTossPayPage() {
		return "views/paymenttoss";
	}

	/*
	 * @PostMapping("/api/payment/complete")
	 * 
	 * @ResponseBody public Map<String, String> completePayment(@RequestBody
	 * Map<String, String> payload){ String paymentId = payload.get("paymentId");
	 * String orderIdFromClient = payload.get("orderId");
	 * 
	 * int newOrderNo = bobService.createOrder
	 * 
	 * return Map.of("status", "PAID","orderNo", newOrderNo); }
	 */
	@GetMapping("/api/item")
	@ResponseBody
	public Map<String,Object> getDummyItem(){
		return Map.of(
				"id", "test-item",
				"name", "테스트 상품",
				"price", 1234,
				"currency", "KRW"
				);
	}
}
