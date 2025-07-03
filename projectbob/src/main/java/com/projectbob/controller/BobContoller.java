package com.projectbob.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BobContoller {

	@GetMapping({"/", "/main"})
	public String Main() {
		return "views/main";
	}
	
    @GetMapping("/ownermain")
    public String ownermain() {
        return "views/ownermain"; // ownermain.html로 이동
    }
    
    @GetMapping("/ownerservice")
    public String ownerservice() {
    	return "views/ownerservice"; // ownerservice.html로 이동
    }
}
