package com.projectbob.controller;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.projectbob.domain.CustomerService;
import com.projectbob.domain.NoticeBoard;
import com.projectbob.service.CustomerServiceService;

@Controller
public class CustomerServiceController {

	@Autowired
	CustomerServiceService csService;
	
	// FAQ 페이지
	@GetMapping("/faqList")
	public String FAQList(Model model, @RequestParam(name = "type", defaultValue = "") String type) {
		
		 List<CustomerService> csList = csService.FAQList(type);
		 model.addAttribute("csList", csList);
		return "admin/FAQList";
	}

	// FAQ 글쓰기
	@PostMapping("/writeFAQ")
	public String writeFAQ(Model model, CustomerService cs) {
		
		csService.writeFAQ(cs);
		
		return "redirect:/faqList";
	}
	
	// FAQ 수정 폼
	@GetMapping("/updateFAQForm")
	public String updateFAQForm(Model model, @RequestParam("csNo") int csNo) {
		
		model.addAttribute("csFAQ", csService.getFAQ(csNo));
		
		return "admin/updateFAQForm";
	}
	
	// FAQ 수정
	@PostMapping("/updateFAQ")
	public String updateFAQ(Model model, CustomerService cs) {
		
		csService.updateFAQ(cs);
		
		return "redirect:/faqList";
	}
	
	// FAQ 글 삭제
	@GetMapping("/deleteFAQ")
	public String deleteFAQ(@RequestParam("csNo") int csNo) {
		
		csService.deleteFAQ(csNo);
		
		return "redirect:/faqList";
	}
	
	// 공지사항 페이지
	@GetMapping("/noticeList")
	public String noticeList(Model model) {
		
		
		
		return "admin/noticeList";
	}
	
	// 공지사항 쓰기
	@PostMapping("/writeNotice")
	public String writeNotice(Model model, NoticeBoard noticeBoard, @RequestParam("start") Date start, @RequestParam("end") Date end) {
		
		Timestamp startDay = new  Timestamp(start.getTime());
		Timestamp endDay = new  Timestamp(end.getTime());
		
		noticeBoard.setStartDay(startDay);
		noticeBoard.setEndDay(endDay);
		
		csService.writeNotice(noticeBoard);
			
		return "admin/noticeList";
	}
	
}
