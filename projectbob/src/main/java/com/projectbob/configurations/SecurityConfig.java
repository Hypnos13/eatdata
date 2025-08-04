package com.projectbob.configurations;

import java.util.Collections;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.projectbob.service.LoginService; // LoginService 임포트
import com.projectbob.domain.Member; // Member 클래스 임포트

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	
	private final LoginService loginService; // LoginService 주입을 위한 필드
	
	// 생성자 주입
	public SecurityConfig(LoginService loginService) { // BobService 대신 LoginService 주입
		this.loginService = loginService;
	}
	
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
		http.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/ws/**").permitAll()   // 웹소켓 엔드포인트 허용
				.requestMatchers("/user/**", "/topic/**", "/app/**").permitAll()  // STOMP 메시지 목적지 허용
				.anyRequest().permitAll()  // 모든 요청 허용(테스트용 실전용으로 하려면 수정해야함)
				)
		.csrf(csrf -> csrf.disable()) // 개발 편의를 위해 CSRF 비활성화
		.formLogin(form -> form // 폼 로그인 설정
				.loginPage("/login") // 실제 로그인 페이지 url
				.loginProcessingUrl("/loginProc")	// 로그인 처리 url
				.defaultSuccessUrl("/main", true)	// 로그인 성공 시 리다이렉트될 url
				.failureUrl("/login?error=true")	// 로그인 실패 시 리다이렉트될 url
				.permitAll()	// 로그인 페이지는 모두 접근 가능
				)
		.logout(logout -> logout
				.logoutUrl("/logout")	// 로그아웃 처리 url
				.logoutSuccessUrl("/main")	// 로그아웃 성공 시 리다이렉트될 url
				.permitAll()
				)
		.sessionManagement(session -> session
				.sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
				.maximumSessions(1)
				.maxSessionsPreventsLogin(false)
				);
		
		return http.build();
	}
	
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public UserDetailsService userDetailsService() {
		return username -> {
			System.out.println("SecurityConfig: userDetailsService called with username: " + username);
			Member member = loginService.getMember(username); // LoginService를 통해 Member 객체 로드
			if (member == null) {
				System.out.println("SecurityConfig: User not found for username: " + username);
				throw new UsernameNotFoundException("User not found: " + username);
			}
			org.springframework.security.core.userdetails.User userDetails = 
					new org.springframework.security.core.userdetails.User(
							member.getId(),
							// 비밀번호는 DB에 평문으로 저장되어 있다고 가정하고,
							// {noop} 접두사를 사용하여 평문 비밀번호임을 Spring Security에 알립니다.
							"{noop}" + member.getPass(), // {noop} 접두사를 사용하여 평문 비밀번호임을 Spring Security에 알립니다.
							Collections.singletonList(() -> "ROLE_USER") // 기본 역할 부여 (예: ROLE_USER)	
							);					
			System.out.println("SecurityConfig: UserDetailsService returning User: " + 
							userDetails.getUsername());			
			return userDetails; // userDetails 객체를 반환하도록 추가
		};
	}

	@Bean
	public AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
		authenticationProvider.setUserDetailsService(userDetailsService);
		authenticationProvider.setPasswordEncoder(passwordEncoder);
		return new ProviderManager(authenticationProvider);
	}
}
