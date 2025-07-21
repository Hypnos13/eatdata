package com.projectbob.mapper;

import java.util.*;

import org.apache.ibatis.annotations.*;

import com.projectbob.domain.*;

@Mapper
public interface ShopMapper {
	
	//메뉴 옵션 등록
	public void insertMenuOption(MenuOption menuOption);
	
	//메뉴 등록
	public void insertMenu(Menu menu);
	
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
	
	//가게 상태 업데이트
	public void updateStatus(@Param("sId") Integer sId, @Param("status") String status);

	// 영업시간/휴무 정보만 업데이트
	@Update("UPDATE shop SET op_time = #{opTime}, off_day = #{offDay} WHERE s_id = #{sId}")
	public void updateShopOpenTime(Shop shop);

	@Select("SELECT * FROM shop WHERE s_id = #{sId} AND id = #{ownerId}")
	public Shop findByShopIdAndOwnerIdShop(@Param("sId") Integer sId, @Param("ownerId") String ownerId);

	// 가게 운영상태 변경 요청
	@Update("UPDATE shop SET stat = #{stat} WHERE s_id = #{sId}")
	void updateShopStat(@Param("sId") Integer sId, @Param("stat") String stat);

}
