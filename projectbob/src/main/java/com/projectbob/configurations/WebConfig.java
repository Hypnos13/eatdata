package com.projectbob.configurations;


import org.springframework.context.annotation.Configuration;
<<<<<<< HEAD
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
=======
import org.springframework.web.servlet.config.annotation.*;
>>>>>>> develop
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer{
	
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/joinMemberForm").setViewName("members/joinMemberships");
		registry.addViewController("/searchIdPassForm").setViewName("members/searchIdPass");
		registry.addViewController("/writeFAQForm").setViewName("admin/writeFAQForm");
		registry.addViewController("/writeNoticeForm").setViewName("admin/writeNoticeForm");
		registry.addViewController("/shopJoinForm").setViewName("shop/shopJoinForm");
		registry.addViewController("/login/naver/callback").setViewName("members/naverCallback");
		
	}
	
<<<<<<< HEAD
	//리뷰 사진 추가
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/images/review/**")
			.addResourceLocations("file:///C:/projectbob/images/review/");
	}
=======
>>>>>>> develop
}
