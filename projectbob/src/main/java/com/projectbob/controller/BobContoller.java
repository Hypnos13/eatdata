package com.projectbob.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BobContoller {
	
	@GetMapping("/oMain")
    public String oMain() {
    	return "views/oMain"; // oMain.html로 이동
    }
    
	@GetMapping("/oService")
    public String oService() {
		return "views/oService"; // oService.html로 이동
    }
}