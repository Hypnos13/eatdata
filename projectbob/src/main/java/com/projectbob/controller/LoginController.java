package com.projectbob.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.security.SecureRandom;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;

import com.projectbob.domain.Member;
import com.projectbob.service.LoginService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;

@Controller
public class LoginController {
	
	@Autowired
	LoginService loginService;	
	@Autowired
	private JavaMailSender javaMailSender;
	@Value("${spring.mail.username}")
	String NAVER_EMAIL;
	final DefaultMessageService MESSAGE_SERVICE = NurigoApp.INSTANCE.initialize("NCSAPQWVSQ1DX1ZB", "RQSJXZYQH0YRPL75MUVMM999RLC5L7IP", "https://api.coolsms.co.kr");
	
	//로그인 폼
	@GetMapping("/login")
	public String loginForm(Model model, @RequestParam(name ="from", defaultValue = "client") String from) {
		
		model.addAttribute("from", from);
		
		return "members/login";
	}
	
	// 로그인
	@PostMapping("/login")
	public String login(Model model, @RequestParam("id") String id, @RequestParam("pass") String pass, HttpSession session,
			HttpServletResponse response, @RequestParam(name = "redirectURL", required = false) String redirectURL )throws ServletException, IOException {
		
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
		}else if(login == -2){
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			out.println("<script>");
			out.println("	alert('사용이 금지된 아이디입니다.');");
			out.println("	history.back();");
			out.println("</script>");
			return null;
		}
		
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
		
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
		LocalDate birthday = LocalDate.parse(member.getBirthday(), dateFormatter);
		LocalDate today = LocalDate.now();
		
				if (redirectURL != null && !redirectURL.isEmpty()) {
			return "redirect:" + redirectURL;
		} else if (member.getDivision().equals("owner")) {
			return "redirect:/shopMain";
		} else { // This covers client and any other division not explicitly handled
			if (member.getDivision().equals("client")) { // Keep client-specific logic
				if((birthday.getMonth() == today.getMonth()) && (birthday.getDayOfMonth() == today.getDayOfMonth())) {
					if(loginService.checkbirthdayCoupon(id) == -1) {
						System.out.println("생일 쿠폰 없음");
						loginService.addBirthdayCoupon(id);
					}else{
						System.out.println("생일 쿠폰 이미받음");
					}
				}
			}
			return "redirect:/main"; // Default redirect for clients and others
		}
	}
	
	// 회원가입
	@PostMapping("/joinMember")
	public String joinMember(Model model, Member member) {
		
		if(member.getNickname().equals("")) {
			member.setNickname(member.getName());
		}
		
		loginService.joinMember(member);
		
		return "members/login";
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
				if(receive.equals("email")) {
					try {
						MimeMessage m = javaMailSender.createMimeMessage();
						MimeMessageHelper h = new MimeMessageHelper(m, "UTF-8");
						h.setFrom(NAVER_EMAIL);
						h.setTo(email);
						h.setSubject("ProjectBOB 비밀번호 찾기 답변 메일입니다.");
						h.setText(id + "의 비밀번호는 "+pass+" 입니다.");
						javaMailSender.send(m);
					} catch (MessagingException e) {
						e.printStackTrace();
					}
					out.println("	alert('이메일이 보내졌습니다.');");
				}else if(receive.equals("phone")) {
					Message m = new Message();
					m.setFrom("01042273840");
					m.setTo(phone.replace("-", ""));
					m.setText(id + "의 비밀번호는 "+pass+" 입니다.");
					
					SingleMessageSentResponse  res =  MESSAGE_SERVICE.sendOne(new SingleMessageSendingRequest(m));
					out.println("	alert('문자가 전송되었습니다.');");
				}	
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
				try {
					String ids="";
					for(int i = 0 ; i < userIds.size(); i++) {
						if( i + 1 < userIds.size()) {
							ids += userIds.get(i) + " , ";	
						}else {
							ids += userIds.get(i);					
						}		
					}
					if(receive.equals("email")) {
						MimeMessage m = javaMailSender.createMimeMessage();
						MimeMessageHelper h = new MimeMessageHelper(m, "UTF-8");
						h.setFrom(NAVER_EMAIL);
						h.setTo(email);
						h.setSubject("ProjectBOB 아이디 찾기 답변 메일입니다.");
						h.setText( "아이디는 "+ids+" 입니다.");
						javaMailSender.send(m);
						out.println("	alert('이메일이 보내졌습니다.');");
					}else if(receive.equals("phone")) {
						Message m = new Message();
						m.setFrom("01042273840");
						m.setTo(phone.replace("-", ""));
						m.setText("아이디는 "+ids+" 입니다.");
						
						SingleMessageSentResponse  res =  MESSAGE_SERVICE.sendOne(new SingleMessageSendingRequest(m));
						out.println("	alert('문자가 전송되었습니다.');");
					}	
					
				} catch (MessagingException e) {
					e.printStackTrace();
				}
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
		
		if(id.substring(0, 2).equals("N_") || id.substring(0, 2).equals("K_")) {
			return "members/updateNaverMemberships";
		}
		
		
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
		
		if(session.getAttribute("loginDivision").equals("owner")) {
			return "redirect:/shopMain";
		}
		
		return "redirect:/main";
	}
	
	// 로그아웃
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		String path = "";
		if(session.getAttribute("loginDivision").equals("owner")) {
			path = "redirect:/shopMain";
		}else {
			path = "redirect:/main";
		}
		session.invalidate();
		return path;
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
	
	// 관리자권한 - 사용자관리
	@GetMapping("/userList")
	public String userList(Model model, @RequestParam(name = "division", defaultValue = "") String division, @RequestParam(name="keyword", defaultValue = "") String keyword) {
		
		List<Member> userList = loginService.userList(division, keyword);
		model.addAttribute("userList", userList);
		if(division != "") {
			model.addAttribute("division", division);
		}
		
		return "admin/userList";
	}
	
	// 관리자권한 - 사용자사용권한변경
	@GetMapping("/updateIsuse")
	public String updateIsuse(Model model, @RequestParam("id") String id, @RequestParam("isuse") String isuse, HttpSession session, HttpServletResponse response)
			throws ServletException, IOException{
		
		String loginDivision = (String) session.getAttribute("loginDivision");
		
		if(loginDivision.equals("master")) {
			loginService.updateIsuse(id, isuse);
		}
		
		response.setContentType("text/html; charset=utf-8");
		PrintWriter out = response.getWriter();
		out.println("<script>");
		out.println("	alert('저장이 완료되었습니다.');");
		out.println("	location.href='/userList';");
		out.println("</script>");
		
		return null;
	}
	
	// 네이버 로그인 시
	@GetMapping("/naverLogin")
	public String naverLogin(Model model,@RequestParam("name") String name, @RequestParam("nickname")String nickname, @RequestParam("email") String email, HttpSession session){
		
		String id  = "N_"+email.substring(0, email.indexOf("@"));
		
		// DB에 가입되어있는지 확인
		int login = loginService.login(id, "");
		
		if(login == -1) {  // 없으면 추가 
			
			Member member = new Member();
			member.setId(id);
			member.setPass("naver0000");
			member.setName(name);
			member.setNickname(nickname);
			member.setEmail(email);
			member.setBirthday("");
			member.setAddress1("");
			member.setAddress2("");
			member.setPhone("");
			member.setDivision("client");
			
			model.addAttribute("Member", member);
			
			return "members/joinNaverMembership";
			
		}
			
			Member member = loginService.getMember(id);
			
			session.setAttribute("isLogin", true);
			session.setAttribute("loginId", id);
			session.setAttribute("loginNickname", member.getNickname());
			session.setAttribute("loginDivision", member.getDivision());
		
		
		return "redirect:/main";
	}
	
	
	//처음 네이버 로그인시
	@PostMapping("/naverJoin")
	public String naverLogin(Model model, Member member, HttpSession session){
		
		member.setDivision("client");
		
		loginService.joinMember(member);
		
		member = loginService.getMember(member.getId());
		
		session.setAttribute("isLogin", true);
		session.setAttribute("loginId", member.getId());
		session.setAttribute("loginNickname", member.getNickname());
		session.setAttribute("loginDivision", member.getDivision());
		
		return "redirect:/main";
	}
	
	//네이버 로그인 시 수정
	@PostMapping("/updateNaverMember")
	public String updateNaverMember(Model model, Member member, HttpSession session){
		
		member.setPass("0");
		
		loginService.updateMember(member);
		session.setAttribute("loginNickname", member.getNickname());
		
		return "redirect:/main";
	}
	
	
	// 네이버 아이디 회원 탈퇴
	@PostMapping("/deleteNaverMember")
	public String deleteNaverMember( @RequestParam("userId") String id, HttpSession session) {
		
		String pass = "0";
		
		loginService.deleteMember(id, pass);
		
		session.invalidate();
			
		return "members/login";
	}
	
	// 카카오 아이디 연동
	@GetMapping("/kakao")
	public String kakaoLogin(Model model, @RequestParam("code") String code, HttpSession session) {
		
		RestTemplate rt = new RestTemplate();
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		
		 MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		 params.add("grant_type", "authorization_code");
		 params.add("client_id", "a6ce69b235d3336723f4b86140c8a301");
		 params.add("redirect_uri", "http://localhost:8080/kakao");
		 params.add("code", code);
		
		 HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(params, headers);
		 ResponseEntity<Map> tokenResponse = rt.postForEntity("https://kauth.kakao.com/oauth/token", tokenRequest, Map.class);
		 
		 String accessToken = (String) tokenResponse.getBody().get("access_token");
		 
		 HttpHeaders profileHeaders = new HttpHeaders();
		 profileHeaders.setBearerAuth(accessToken);
		 HttpEntity<?> profileRequest = new HttpEntity<>(profileHeaders);
		 
		 ResponseEntity<Map> profileResponse = rt.exchange("https://kapi.kakao.com/v2/user/me", HttpMethod.GET, profileRequest, Map.class);
		 
		 Map<String, Object> kakaoAccount = (Map<String, Object>) profileResponse.getBody().get("kakao_account");
		 String email = (String) kakaoAccount.get("email");
		 
		 Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
		 String nickname = (String) profile.get("nickname");
		 
		 System.out.println("이메일: " + email);
		 System.out.println("별명: " + nickname);
		 
		 String id  = "K_"+email.substring(0, email.indexOf("@"));
			
			// DB에 가입되어있는지 확인
			int login = loginService.login(id, "");
			
			if(login == -1) {  // 없으면 추가 
				
				Member member = new Member();
				member.setId(id);
				member.setPass("Kakao0000");
				member.setName(nickname);
				member.setNickname(nickname);
				member.setEmail(email);
				member.setBirthday("");
				member.setAddress1("");
				member.setAddress2("");
				member.setPhone("");
				member.setDivision("client");
				
				model.addAttribute("Member", member);
				
				return "members/joinNaverMembership";
				
			}
				
				Member member = loginService.getMember(id);
				
				session.setAttribute("isLogin", true);
				session.setAttribute("loginId", id);
				session.setAttribute("loginNickname", member.getNickname());
				session.setAttribute("loginDivision", member.getDivision());
			
			
		  return "redirect:/main";
	}
	
	// 인증번호 창 띄우기
	@GetMapping("/phoneCertify")
	public String phoneCertifyPop(Model model, @RequestParam("phone") String phone, HttpSession session, HttpServletResponse response) throws ServletException, IOException{
		
		
		String code = (String) session.getAttribute("code") ;
		
		if(code == null) {
			SecureRandom random = new SecureRandom();
			StringBuilder sb = new StringBuilder();
			
			for(int i = 0 ; i < 6 ; i++) {	sb.append(random.nextInt(10)); }
			
			code = sb.toString();
			session.setAttribute("code", code);
			
		/*
			Message m = new Message();
			m.setFrom("01042273840");
			m.setTo(phone.replace("-", ""));
			m.setText("인증번호는 " +code+" 입니다.");
			
			SingleMessageSentResponse res =  MESSAGE_SERVICE.sendOne(new SingleMessageSendingRequest(m));
			
		*/
			
			response.setContentType("text/html; charset=utf-8");
			PrintWriter out = response.getWriter();
			
			out.print("<script>");
			out.print(" alert('인증번호가 전송 되었습니다.');");
			out.print("</script>");
			
		}
			System.out.println("코드 : " + code);
		
			model.addAttribute("phone", phone);	
		
		return "members/phoneCertify";
	}
	
	// 인증번호 확인
	@PostMapping("/certifyNumber")
	public String certifyNumber(@RequestParam("certifyNumber") String certifyNumber, @RequestParam("phone") String phone, HttpSession session , HttpServletResponse response)
			throws ServletException, IOException{
		
		String code = (String) session.getAttribute("code");
		
		response.setContentType("text/html; charset=utf-8");
		PrintWriter out = response.getWriter();
		
		if(code.equals(certifyNumber)) {
			session.removeAttribute("code");
			
			out.print("<script>");
			out.print(" alert('인증이 완료되었습니다.');");
			out.print("let btn = window.opener.document.getElementById(\"btn-phoneCertify\");");
			out.print("btn.disabled = true;");
			out.print("btn.value = '인증완료';");
			out.print("btn.style.backgroundColor = '#94a3b8';");
			out.print("btn.style.color = '#ffffff';");
			out.print("window.opener.document.getElementById(\"phone\").readOnly = true;");
			out.print("window.close();");
			out.print("</script>");
		}else {
			out.print("<script>");
			out.print(" alert('인증번호가 일치하지 않습니다');");
			out.print(" history.back();");
			out.print("</script>");
		}
		
		return null;	
	}
	
}
