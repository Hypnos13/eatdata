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
		
		// ─── 불러올 업로드 디렉터리 (외부 경로) ───
        // /images/shop/**           → {uploadBaseDir}/shop/
        // /images/business-licenses/** → {uploadBaseDir}/business-licenses/
        String base = "file:///" + uploadBaseDir.replace("\\", "/") + "/";
        registry.addResourceHandler("/images/shop/**")
                .addResourceLocations(base + "shop/");
        registry.addResourceHandler("/images/business-licenses/**")
                .addResourceLocations(base + "business-licenses/");
	}

}
