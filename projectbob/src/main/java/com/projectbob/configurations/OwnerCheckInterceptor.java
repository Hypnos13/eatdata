package com.projectbob.configurations;

import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class OwnerCheckInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        HttpSession session = request.getSession(false);
        
        if (session != null) {
            String division = (String) session.getAttribute("loginDivision");
            log.info("권한 체크 인터셉터 실행, 사용자 구분: {}", division);

            // 사용자의 구분이 'owner' 또는 'master'(관리자)가 맞는지 확인
            if ("owner".equals(division) || "master".equals(division)) {
                return true; // 점주 또는 관리자이면 통과
            }
        }
        
        // 점주가 아니라면
        log.warn("권한 없는 사용자 접근 시도: {}", request.getRequestURI());
        // 알림 메시지와 함께 메인 페이지로 리다이렉트
        response.sendRedirect("/main?error=auth"); 
        return false; // 접근 차단
    }
}