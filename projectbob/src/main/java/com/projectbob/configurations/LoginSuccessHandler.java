package com.projectbob.configurations;

import com.projectbob.domain.Member;
import com.projectbob.service.LoginService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component // 스프링 빈으로 등록
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final LoginService loginService;

    @Autowired
    public LoginSuccessHandler(LoginService loginService) {
        this.loginService = loginService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // Spring Security가 인증한 사용자 정보 (Principal)
        String username = authentication.getName(); // 로그인 ID

        // LoginService를 통해 Member 객체 로드
        Member member = loginService.getMember(username);

        // 1. 비회원 장바구니를 회원 장바구니로 이전
        HttpSession session = request.getSession();
        String guestId = (String) session.getAttribute("guestId");
        if (guestId != null) {
            loginService.transferCart(guestId, username);
            session.removeAttribute("guestId"); // 이전 후 게스트 ID 제거
        }

        // 2. 세션 속성 설정 (Spring Security가 기본적으로 Principal을 세션에 넣지만, 커스텀 속성 추가)
        session.setAttribute("isLogin", true);
        session.setAttribute("loginId", username);
        session.setAttribute("loginNickname", member.getNickname());
        session.setAttribute("loginDivision", member.getDivision());

        // 3. 생일 쿠폰 지급 로직
        if (member.getDivision().equals("client")) {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
            LocalDate birthday = LocalDate.parse(member.getBirthday(), dateFormatter);
            LocalDate today = LocalDate.now();

            if ((birthday.getMonth() == today.getMonth()) && (birthday.getDayOfMonth() == today.getDayOfMonth())) {
                if (loginService.checkbirthdayCoupon(username) == -1) {
                    System.out.println("생일 쿠폰 없음 -> 지급");
                    loginService.addBirthdayCoupon(username);
                } else {
                    System.out.println("생일 쿠폰 이미 받음");
                }
            }
        }

        // 4. 조건부 리다이렉트
        String redirectURL = request.getParameter("redirectURL"); // 로그인 폼에서 넘어온 redirectURL 파라미터
        if (redirectURL != null && !redirectURL.isEmpty()) {
            response.sendRedirect(redirectURL);
        } else if (member.getDivision().equals("owner")) {
            response.sendRedirect("/shopMain");
        } else { // client 및 기타
            response.sendRedirect("/main");
        }
    }
}