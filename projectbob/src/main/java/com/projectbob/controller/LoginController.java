package com.projectbob.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import com.projectbob.domain.Member;
import com.projectbob.service.LoginService;

@Controller
public class LoginController {
	
	@Autowired
	LoginService loginService;

	@GetMapping("/login")
	public String loginForm() {
		return "members/login";
	}
	
	@PostMapping("/login")
	public String login() {
		return "views/main";
	}
	
	@PostMapping("/joinMember")
	public String joinMember(Model model, Member member) {
		
		//loginService.joinMember(member);
		
		return "views/main";
	}
	
	@PostMapping("/searchIdPass")
	public String searchIdPass() {
		return "views/main";
	}
	
	@GetMapping("/myProfile")
	public String myProfile() {
		return "members/updateMemberships";
	}
	
	@PostMapping("/updateMember")
	public String updateMember() {
		return "views/main";
	}
	
}
