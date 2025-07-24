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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.projectbob.domain.LikeList;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;
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
	
	// 찜 버튼
	@PostMapping("/like.ajax")
	public Map<String, Object> toggleLike(@RequestBody LikeList likeList){		
		return bobService.toggleLike(likeList);
				
	}
		
	// 댓글 쓰기 메서드
	@PostMapping("/reviewWrite.ajax")
	@ResponseBody
	public Map<String, Object> addReview(@ModelAttribute Review review,
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
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", bobService.getReviewList(review.getSId()));
		result.put("reviewReplyMap", bobService.getReviewReplyMap(review.getSId()));
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(review.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		result.put("shopOwnerId", shopOwnerId);
				
		//return bobService.getReviewList(review.getSId());
		return result;
	}
	
	//댓글 수정 메서드
	@PatchMapping("/reviewUpdate.ajax")
	@ResponseBody
	public Map<String, Object> updateReview(@ModelAttribute Review review,
			@RequestParam(value="reviewUploadFile", required=false) MultipartFile rPicture){
		
		if(rPicture != null && !rPicture.isEmpty()) {
			String uploadDir = "C:/projectbob/images/review/";
			File dir = new File(uploadDir);
			if (!dir.exists()) dir.mkdirs();
			
			String fileName = UUID.randomUUID() + "_" + rPicture.getOriginalFilename();
			Path savePath = Paths.get(uploadDir, fileName);
			try {
				rPicture.transferTo(savePath.toFile());
				review.setRPicture(fileName);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		
		bobService.updateReview(review);
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", bobService.getReviewList(review.getSId()));
		result.put("reviewReplyMap", bobService.getReviewReplyMap(review.getSId()));
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(review.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		result.put("shopOwnerId", shopOwnerId);
		
		//return bobService.getReviewList(review.getSId());
		return result;		
	}
	
	// 댓글 삭제 메서드
	@DeleteMapping("/reviewDelete.ajax")
	public Map<String, Object> deleteReview(@RequestParam("rNo") int rNo,
			@RequestParam("sId")int sId){
		bobService.deleteReview(rNo);
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", bobService.getReviewList(sId));
		result.put("reviewReplyMap", bobService.getReviewReplyMap(sId));
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(sId);
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		result.put("shopOwnerId", shopOwnerId);
		
		//return bobService.getReviewList(sId);
		return result;
	}
	
	
	// 대댓글 쓰기 메서드	
	@PostMapping("/reviewReplyWrite.ajax")
	@ResponseBody
	public Map<String, Object> addReviewReply(@RequestBody ReviewReply reviewreply){
		log.info("대댓글 등록 rNo: {}", reviewreply.getRNo());		
		log.info("대댓글 등록 reviewreply: {}", reviewreply);
		log.info("addReviewReply: reviewreply={}", reviewreply);
		log.info("addReviewReply: rNo={}, sId={}, id={}", reviewreply.getRNo(), reviewreply.getSId(), reviewreply.getId());
		reviewreply.setStatus("일반");
		bobService.addReviewReply(reviewreply);
				List<Review> reviewList = bobService.getReviewList(reviewreply.getSId());
		Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(reviewreply.getSId());
		
		// --- 추가할 로그 시작 ---
		log.info("MenuAjaxController: reviewList sId check:");
		for (Review r : reviewList) {
		    log.info("  Review rNo: {}, sId: {}", r.getRNo(), r.getSId());
		}
		// --- 추가할 로그 끝 ---

		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(reviewreply.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", reviewList);
		result.put("reviewReplyMap", reviewReplyMap);
		result.put("shopOwnerId", shopOwnerId);
		return result;
	}
	
	// 대댓글 수정 메서드
	@PatchMapping("/reviewReplyUpdate.ajax")
	@ResponseBody
	public Map<String, Object> updateReviewReply(@RequestBody ReviewReply reviewreply){
		bobService.updateReviewReply(reviewreply);
		
		List<Review> reviewList = bobService.getReviewList(reviewreply.getSId());
		Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(reviewreply.getSId());
		
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(reviewreply.getSId());
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", reviewList);
		result.put("reviewReplyMap", reviewReplyMap);
		result.put("shopOwnerId", shopOwnerId);
		return result;
	}
	
	// 대댓글 삭제 메서드
	@DeleteMapping("/reviewReplyDelete.ajax")
	@ResponseBody
	public Map<String, Object> deleteReviewReply(@RequestParam("rrNo") int rrNo, @RequestParam("sId") int sId){
		bobService.deleteReviewReply(rrNo);
		
		List<Review> reviewList = bobService.getReviewList(sId);
		Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(sId);
		
		String shopOwnerId = null;
		Shop shop = bobService.getShopDetail(sId);
		if(shop != null) {
			shopOwnerId = shop.getId();
		}
		
		Map<String, Object> result = new HashMap<>();
		result.put("reviewList", reviewList);
		result.put("reviewReplyMap", reviewReplyMap);
		result.put("shopOwnerId", shopOwnerId);
		return result;
	}
	
	
	
	
	
	

}