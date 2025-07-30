package com.projectbob.configurations;

import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LoginCheckInterceptor implements HandlerInterceptor {
	
	@Override
	public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, 
					Object handler) throws Exception {
		String reqURI = req.getRequestURI();
		log.info("인증 체크 인터셉터 실행{}", reqURI);
		HttpSession session = req.getSession(false); // 세션이 없으면 null 반환
		// 세션에 loginId 가 없으면
		if(session == null || session.getAttribute("loginId") == null) {
			log.info("미인증 사용자 요청");
			// 로그인 상태가 아닐 시
			resp.sendRedirect("/login?redirectURL="+reqURI);
			return false;
		}
		// 로그인 상태 시
		return true;
	}
}
