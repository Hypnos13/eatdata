package com.projectbob.controller;

import java.io.IOException;
import java.io.PrintWriter;
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
import com.projectbob.domain.Shop;
import com.projectbob.service.CustomerServiceService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public class CustomerServiceController {

	@Autowired
	CustomerServiceService csService;
	
	// FAQ 페이지
	@GetMapping("/faqList")
	public String FAQList(Model model, @RequestParam(name = "type", defaultValue = "") String type, @RequestParam(name ="from", defaultValue = "client") String from) {
		
		 List<CustomerService> csList = csService.FAQList(type);
		 model.addAttribute("csList", csList);
		 model.addAttribute("from", from);
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
	public String noticeList(Model model, NoticeBoard noticeBoard  , HttpSession session, @RequestParam(name ="from", defaultValue = "client") String from) {
		
		String userDv = (String) session.getAttribute("loginDisivion");
		if(userDv == null) { userDv="client";}
		
		List<NoticeBoard> notice =  csService.noticeList(userDv);
		
		model.addAttribute("noticeList", notice);
		model.addAttribute("from", from);
		
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
			
		return "redirect:/noticeList";
	}
	
	// 공지사항 자세히 보기
	@GetMapping("/noticeDetail")
	public String noticeDetail(Model model, @RequestParam("no") int no, @RequestParam(name ="from", defaultValue = "client") String from) {
		
		NoticeBoard notice =  csService.getNotice(no);
		model.addAttribute("notice", notice);
		model.addAttribute("from", from);
		
		return "admin/noticeDetail";
	}
	
	//공지사항 수정하기 폼 
	@GetMapping("/updateNoticeForm")
	public String updateNoticeForm(Model model, @RequestParam("no") int no) {
		
		NoticeBoard notice =  csService.getNotice(no);
		model.addAttribute("notice", notice);
		
		return "admin/updateNoticeForm";
	}	
	
	// 공지사항 수정하기 
	@PostMapping("/updateNotice")
	public String updateNotice(Model model, NoticeBoard noticeBoard, @RequestParam("start") Date start, @RequestParam("end") Date end) {
			
		Timestamp startDay = new  Timestamp(start.getTime());
		Timestamp endDay = new  Timestamp(end.getTime());
			
		noticeBoard.setStartDay(startDay);
		noticeBoard.setEndDay(endDay);
		
		csService.updateNotice(noticeBoard);
			
		return "redirect:/noticeList";
	}
	
	// 공지사항 삭제하기
	@GetMapping("/deleteNotice")
	public String deleteNotice(@RequestParam("no") int no) {
		
		csService.deleteNotice(no);
		
		return "redirect:/noticeList";
	}
	
	//가게 관리(관리자)
	@GetMapping("/shopManage")
	public String shopManage(Model model, @RequestParam(name="searchShop", defaultValue = "") String searchShop, @RequestParam(name= "keyword", defaultValue = "") String keyword) {
		
		List<Shop> shopList = csService.shopManageList(searchShop, keyword);
		model.addAttribute("shopList", shopList);
		
		return "admin/shopManage";
	}
	
	
	//가게 관리 수정(관리자)
	@GetMapping("/updateShopManage")
	public String updateShopManage(@RequestParam("sId") String sId , @RequestParam("category") String category, @RequestParam("status") String status , 
			HttpServletResponse response)throws ServletException, IOException{
	
		csService.updateShopManage(sId, category, status);
		
		response.setContentType("text/html; charset=utf-8");
		PrintWriter out = response.getWriter();
		out.println("<script>");
		out.println("	alert('저장이 완료되었습니다.');");
		out.println("	location.href='/shopManage';");
		out.println("</script>");
		
		return null;
	}
}
