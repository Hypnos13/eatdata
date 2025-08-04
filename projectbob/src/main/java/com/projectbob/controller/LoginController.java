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
	final DefaultMessageService MESSAGE_SERVICE = NurigoApp.INSTANCE.initialize("NCSAPQWVSQ1DX1ZB", "RQSJXZYQH0YRPL75MUVMM999RLC5L7IP", "https://api.coolsms.co.kr");  //핸드폰 인증시 사용되는 서비스
	
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
		
		int login = loginService.login(id, pass);   // login : -2(관리자에게 사용금지 당함) / -1 (존재하지 않음) / 0 (아이디는 있으나 비밀번호 불일치) / 1 (아이디 비밀번호 일치)
		
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
		
		// 생일 쿠폰 받기
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd"); 
		LocalDate birthday = LocalDate.parse(member.getBirthday(), dateFormatter);
		LocalDate today = LocalDate.now();
		
		if (redirectURL != null && !redirectURL.isEmpty()) {
			return "redirect:" + redirectURL;
		} else if (member.getDivision().equals("owner")) {  // 사장님 아이디로 로그인시
			return "redirect:/shopMain";
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
			return "redirect:/main";
		}
	}
	
	// 회원가입
	@PostMapping("/joinMember")
	public String joinMember(Model model, Member member) {
		
		if(member.getNickname().equals("")) {  // 닉네임을 쓰지 않을 때 이름과 동일하게 함
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
				if(receive.equals("email")) { // 이메일로 받을 시
					try {
						MimeMessage m = javaMailSender.createMimeMessage();  // 메시지 보내는 객체
						MimeMessageHelper h = new MimeMessageHelper(m, "UTF-8"); // 메일 작성시 설정
						h.setFrom(NAVER_EMAIL);   // 발신자
						h.setTo(email);  // 수신자
						h.setSubject("ProjectBOB 비밀번호 찾기 답변 메일입니다.");  // 메일 제목
						h.setText(id + "의 비밀번호는 "+pass+" 입니다."); // 메일 내용
						javaMailSender.send(m);  // 메일 전송
					} catch (MessagingException e) {
						e.printStackTrace();
					}
					out.println("	alert('이메일이 보내졌습니다.');");
				}else if(receive.equals("phone")) {  // 전화로 받을 시
					Message m = new Message();  // 문자 메시지를 보낼 객체 생성
					m.setFrom("01042273840"); // 발신자 
					m.setTo(phone.replace("-", ""));  // 수신자
					m.setText(id + "의 비밀번호는 "+pass+" 입니다.");  // 문자 내용
					
					SingleMessageSentResponse  res =  MESSAGE_SERVICE.sendOne(new SingleMessageSendingRequest(m));  // 단일 문자를 보내는 객체
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
					for(int i = 0 ; i < userIds.size(); i++) {    // 아이디가 여러개가 있을 수 있으므로 모두 가져온다.
						if( i + 1 < userIds.size()) {
							ids += userIds.get(i) + " , ";	
						}else {
							ids += userIds.get(i);					
						}		
					}
					if(receive.equals("email")) {   // 위와 같음
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
		
		if(id.substring(0, 2).equals("N_") || id.substring(0, 2).equals("K_")) {  // 네이버나 카카오로 가입하면 N_ 또는 K_가 붙는다.
			return "members/updateNaverMemberships";
		}
		
		
		return "members/updateMemberships";
	}
	
	
	// 내 정보 수정
	@PostMapping("/updateMember")
	public String updateMember(Model model, Member member, @RequestParam("newPass") String newPass , HttpSession session, HttpServletResponse response) throws ServletException, IOException {
		
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
		
		System.out.println("newPass = " + newPass);
		
		if(!(newPass == null || newPass.equals(""))) {
			member.setPass(newPass);
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
			member.setPass("naver0000");  // 사용할 일 없음
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
		
		RestTemplate rt = new RestTemplate();   // HTTP 통신 객체
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		
		 MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		 params.add("grant_type", "authorization_code");
		 params.add("client_id", "a6ce69b235d3336723f4b86140c8a301");  // 카카오 API
		 params.add("redirect_uri", "http://localhost:8080/kakao");  // 카카오에 등록된 URI
		 params.add("code", code);
		
		 HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(params, headers);
		 ResponseEntity<Map> tokenResponse = rt.postForEntity("https://kauth.kakao.com/oauth/token", tokenRequest, Map.class);
		 
		 String accessToken = (String) tokenResponse.getBody().get("access_token");
		 
		 HttpHeaders profileHeaders = new HttpHeaders();		
		 profileHeaders.setBearerAuth(accessToken);
		 HttpEntity<?> profileRequest = new HttpEntity<>(profileHeaders);
		 
		 ResponseEntity<Map> profileResponse = rt.exchange("https://kapi.kakao.com/v2/user/me", HttpMethod.GET, profileRequest, Map.class);
		 
		 Map<String, Object> kakaoAccount = (Map<String, Object>) profileResponse.getBody().get("kakao_account");
		 String email = (String) kakaoAccount.get("email"); 	// 사용자 이메일
		 
		 Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
		 String nickname = (String) profile.get("nickname");	// 사용자 닉네임
		 
		 String id  = "K_"+email.substring(0, email.indexOf("@"));		// 아이디는 K_ 가 붙고 기존 이메일 아이디로 사용
			
			// DB에 가입되어있는지 확인
			int login = loginService.login(id, "");
			
			if(login == -1) {  // DB에 가입되어 있지 않으면 추가 함 
				
				Member member = new Member();
				member.setId(id);
				member.setPass("Kakao0000");   // 사용할 일 없음
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
		
		String code = (String) session.getAttribute("code") ; // 인증번호 코드
		
		if(code == null) {  // 인증번호 코드가 없다면 생성해서 보낸다
			SecureRandom random = new SecureRandom();
			StringBuilder sb = new StringBuilder();
			
			for(int i = 0 ; i < 6 ; i++) {	sb.append(random.nextInt(10)); }  // 6자리의 인증코드 랜덤으로 생성
			
			code = sb.toString();
			session.setAttribute("code", code);		// 세션에 저장
			
			Message m = new Message();			// 핸드폰 메시지 객체 생성
			m.setFrom("01042273840");			// 발신자
			m.setTo(phone.replace("-", ""));	// 수신자
			m.setText("인증번호는 " +code+" 입니다.");  // 문자 메시지 내용
			
			SingleMessageSentResponse res =  MESSAGE_SERVICE.sendOne(new SingleMessageSendingRequest(m));
			
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
		
		if(code.equals(certifyNumber)) {		// 인증번호와 입력한 번호 확인
			session.removeAttribute("code");  // 일치할 시 인증이 완료되어 번호 제거함
			
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
