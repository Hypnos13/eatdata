package com.projectbob.configurations;

import com.projectbob.domain.Member;
import com.projectbob.service.LoginService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component // 스프링 빈으로 등록
public class LoginSuccessHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

    private final LoginService loginService;

    @Autowired
    public LoginSuccessHandler(LoginService loginService) {
        this.loginService = loginService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
    	
    	String id = (String)request.getParameter("username");
    	String pass = (String)request.getParameter("password");
    	String redirectURL = (String)request.getParameter("redirectURL");
    	HttpSession session = request.getSession();

    	int login = loginService.login(id, pass);   // login : -2(관리자에게 사용금지 당함) / -1 (존재하지 않음) / 0 (아이디는 있으나 비밀번호 불일치) / 1 (아이디 비밀번호 일치)
    	
		Member member = loginService.getMember(id);
		
		// 비회원 장바구니를 회원 장바구니로 이전
        String guestId = (String) session.getAttribute("guestId");
        if (guestId != null) {
            loginService.transferCart(guestId, id);
        }
		
		session.setAttribute("isLogin", true);
		session.setAttribute("loginId", id);
		session.setAttribute("loginNickname", member.getNickname());
		session.setAttribute("loginDivision", member.getDivision());
		session.removeAttribute("guestId");
		
		// 생일 쿠폰 받기
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd"); 
		LocalDate birthday = LocalDate.parse(member.getBirthday(), dateFormatter);
		LocalDate today = LocalDate.now();
		
		if (redirectURL != null && !redirectURL.isEmpty()) {
			response.sendRedirect(redirectURL);
		} else if (member.getDivision().equals("owner")) {  // 사장님 아이디로 로그인시
			response.sendRedirect("/shopMain");
		} else { 
			if (member.getDivision().equals("client")) {  // 고객 로그인 시
				if((birthday.getMonth() == today.getMonth()) && (birthday.getDayOfMonth() == today.getDayOfMonth())) {  // 생일 당일날 로그인 했으면 생일 쿠폰이 발급되게 함
					if(loginService.checkbirthdayCoupon(id) == -1) {
						System.out.println("생일 쿠폰 없음");
						loginService.addBirthdayCoupon(id);
					}else{
						System.out.println("생일 쿠폰 이미받음");
					}
				}
			}
			response.sendRedirect("/main");
		}
    }
    
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
    	
    	String id = (String)request.getParameter("username");
    	String pass = (String)request.getParameter("password");
    	String redirectURL = (String)request.getParameter("redirectURL");

    	int login = loginService.login(id, pass);   // login : -2(관리자에게 사용금지 당함) / -1 (존재하지 않음) / 0 (아이디는 있으나 비밀번호 불일치) / 1 (아이디 비밀번호 일치)
    	
    	response.setContentType("text/html; charset=utf-8");
    	PrintWriter out = response.getWriter();
    	String message = "";
    	
		if(login == -1) {	
			message = "존재하지 않는 아이디 입니다.";	
		}else if(login == 0){
			message = "비밀번호가 일치하지 않습니다.";	
		}else if(login == -2) {
			message = "로그인이 금지된 아이디 입니다.";
		}

		out.println("<script>");
		out.println("	alert('"+message+"');");
		out.println("	history.back();");
		out.println("</script>");
		
    }
}