package com.projectbob.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BobContoller {

	@GetMapping({"/", "/main"})
	public String Main() {
		return "views/main";
	}
	
}
