package com.projectbob.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
public class BobService{

	
	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	

	//가게 검색하기
//	public List<Shop> searchList(String keyword){
//		return bobMapper.searchList(keyword);
//	}
	
	// 전체 게시글을 읽어와 반환하는 메서드
	
	public List<Shop> shopList(String category, String keyword){
		log.info("BobService: shopList(), category={}", category);	
		
		return bobMapper.shopList(category,keyword);
	}

	
	// s_id에 해당하는 게시글을 읽어와 반환하는 메서드
	

	public Shop getShopDetail(int sId) {
		log.info("BobService: getShopDetail(int s_id) 호출, 요청 s_id: {}",sId);
		return bobMapper.getShopDetail(sId);
	}
	
	
	

	public List<Menu> getMenuListByShopId(int sId){
		
		return bobMapper.getMenuListByShopId(sId);
	}
	
	// 메뉴 옵션 모달창

	public List<MenuOption> getMenuOptionsByMenuId(int mId){
		return bobMapper.getMenuOptionsByMenuId(mId);
	}
	
	//@Override
//	public List<String> getMenuCategoriesByShopId(int s_id){
//		return bobMapper.getMenuCategoriesByShopId(s_id);
//	}
	
	// 가게 번호에 해당하는 리뷰리스트에 사용
	/*
	 * public List<Review> reviewList(int sId){ return bobMapper.reviewList(sId); }
	 */	
			public List<Review> getReviewList(int sId){
	    return bobMapper.getReviewList(sId);
	}

	
	// 가게 찜 (하트) 증가
	public int plusHeart(int sId) {
		return bobMapper.plusHeart(sId);
	}
	public Integer getHeartCount(int sId) {
		return bobMapper.getHeartCount(sId);
	}
	
	
	// 댓글 등록하는 메서드
	public void addReview(Review review) {
		bobMapper.addReview(review);
	}
	
	//댓글 수정하는 메서드
	public void updateReview(Review review) {
		bobMapper.updateReview(review);
	}
	
	//댓글 삭제하는 메서드
	public void deleteReview(int rNo) {
		bobMapper.deleteReview(rNo);
	}
	
	// 대댓글 리스트
	/*
	 * public ReviewReply reviewreplyList(int rNo){ return
	 * bobMapper.reviewreplyList(rNo); }
	 */
	
	// 대댓글 등록/수정하는 메서드	
	  public void addReviewReply(ReviewReply reviewreply) {
		  int count = bobMapper.countReviewReply(reviewreply.getRNo());
		  if (count == 0) {
			  bobMapper.addReviewReply(reviewreply);
		  } else {
			  bobMapper.updateReviewReply(reviewreply);
		  }
	   }
	 
	// 가게 번호에 해당하는 전체 대댓글을 rNo(리뷰 번호) 기준으로 Map에 담아 반환
	public Map<Integer, ReviewReply> getReviewReplyMap(int sId) {
	    List<ReviewReply> replyList = bobMapper.getReviewReplyList(sId); // getReviewReplyList는 sId(가게) 전체 대댓글 가져옴
	    Map<Integer, ReviewReply> map = new HashMap<>();
	    for (ReviewReply reply : replyList) {
	        map.put(reply.getRNo(), reply); // rNo 기준 맵핑
	    }
	    return map;
	}

	// 대댓글 수정하기
	public void updateReviewReply(ReviewReply reviewreply) {
		bobMapper.updateReviewReply(reviewreply);
	}

	// 대댓글 삭제하기
	public void deleteReviewReply(int rrNo) {
		bobMapper.deleteReviewReply(rrNo);
	}
	
	
	
	
}
