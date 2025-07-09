package com.projectbob.service;

import java.util.List;

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
		int result = -1;  // 아이디가 존재하지 않음
		Member member = logginMapper.getMember(id);
		
		if(member == null) { return result; }
		
		if(pass.equals(member.getPass())) {
			result = 1; // 완벽한 로그인
		}else {
			result = 0; // 비밀번호 불일치
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
	
	
	public List<String> searchId(String name, String email, String phone, String receive){

		List<String> userIds = logginMapper.searchId(name, email, phone, receive);
		
		return userIds;
	}
	
	public String searchPassword(String id, String name, String email, String phone, String receive) {
		
		String pass = logginMapper.searchPassword(id, name, email, phone, receive);
		
		if(pass == null) {pass = "";}
		
		return pass;
	}
}
