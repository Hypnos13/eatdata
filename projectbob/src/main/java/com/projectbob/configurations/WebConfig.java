package com.projectbob.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer{

	@Value("${file.upload-dir}")
    private String uploadBaseDir;

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/joinMemberForm").setViewName("members/joinMemberships");
		registry.addViewController("/searchIdPassForm").setViewName("members/searchIdPass");
		registry.addViewController("/writeFAQForm").setViewName("admin/writeFAQForm");
		registry.addViewController("/writeNoticeForm").setViewName("admin/writeNoticeForm");
		registry.addViewController("/login/naver/callback").setViewName("members/naverCallback");
		registry.addViewController("/addAddressForm").setViewName("members/addAddressForm");
	}



}
