package com.projectbob.configurations;

import com.projectbob.domain.Member;
import com.projectbob.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component // 스프링 빈으로 등록
public class CustomAuthProvider implements AuthenticationProvider {
	
	@Autowired
	private LoginService loginService;

   @Override
   public Authentication authenticate(Authentication authentication) throws AuthenticationException {
	   String id = authentication.getName();
       String password = (String) authentication.getCredentials();

       int login = loginService.login(id, password);
       
       if (login == -1) {
           throw new BadCredentialsException("존재하지 않는 아이디입니다.");
       } else if (login == 0) {
           throw new BadCredentialsException("비밀번호가 일치하지 않습니다.");
       } else if (login == -2) {
           throw new DisabledException("사용이 금지된 아이디입니다.");
       }

       // 정상 로그인 처리
       Member member = loginService.getMember(id);

       return new UsernamePasswordAuthenticationToken( id, password, List.of(new SimpleGrantedAuthority("ROLE_" + member.getDivision())));
   }

	@Override
	public boolean supports(Class<?> authentication) {
		return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
	}
}