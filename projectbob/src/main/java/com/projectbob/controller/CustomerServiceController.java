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
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.projectbob.domain.Addressbook;
import com.projectbob.domain.ChatMessage;
import com.projectbob.domain.Coupon;
import com.projectbob.domain.CustomerService;
import com.projectbob.domain.Member;
import com.projectbob.domain.NoticeBoard;
import com.projectbob.domain.Shop;
import com.projectbob.service.CustomerServiceService;
import com.projectbob.service.LoginService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public class CustomerServiceController {

	@Autowired
	CustomerServiceService csService;
	@Autowired
	LoginService loginService;
	
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
		
		String userDv = (String) session.getAttribute("loginDivision");
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
	
	//챗봇에게 질문 보내기
	@PostMapping("/send")
	public String sendMessage(RedirectAttributes rda, ChatMessage chatMessage){
		
		chatMessage.setRole("user");
		csService.insertChatMessage(chatMessage);
		
		String response = csService.chatCounselor(chatMessage.getMessage());
		
		chatMessage.setRole("bot");
		chatMessage.setMessage(response);
		csService.insertChatMessage(chatMessage);
		
		rda.addAttribute("id", chatMessage.getId());
		
		return "redirect:/chatForm";
	}
	
	//챗봇에게 과거 대화내역
	@PostMapping("/chatHistory")
	public String chatHistory(Model model, @RequestParam("id") String id, @RequestParam("message") String message ){
			
		List<ChatMessage> messages = csService.getChatMessage(id);
		model.addAttribute("messages", messages);
			
		return "admin/chatBot";
	}
	
	//챗봇 대화 창으로 이동
	@GetMapping("/chatForm")
	public String chatForm(Model model, HttpSession session, HttpServletResponse response, @RequestParam(name="id",required = false) String id) throws ServletException, IOException {
		
		Boolean isLogin = (Boolean) session.getAttribute("isLogin");
		
		if(isLogin ==null || !isLogin) {
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			out.println("	alert('로그인 후 이용 가능합니다.');");
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}
		
		if(id == null) {
			id = (String) session.getAttribute("loginId");
		}
		
		List<ChatMessage> messages = csService.getChatMessage(id);
		
		if(messages == null || messages.isEmpty()){
			ChatMessage greet = new ChatMessage();
			greet.setRole("bot");
			greet.setMessage("안녕하세요! 무엇을 도와드릴까요?");
			messages = List.of(greet);
		}
		
		model.addAttribute("messages", messages);
		model.addAttribute("id", id);
			
		return "admin/chatBot";
	}
	
	// 마이페이지
	@GetMapping("/myPage")
	public String myPage(Model model, HttpSession session){
			
	 String id = (String)session.getAttribute("loginId");  
	 Member member =  loginService.getMember(id);
	 
	 model.addAttribute("member", member);
		  
	 return "members/myPage";			  
	}
		
	// 주소 관리
	@GetMapping("/myAddressbook")
	public String myAddressbook(Model model, HttpSession session){
			
	 String id = (String)session.getAttribute("loginId");  
	 List<Addressbook> addressbook = csService.getMyAddress(id);
	 
	 model.addAttribute("addressbook", addressbook);
		  
	 return "members/myAddressbook";			  
	}
		
	// 주소 관리 - 주소 등록
	@PostMapping("/addAddress")
	public String addAddress(Model model,Addressbook addressbook ,HttpSession session){
				
		String id = (String)session.getAttribute("loginId");
		addressbook.setId(id);
		
		csService.addAddress(addressbook);
			  
		return "redirect:myAddressbook";			  
	}
		
	// 주소 관리 - 주소 수정 폼
	@GetMapping("/updateAddressbookform")
	public String updateAddressbookform(Model model, @RequestParam("no") int no){
		
		Addressbook addressbook = csService.getAddress(no);
		model.addAttribute("addressbook", addressbook);
			  
		return "members/updateAddressbookForm";			  
	}
		
	// 주소 관리 - 주소 수정
	@PostMapping("/updateAddress")
	public String updateAddress(Model model,Addressbook addressbook ,HttpSession session){
				
		String id = (String)session.getAttribute("loginId");
		addressbook.setId(id);
			
		csService.updateAddress(addressbook);
				  
		return "redirect:myAddressbook";			  
	}
	
	// 주소 관리 - 주소 삭제
	@PostMapping("/deleteAddressbook")
	public String deleteAddressbook( @RequestParam("no") int no, HttpSession session){
					
		String id = (String)session.getAttribute("loginId");
		
		csService.deleteAddress(id, no);
			  
		return "redirect:myAddressbook";			  
	}
		
	// 찜목록
	@GetMapping("/likePage")
	public String likePage(Model model, HttpSession session){
			
		String id = (String)session.getAttribute("loginId");
		List<Shop> shopList = csService.getLikeList(id);
			
		model.addAttribute("shopList", shopList);
			
		return "members/likeList";			  
	}
	
	// 찜 목록 - 찜 누르기
	@GetMapping("/cancleLike")
	public String cancleLike(@RequestParam("sId") int sId, HttpSession session){
		
		String id = (String)session.getAttribute("loginId");
		csService.cancleLike(id, sId);
		
		return "redirect:likePage";
	}
	
	// 관리자 - 쿠폰관리
	@GetMapping("/couponManage")
	public String couponManageList(Model model, @RequestParam(name="searchCoupon", defaultValue = "") String searchCoupon, @RequestParam(name= "keyword", defaultValue = "") String keyword) {
		
		List<Coupon> couponList = csService.couponList(searchCoupon, keyword);
		
		model.addAttribute("couponList", couponList);
		
		return "admin/couponManageList";
	}
	
	// 관리자 - 쿠폰 생성하기 폼
	@GetMapping("/createCouponForm")
	public String createCouponForm(Model model) {
		
		List<Member> ml = loginService.clientList();
		
		model.addAttribute("memberList", ml);
		
		return "admin/createCouponForm";
	}
	
	// 관리자 - 쿠폰 생성
	@PostMapping("/createCoupon")
	public String createCoupon(Model model, Coupon coupon,@RequestParam("start") Date start, @RequestParam("end") Date end) {
		
		Timestamp startDay = new  Timestamp(start.getTime());
		Timestamp endDay = new  Timestamp(end.getTime());
		
		coupon.setRegDate(startDay);
		coupon.setDelDate(endDay);
		List<Member> ml = loginService.clientList();
		if(coupon.getId().equals("전체")) {
			for (Member m : ml) {
				coupon.setId(m.getId());
			    csService.createCoupon(coupon);
			}
		}else {
			csService.createCoupon(coupon);
		}
		
		return "redirect:couponManage";
	}
	
	// 관리자 - 쿠폰 수정
	@GetMapping("/updateCouponForm")
	public String updateCouponForm(Model model, @RequestParam("cNo") int cNo) {
		
		Coupon cp = csService.getCoupon(cNo);
		List<Member> ml = loginService.clientList();
		
		model.addAttribute("coupon", cp);
		model.addAttribute("memberList", ml);
		
		return "admin/updateCouponForm";
	}
	
	// 관리자 - 쿠폰 삭제
	@GetMapping("/deleteCoupon")
	public String deleteCoupon(Model model, @RequestParam("cNo") int cNo) {
		
		csService.deleteCoupon(cNo);
		
		return "redirect:couponManage";
	}
	
	// 관리자 - 쿠폰 수정
	@PostMapping("updateCoupon")
	public String updateCoupon(Model model, Coupon coupon,@RequestParam("start") Date start, @RequestParam("end") Date end) {
		
		Timestamp startDay = new  Timestamp(start.getTime());
		Timestamp endDay = new  Timestamp(end.getTime());
		
		coupon.setRegDate(startDay);
		coupon.setDelDate(endDay);
		
		csService.updateCoupon(coupon);
		
		return "redirect:couponManage";
	}
	
	// 마이페이지 - 쿠폰관리 myCoupon
	@GetMapping("/myCoupon")
	public String myCoupon(Model model, HttpSession session) {
		
		String id = (String) session.getAttribute("loginId");
		
		List<Coupon> couponList = csService.myCoupon(id);
		model.addAttribute("couponList", couponList);
			  
		return "members/myCoupon";	
	}
}
