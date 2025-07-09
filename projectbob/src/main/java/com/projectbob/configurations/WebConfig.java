package com.projectbob.configurations;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer{
	
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/joinMemberForm").setViewName("members/joinMemberships");
		registry.addViewController("/searchIdPassForm").setViewName("members/searchIdPass");
		registry.addViewController("/shopJoinForm").setViewName("shop/shopJoinForm");
	}
}
