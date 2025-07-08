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
	

	public int login(String id, String pass) {	
		int result = -1;
		Member member = logginMapper.getMember(id);
		
		if(member == null) { return result; }
		
		if(pass.equals(member.getPass())) {
			result = 1;
		}else {
			result = 0;
		}
		return result;
	}
	
	public Member getMember(String id) {
		Member member = logginMapper.getMember(id);
		return member;
	}
	
	public void updateMember(Member member) {
		logginMapper.updateMember(member);
	}
	
	public void deleteMember(String id, String pass) {
		logginMapper.deleteMember(id);
	}
	
}
