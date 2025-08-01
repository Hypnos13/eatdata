package com.projectbob.configurations;

import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LoginCheckInterceptor implements HandlerInterceptor {
	
	@Override
	public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, 
					Object handler) throws Exception {
		String requestURI = req.getRequestURI();
		log.info("인증 체크 인터셉터 실행: {}", requestURI);

		// 비회원도 접근 가능한 URL 목록
		String[] guestAllowedUrls = {
			"/", "/main", "/shopList", "/MenuDetail",
			"/login", "/joinMember", "/searchIdPass", "/searchIdPassForm",
			"/naverLogin", "/naverJoin", "/updateNaverMember", "/deleteNaverMember", "/kakao",
			"/phoneCertify", "/certifyNumber",
			"/ajax/menu/options", "/addCart", "/getCart", "/updateQuantity", "/deleteCart", "/removeAll"
		};

		// 비회원 허용 URL인지 확인
		for (String allowedUrl : guestAllowedUrls) {
			if (requestURI.startsWith(allowedUrl)) {
				return true; // 허용된 URL이므로 로그인 체크 없이 통과
			}
		}

		// 로그인 체크가 필요한 URL인 경우
		HttpSession session = req.getSession(false); // 세션이 없으면 null 반환
		// 세션에 loginId 가 없으면 (미인증 사용자)
		if (session == null || session.getAttribute("loginId") == null) {
			log.info("미인증 사용자 요청: {}", requestURI);
			// 로그인 페이지로 리다이렉트
			resp.sendRedirect("/login?redirectURL=" + requestURI);
			return false;
		}

		// 로그인 상태이며, 허용된 URL이 아닌 경우 (로그인 필요 URL)
		return true;
	}
}
