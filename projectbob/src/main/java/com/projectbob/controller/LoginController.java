package com.projectbob.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.projectbob.service.LoginService;

@Controller
public class LoginController {
	
	@Autowired
	LoginService loginService;

	@GetMapping("/login")
	public String Main() {
		return "members/login";
	}
	
	
	
}
