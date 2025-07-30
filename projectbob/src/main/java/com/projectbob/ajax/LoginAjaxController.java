package com.projectbob.ajax;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.projectbob.domain.CustomerService;
import com.projectbob.domain.LikeList;
import com.projectbob.domain.Shop;
import com.projectbob.service.BobService;
import com.projectbob.service.CustomerServiceService;
import com.projectbob.service.LoginService;

@RestController
public class LoginAjaxController {

	@Autowired
	LoginService loginService;
	@Autowired
	CustomerServiceService csService;
	@Autowired
	BobService bobService;
	
	@GetMapping("/overlapId.ajax")
	public Map<String, Boolean> overlapId(@RequestParam("userId") String id){
		
		int check = loginService.login(id, "");  
		boolean result = check == -1 ? true : false ;  // -1 이면 아이디 존재하지 않고 나머지는 존재함
		
		Map<String, Boolean> resultMap = new HashMap<>();
		resultMap.put("result", result);
		
		return resultMap;
	}
	
}
