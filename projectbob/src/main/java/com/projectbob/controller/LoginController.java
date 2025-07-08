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
import lombok.RequiredArgsConstructor;

@Controller
public class LoginController {

    private final BobController bobContoller;
	
	@Autowired
	LoginService loginService;

    LoginController(BobController bobContoller) {
        this.bobContoller = bobContoller;
    }

	@GetMapping("/login")
	public String loginForm() {
		return "members/login";
	}
	
	@PostMapping("/login")
	public String login(Model model, @RequestParam("id") String id, @RequestParam("pass") String pass, HttpSession session,
			HttpServletResponse response )throws ServletException, IOException {
		
		int login = loginService.login(id, pass);
		
		System.out.println("로그인 중 --- "+ login);
		
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
	
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		
		session.invalidate();
		
		return "members/login";
	}
	
}
