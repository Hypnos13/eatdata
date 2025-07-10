package com.projectbob.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.projectbob.domain.CustomerService;
import com.projectbob.service.CustomerServiceService;

@Controller
public class CustomerServiceController {

	@Autowired
	CustomerServiceService csService;
	
	
	@GetMapping("/faqList")
	public String FAQList(Model model, @RequestParam(name = "type", defaultValue = "") String type) {
		
		 List<CustomerService> csList = csService.FAQList(type);
		 model.addAttribute("csList", csList);
		return "admin/FAQList";
	}

	
	@PostMapping("/writeFAQ")
	public String writeFAQ(Model model, CustomerService cs) {
		
		csService.writeFAQ(cs);
		
		return "redirect:/faqList";
	}
	
	
	@GetMapping("/updateFAQForm")
	public String updateFAQForm(Model model, @RequestParam("csNo") int csNo) {
		
		model.addAttribute("csFAQ", csService.getFAQ(csNo));
		
		return "admin/updateFAQForm";
	}
	
	
	@PostMapping("/updateFAQ")
	public String updateFAQ(Model model, CustomerService cs) {
		
		csService.updateFAQ(cs);
		
		return "redirect:/faqList";
	}
	
	@GetMapping("/deleteFAQ")
	public String deleteFAQ(@RequestParam("csNo") int csNo) {
		
		csService.deleteFAQ(csNo);
		
		return "redirect:/faqList";
	}
}
