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
import com.projectbob.configurations.LoginSuccessHandler; // LoginSuccessHandler 임포트

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	
	private final LoginService loginService; // LoginService 주입을 위한 필드
    private final LoginSuccessHandler loginSuccessHandler; // LoginSuccessHandler 주입을 위한 필드

	// 생성자 주입
	public SecurityConfig(LoginService loginService, LoginSuccessHandler loginSuccessHandler) {
		this.loginService = loginService;
        this.loginSuccessHandler = loginSuccessHandler;
	}
	
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
		http.authorizeHttpRequests(authorize -> authorize
				// 로그인 없이 접근 가능한 경로들 (LoginCheckInterceptor의 guestAllowedUrls 역할)
				.requestMatchers(
					"/main", "/shopList", "/MenuDetail", "/completed", // 고객이 보는 페이지
					"/login", "/joinMember", "/joinMemberForm", "/searchIdPass", "/searchIdPassForm", // 로그인/회원가입/찾기
					"/naverLogin", "/naverJoin", "/updateNaverMember", "/deleteNaverMember", "/kakao", "/login/naver/callback", // 소셜 로그인
					"/phoneCertify", "/certifyNumber", // 휴대폰 인증
					"/ajax/menu/options", "/addCart", "/getCart", "/updateQuantity", "/deleteCart", "/removeAll", // AJAX 요청 (장바구니 등)
					"/ws/**", "/user/**", "/topic/**", "/app/**", // 웹소켓 엔드포인트
					"/css/**", "/js/**", "/images/**", "/bootstrap/**", "/error", "/favicon.ico", "/rider/request" ,"/shopMain" // 정적 리소스 및 에러 페이지
				).permitAll()
				// 사장님만 접근 가능한 경로 (예시)
				.requestMatchers("/shop*", "/menu*").hasRole("OWNER") // "OWNER" 역할만 허용
				// 그 외 모든 요청은 인증된 사용자만 허용
				.anyRequest().authenticated()
				)
		.csrf(csrf -> csrf.disable()) // 개발 편의를 위해 CSRF 비활성화
		.formLogin(form -> form // 폼 로그인 설정
				.loginPage("/login") // 실제 로그인 페이지 url
				.loginProcessingUrl("/loginProc")	// 로그인 처리 url
				// .defaultSuccessUrl("/main", true)	// 로그인 성공 시 리다이렉트될 url
				.failureUrl("/login?error=true")	// 로그인 실패 시 리다이렉트될 url
				.permitAll()	// 로그인 페이지는 모두 접근 가능
				.successHandler(loginSuccessHandler) // <-- 이 라인 추가
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
		// 비밀번호가 평문으로 저장되어 있으므로 NoOpPasswordEncoder를 사용합니다.
		// (경고: 실제 운영 환경에서는 절대로 사용해서는 안 됩니다. 반드시 비밀번호를 암호화해야 합니다.)
		return org.springframework.security.crypto.password.NoOpPasswordEncoder.getInstance();
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

			// 사용자의 division에 따라 역할 부여
			java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
			String division = member.getDivision() != null ? member.getDivision().trim() : ""; // null 체크 및 공백 제거
			
			if ("owner".equalsIgnoreCase(division)) {
				authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_OWNER")); // 사장님에게 ROLE_OWNER 부여
			} else if ("client".equalsIgnoreCase(division)) {
				authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")); // 고객에게 ROLE_USER 부여
			} else if ("master".equalsIgnoreCase(division)) {
				authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MASTER")); // 마스터에게 ROLE_MASTER 부여
			}
			// 다른 division이 있다면 여기에 추가

			org.springframework.security.core.userdetails.User userDetails = 
					new org.springframework.security.core.userdetails.User(
							member.getId(),
							member.getPass(), // NoOpPasswordEncoder를 사용할 때는 {noop} 접두사가 필요 없습니다.
							authorities // <-- 수정된 부분
							);					
			System.out.println("SecurityConfig: UserDetailsService returning User: " + 
							userDetails.getUsername() + " with authorities: " + authorities);			
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
