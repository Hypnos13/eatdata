package com.projectbob.mapper;

import java.util.*;

import org.apache.ibatis.annotations.*;

import com.projectbob.domain.*;

@Mapper
public interface ShopMapper {
	
	//가게 등록
	public void insertShop(Shop shop);
	
	//가게리스트
	public List<Shop> shopList();

	//가게 정보
	public Shop findByOwnerId(String ownerId);
	

	// 메뉴 관련 메서드
    void insertMenu(Menu menu);                  // 메뉴 등록
    List<Menu> getAllMenus();                    // 모든 메뉴 목록 조회 (간단한 정보)
    Menu getMenuById(int mId);                   // 특정 메뉴 상세 조회
    void updateMenu(Menu menu);                  // 메뉴 정보 수정
    void deleteMenu(int mId);                    // 메뉴 삭제
    List<Menu> getMenusByShopId(int sId);		 // ID에 따른 메뉴 리스트 조회

    // 메뉴 옵션 관련 메서드
    void insertMenuOption(MenuOption menuOption);        // 메뉴 옵션 등록
    List<MenuOption> getMenuOptionsByMenuId(int mId);    // 특정 메뉴의 옵션 목록 조회
    void updateMenuOption(MenuOption menuOption);        // 메뉴 옵션 수정
    void deleteMenuOption(int moId);                     // 특정 메뉴 옵션 삭제
    void deleteMenuOptionsByMenuId(int mId);             // 특정 메뉴의 모든 옵션 삭제 (메뉴 삭제 시 호출)
	

	//가게 유무 확인후 보여주기
	public List<Shop> findShopListByOwnerId(String ownerId);
	
	//다수가게에서 선택가게 고정
	public Shop findByShopIdAndOwnerId(@Param("sId") Integer sId, @Param("ownerId") String ownerId);

	//기본정보 수정
	public int updateShopBasicInfo(Shop shop);
	
	//가게 상태 업데이트
	public void updateStatus(@Param("sId") Integer sId, @Param("status") String status);

	// 영업시간/휴무 정보만 업데이트
	@Update("UPDATE shop SET op_time = #{opTime}, off_day = #{offDay} WHERE s_id = #{sId}")
	public void updateShopOpenTime(Shop shop);

	@Select("SELECT * FROM shop WHERE s_id = #{sId} AND id = #{ownerId}")
	public Shop findByShopIdAndOwnerIdShop(@Param("sId") Integer sId, @Param("ownerId") String ownerId);

	// 가게 운영상태 변경 요청
	@Update("UPDATE shop SET status = #{status} WHERE s_id = #{sId}")
	void updateShopStatus(@Param("sId") Integer sId, @Param("status") String status);

	//메뉴 컨트롤러에 shop 모델 추가
	Shop findBySId(int sId);
}
