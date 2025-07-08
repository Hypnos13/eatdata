package com.projectbob.controller;

import java.io.IOException;
import java.io.PrintWriter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.projectbob.domain.Member;
import com.projectbob.service.LoginService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public class LoginController {
	
	@Autowired
	LoginService loginService;


	@GetMapping("/login")
	public String loginForm() {
		return "members/login";
	}
	
	
	@PostMapping("/login")
	public String login(Model model, @RequestParam("id") String id, @RequestParam("pass") String pass, HttpSession session,
			HttpServletResponse response )throws ServletException, IOException {
		
		int login = loginService.login(id, pass);
		
		if(login == -1) {
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			out.println("	alert('존재하지 않는 아이디 입니다.');");
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}else if(login == 0){
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			out.println("	alert('비밀번호가 일치하지 않습니다.');");
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}
		
		Member member = loginService.getMember(id);
		
		session.setAttribute("isLogin", true);
		session.setAttribute("loginId", id);
		session.setAttribute("loginNickname", member.getNickname());
		session.setAttribute("loginDisivion", member.getDisivion());
		
		return "redirect:/main";
	}
	
	
	@PostMapping("/joinMember")
	public String joinMember(Model model, Member member) {
		
		if(member.getNickname().equals("")) {
			member.setNickname(member.getName());
		}
		
		loginService.joinMember(member);
		
		return "views/main";
	}
	
	
	@PostMapping("/searchIdPass")
	public String searchIdPass() {
		return "members/login";
	}
	
	@GetMapping("/searchIdPassForm")
	public String searchIdPassForm(Model model, @RequestParam("search") String search) {
		
		boolean searchPass = false;
		
		if(search.equals("pass")) { searchPass = true;}
		
		model.addAttribute("searchPass", searchPass);
		
		return "members/searchIdPass";
	}
	
	
	@GetMapping("/myProfile")
	public String myProfile(Model model, HttpSession session) {
		
		String id = (String) session.getAttribute("loginId");
		
		model.addAttribute("Member", loginService.getMember(id));
		
		return "members/updateMemberships";
	}
	
	
	@PostMapping("/updateMember")
	public String updateMember(Model model, Member member, HttpSession session, HttpServletResponse response) throws ServletException, IOException {
		
		int login = loginService.login(member.getId(), member.getPass());	
		
		if(login == 0){
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			out.println("	alert('비밀번호가 일치하지 않습니다.');");
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}
		
		loginService.updateMember(member);
		session.setAttribute("loginNickname", member.getNickname());
		
		return "views/main";
	}
	
	
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		session.invalidate();
		return "members/login";
	}
	
	
	@PostMapping("/deleteMember")
	public String deleteMember( @RequestParam("userId") String id, @RequestParam("userPass") String pass, HttpSession session, 
			HttpServletResponse response) throws ServletException, IOException {
		
		int login = loginService.login(id, pass);	
		
		if(login == 0){
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			out.println("	alert('비밀번호가 일치하지 않습니다.');");
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}
		
		loginService.deleteMember(id, pass);
		
		session.invalidate();
		
		return "members/login";
	}
	
}
