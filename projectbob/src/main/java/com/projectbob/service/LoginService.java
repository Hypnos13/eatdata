package com.projectbob.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Coupon;
import com.projectbob.domain.Member;
import com.projectbob.mapper.LoginMapper;

@Service
public class LoginService {

	@Autowired
	LoginMapper loginMapper;
	
	// PasswordEncoder - Security 추가할때 할것
	
	
	public void joinMember(Member member) {
		loginMapper.joinMember(member);
	}

	public int login(String id, String pass) {	
		int result = -1;  // 아이디가 존재하지 않음
		Member member = loginMapper.getMember(id);
		
		if(member == null) { return result; }
		
		if(pass.equals(member.getPass())) {
			if(member.getIsuse().equals("N"))
			{
				result = -2; //사용 금지
			}else {
				result = 1; // 완벽한 로그인
			}
		}else {
			result = 0; // 비밀번호 불일치
		}
		return result;
	}
	
	public Member getMember(String id) {
		return loginMapper.getMember(id);
	}
	
	public void updateMember(Member member) {
		loginMapper.updateMember(member);
	}
	
	public void deleteMember(String id, String pass) {
		loginMapper.deleteMember(id);
	}
	
	public List<String> searchId(String name, String email, String phone, String receive){
		return loginMapper.searchId(name, email, phone, receive);
	}
	
	public String searchPassword(String id, String name, String email, String phone, String receive) {
		
		String pass = loginMapper.searchPassword(id, name, email, phone, receive);
		
		if(pass == null) {pass = "";}
		
		return pass;
	}
	
	public List<Member> userList(String division, String keyword){
		return loginMapper.userList(division, keyword);
	}
	
	public void updateIsuse(String id, String isuse){
		loginMapper.updateIsuse(id, isuse);
	}
	
	public List<Member> clientList(){
		return loginMapper.clientList();
	}
	
	public void addBirthdayCoupon(String id){
		loginMapper.addBirthdayCoupon(id);
	}
	
	public int checkbirthdayCoupon(String id){
		int result = -1;  // 쿠폰 없음
		
		Coupon coupon = loginMapper.checkbirthdayCoupon(id);
		
		if(coupon == null) { return result; }
		
		result = 1 ; // 쿠폰 있음
		
		return result;
	}

	public void transferCart(String guestId, String userId) {
		loginMapper.updateCartOwner(guestId, userId);
	}
	
	
}

