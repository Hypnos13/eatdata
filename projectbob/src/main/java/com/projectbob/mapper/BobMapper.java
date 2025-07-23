package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.projectbob.domain.LikeList;
import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;

@Mapper
public interface BobMapper {
	public List<Shop> shopList(@Param("category") String category,@Param("keyword") String keyword); //shopList 페이지
	
	public Shop getShopDetail(int sId); // s_id를 받아 Shop 객체 반환
		
	// menuDetail 페이지에 사용
	public List<Menu> getMenuListByShopId(int sId); 	
	
	// 메뉴옵션 선택하는 모달창에서 사용
	public List<MenuOption> getMenuOptionsByMenuId(int mId);		
	public List<String> getMenuCategoriesByShopId(int sId);
	
	// 가게 번호에 해당하는 리뷰리스트에 사용
	//public List<Review> reviewList(int sId);
	public List<Review> getReviewList(int sId);

	
	// shop 하트 증가	
		int plusHeart(int sId);
		Integer getHeartCount(int sId);
		
	// 찜
	public int isLiked(LikeList likeList);
	
	// 찜 추가
	public int addLikeList(LikeList likeList);
	
	// 찜 삭제
	public int deleteLikeList(LikeList likeList);
	
	// 가게 찜 수
	public int shopCountLike(@Param("sId") int sId);
	
	// 찜 추가 시 shop.heart + 1 , - 1
	public int incrementHeart(@Param("sId") int sId);
	public int decrementHeart(@Param("sId") int sId);
		
	// 댓글을 DB에 등록하는 메서드
	public void addReview(Review review);
	
	//댓글 수정하는 메서드
	public void updateReview(Review review);
	
	//댓글 삭제하는 메서드
	public void deleteReview(int rNo);
	
	// 댓글에 달린 대댓글 가져오기 메서드
	public ReviewReply reviewreplyList(@Param("rNo") int rNo);
	
	// 대댓글 DB에 등록하는 메서드
	public void addReviewReply(ReviewReply reviewreply);
	
	// 가게 전체 대댓글
	public List<ReviewReply> getReviewReplyList(@Param("sId") int sId);
	
	// 대댓글 수정
	public void updateReviewReply(ReviewReply reviewreply);
	
	// 대댓글 삭제
	public void deleteReviewReply(@Param("rrNo") int rrNo);
	
	// 대댓글 개수조회
	public int countReviewReply(@Param("rNo") int rNo);

}

