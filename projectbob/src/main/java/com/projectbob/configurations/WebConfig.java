package com.projectbob.configurations;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer{
	
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/joinMemberForm").setViewName("members/joinMemberships");
		registry.addViewController("/searchIdPassForm").setViewName("members/searchIdPass");
		registry.addViewController("/writeFAQForm").setViewName("admin/writeFAQForm");
		registry.addViewController("/writeNoticeForm").setViewName("admin/writeNoticeForm");
		registry.addViewController("/login/naver/callback").setViewName("members/naverCallback");
		registry.addViewController("/addAddressForm").setViewName("members/addAddressForm");
	}
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LoginCheckInterceptor())
				.order(1).addPathPatterns("/shop*", "/menu*")
				.excludePathPatterns("/shopMain");
	}
	
	//리뷰 사진 추가
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/images/review/**")
			.addResourceLocations("file:///C:/projectbob/images/review/");
	}

}
