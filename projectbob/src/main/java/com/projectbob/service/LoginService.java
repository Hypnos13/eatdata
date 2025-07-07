package com.projectbob.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Member;
import com.projectbob.mapper.LoginMapper;

@Service
public class LoginService {

	@Autowired
	LoginMapper logginMapper;
	
	// PasswordEncoder - Security 추가할때 할것
	
	public void joinMember(Member member) {
		logginMapper.joinMember(member);
	}
	
	
}
