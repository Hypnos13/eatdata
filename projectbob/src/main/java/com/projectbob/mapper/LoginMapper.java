package com.projectbob.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.Member;

@Mapper
public interface LoginMapper {
	
	void joinMember(Member member);
	Member getMember(String id);

}
