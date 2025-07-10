package com.projectbob.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

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

	//로그인 폼
	@GetMapping("/login")
	public String loginForm() {
		return "members/login";
	}
	
	// 로그인
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
	
	// 회원가입
	@PostMapping("/joinMember")
	public String joinMember(Model model, Member member) {
		
		if(member.getNickname().equals("")) {
			member.setNickname(member.getName());
		}
		
		loginService.joinMember(member);
		
		return "views/main";
	}
	
	// 아이디, 비밀번호 찾기
	@PostMapping("/searchIdPass")
	public String searchIdPass(Model model,@RequestParam(name = "id", defaultValue = "") String id, @RequestParam(name = "name", defaultValue = "") String name, 
			@RequestParam(name = "phone", defaultValue = "") String phone, @RequestParam(name = "email", defaultValue = "") String email, 
			@RequestParam(name = "search", defaultValue = "")String search, @RequestParam(name = "receive", defaultValue = "") String receive,
			HttpServletResponse response )throws ServletException, IOException{
		
		if(search.equals("true")) {  // 비밀번호 찾기
			
			int check = loginService.login(id, "");
			
			String pass = loginService.searchPassword(id, name, email, phone, receive);
			
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			if(check == -1) {		
				out.println("	alert('아이디가 존재하지 않습니다.');");
			}else if(pass.equals("")){
				out.println("	alert('입력한 정보가 잘못되었습니다.');");
			}else {
				out.println("	alert('비밀번호는 "+pass+" 입니다.');");
			}
			out.println("	history.back();");
			out.println("</script>");
			return null;
			
		}else {  // 아이디 찾기
			
			List<String> userIds = loginService.searchId(name, email, phone, receive);
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			if(userIds.isEmpty() || userIds == null) {
				out.println("	alert('아이디가 존재하지 않습니다.');");
			}else {
				out.print(" alert('아이디 : ");
				for(String ids : userIds) {
					out.print(ids + " ");
				}
				out.print("'); ");
			}
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}
	}
	
	// 아이디, 비밀번호 찾기 폼
	@GetMapping("/searchIdPassForm")
	public String searchIdPassForm(Model model, @RequestParam("search") String search) {
		
		boolean searchPass = false;
		
		if(search.equals("pass")) { searchPass = true;}
		
		model.addAttribute("searchPass", searchPass);
		
		return "members/searchIdPass";
	}
	
	
	// 내 정보 수정 폼
	@GetMapping("/myProfile")
	public String myProfile(Model model, HttpSession session) {
		
		String id = (String) session.getAttribute("loginId");
		
		model.addAttribute("Member", loginService.getMember(id));
		
		return "members/updateMemberships";
	}
	
	
	// 내 정보 수정
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
	
	// 로그아웃
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		session.invalidate();
		return "members/login";
	}
	
	// 회원 탈퇴
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
