package com.projectbob.ajax;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.service.BobService;

import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
public class MenuAjaxController {
	
	@Autowired
	private BobService bobService;
	
	// 메뉴 옵션 목록
	@GetMapping("/ajax/menu/options")
	public List<MenuOption> getMenuOptions(@RequestParam("mId") int mId){
		log.info("MenuAjaxController: getMenuOptions() called, mId={}", mId);
		return bobService.getMenuOptionsByMenuId(mId);
	}
	
	// 리뷰 탭 하트
	@PostMapping("/heart.ajax")
	@ResponseBody
	public Map<String, Object> heart(@RequestParam("sId") int sId){
		int result = bobService.plusHeart(sId);
		Integer heartCount = bobService.getHeartCount(sId);
		Map<String, Object> map = new HashMap<>();
		map.put("success", result > 0);
		map.put("heartCount", heartCount);
		return map;
	}
		
	// 댓글 쓰기 메서드
	@PostMapping("/reviewWrite.ajax")
	@ResponseBody
	public List<Review> addReview(@ModelAttribute Review review,
			@RequestParam(value="reviewUploadFile", required=false) MultipartFile rPicture){
		
		String uploadDir = "C:/projectbob/images/review/";
		File dir = new File(uploadDir);
		if (!dir.exists()) dir.mkdirs();		
		
		if(rPicture != null && !rPicture.isEmpty()) {
			String fileName = UUID.randomUUID() + "_" + rPicture.getOriginalFilename();
			Path savePath = Paths.get(uploadDir, fileName);
			try {
			rPicture.transferTo(savePath.toFile());
			review.setRPicture(fileName);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		
		review.setStatus("일반");
	
		
		bobService.addReview(review);
		return bobService.reviewList(review.getSId());
	}
	
	
	
	
	
	
	
	
	

}
