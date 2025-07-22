package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.projectbob.domain.Member;

@Mapper
public interface LoginMapper {
	
	void joinMember(Member member);
	Member getMember(String id);
	void updateMember(Member member);
	void deleteMember(String id);
	List<String> searchId(@Param("name") String name, @Param("email") String email, @Param("phone") String phone, @Param("receive") String receive);
	String searchPassword(@Param("id") String id, @Param("name") String name, @Param("email") String email, @Param("phone") String phone, @Param("receive") String receive);
	List<Member> userList(@Param("division") String division, @Param("keyword") String keyword );
	void updateIsuse(@Param("id") String id, @Param("isuse") String isuse);
}
