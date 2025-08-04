package com.projectbob.configurations;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.security.core.context.SecurityContext; // SecurityContext 임포트
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication; // Authentication 임포트

import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.security.Principal;

@Component
public class UserHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpSession session = servletRequest.getServletRequest().getSession(false);

            if (session != null) {
                // HTTP 세션에서 SecurityContext를 가져옵니다.
                SecurityContext securityContext = (SecurityContext) session.getAttribute("SPRING_SECURITY_CONTEXT");

                if (securityContext != null && securityContext.getAuthentication() != null) {
                    Authentication authentication = securityContext.getAuthentication();
                    Principal principal = authentication; // Authentication 객체는 Principal을 구현합니다。
                    attributes.put("userPrincipal", principal); // 웹소켓 세션 속성에 인증된 Principal 저장
                    System.out.println("UserHandshakeInterceptor: Principal from HTTP session (SecurityContext): " + principal.getName());
                } else {
                    System.out.println("UserHandshakeInterceptor: No authenticated user in HTTP session's SecurityContext.");
                    // SecurityContext가 없거나 비어있을 경우, request.getPrincipal()을 폴백으로 사용
                    Principal principal = request.getPrincipal();
                    if (principal != null) {
                        attributes.put("userPrincipal", principal);
                        System.out.println("UserHandshakeInterceptor: Principal from HTTP request (fallback): " + principal.getName());
                    } else {
                        System.out.println("UserHandshakeInterceptor: No Principal found in HTTP request either.");
                    }
                }
            } else {
                System.out.println("UserHandshakeInterceptor: No HTTP session found.");
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                 WebSocketHandler wsHandler, Exception exception) {
        // 핸드셰이크 후 추가 작업이 필요하면 여기에 구현
    }
}
