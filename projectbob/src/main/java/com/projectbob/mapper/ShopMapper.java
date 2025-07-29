package com.projectbob.mapper;

import java.util.*;

import org.apache.ibatis.annotations.*;

import com.projectbob.domain.*;

@Mapper
public interface ShopMapper {
	
	/* === Shop === */
	//가게 등록
	public void insertShop(Shop shop);
	
	//가게리스트
	public List<Shop> shopList();

	//가게 정보
	public Shop findByOwnerId(String ownerId);
	
	//가게 유무 확인후 보여주기
	public List<Shop> findShopListByOwnerId(String ownerId);
	
	//다수가게에서 선택가게 고정
	public Shop findByShopIdAndOwnerId(@Param("sId") Integer sId, @Param("ownerId") String ownerId);
	
	//기본정보 수정
	public int updateShopBasicInfo(Shop shop);
	
	// 영업시간/휴무 정보만 업데이트
	void updateShopOpenTime(Shop shop);
	
	@Update("UPDATE shop SET status = #{status} WHERE s_id = #{sId}")
	void updateShopStatus(@Param("sId") Integer sId, @Param("status") String status);
	
	//메뉴 컨트롤러에 shop 모델 추가
	Shop findBySId(int sId);

    //공지/정보 업데이트
    int updateShopNotice(@Param("sId") Integer sId, @Param("notice") String notice);

    int updateShopInfo(@Param("sId") Integer sId, @Param("sInfo") String sInfo);

    // 리뷰 목록 (XML 의 <select id="findReviewsByShopId">)
    List<Review> findReviewsByShopId(@Param("sId") int sId);
    
    // 리뷰 등록
    void insertReview(Review review);

    // 리뷰 수정
    void updateReview(Review review);

    // 리뷰 삭제
    void deleteReview(@Param("rNo") int rNo);

    // 가게 평점(average) 갱신
    void updateShopRatingBySId(@Param("sId") int sId);
    
    // 답글 목록 (XML 의 <select id="findRepliesByReviewNo">)
    List<ReviewReply> findRepliesByReviewNo(@Param("rNo") int rNo);
    
    // 답글 등록 (XML 의 <insert id="insertReviewReply">)
    void insertReviewReply(ReviewReply reply);

    //답글 수정
    void updateReviewReply(ReviewReply reply);

    // 답글 삭제(soft-delete)
    void deleteReviewReply(@Param("rrNo") int rrNo);
    
	/* === Menu === */
	// 메뉴 관련 메서드
    void insertMenu(Menu menu);                  // 메뉴 등록
    List<Menu> getAllMenus();                    // 모든 메뉴 목록 조회 (간단한 정보)
    Menu getMenuById(int mId);                   // 특정 메뉴 상세 조회
    void updateMenu(Menu menu);                  // 메뉴 정보 수정
    void deleteMenu(int mId);                    // 메뉴 삭제
    List<Menu> getMenusByShopId(int sId);		 // ID에 따른 메뉴 리스트 조회
    void updateMenuStatus(@Param("mId") int mId, @Param("status") String status); // 메뉴상태 업데이트

    /* === Menu Option === */
    // 메뉴 옵션 관련 메서드
    void insertMenuOption(MenuOption menuOption);        // 메뉴 옵션 등록
    List<MenuOption> getMenuOptionsByMenuId(int mId);    // 특정 메뉴의 옵션 목록 조회
    void updateMenuOption(MenuOption menuOption);        // 메뉴 옵션 수정
    void deleteMenuOption(int moId);                     // 특정 메뉴 옵션 삭제
    void deleteMenuOptionsByMenuId(int mId);             // 특정 메뉴의 모든 옵션 삭제 (메뉴 삭제 시 호출)
    List<Menu> getMenusByShopId(@Param("sId") int sId, @Param("category") String category);
    List<String> getMenuCategoriesByShopId(int sId); //카테고리 목록 조회를 위한 메서드 추가
	
    /** 특정 가게의 메뉴 개수 조회 */
    @Select("SELECT COUNT(*) FROM menu WHERE s_id = #{sId}")
    int countMenusByShopId(@Param("sId") int sId);

}
