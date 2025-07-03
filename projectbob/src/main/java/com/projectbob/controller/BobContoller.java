package com.projectbob.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BobContoller {

	@GetMapping({"/", "/main"})
	public String Main() {
		return "views/main";
	}
	
	@GetMapping("/main2")
	public String Main2() {
		return "views/main2";
	}
	@GetMapping("/menu")
	public String menu() {
		return "views/MenuDetail";
	}
}
