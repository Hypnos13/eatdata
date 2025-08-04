package com.projectbob.configurations;

import java.util.Map;
import java.security.Principal; // 올바른 Principal 클래스 임포트

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer{

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic");
		registry.setApplicationDestinationPrefixes("/app");
		registry.setUserDestinationPrefix("/user");
}
	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
	
		registry.addEndpoint("/ws")
					.setAllowedOriginPatterns("*")
					.addInterceptors(new HttpSessionHandshakeInterceptor()) // Custom Interceptor 추가
					.setHandshakeHandler(new DefaultHandshakeHandler() {
						@Override
						protected Principal determineUser(ServerHttpRequest request,
								WebSocketHandler wsHandler,
								Map<String, Object> attributes) {
														// 							Principal principal = (Principal) attributes.get("userPrincipal"); // Interceptor에서 저장한 Principal 사용 // <-- Remove this line
							Principal principal = (Principal) attributes.get("userPrincipal"); // <-- Add this line
							if(principal != null) {
								System.out.println("WebSocket Handshake: Authenticated user: " +
							principal.getName());
							} else {
								System.out.println("WebSocket Handshake: Uauthenticated user.");
							}
							return principal;
						}
					})
					.withSockJS();
	}
	
	
}
