package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.projectbob.domain.Addressbook;
import com.projectbob.domain.ChatMessage;
import com.projectbob.domain.CustomerService;
import com.projectbob.domain.LikeList;
import com.projectbob.domain.NoticeBoard;
import com.projectbob.domain.Shop;

@Mapper
public interface CustomerServiceMapper {

	void writeFAQ(CustomerService customerservice);
	List<CustomerService> FAQList(String type);
	CustomerService getFAQ(int csNo);
	void updateFAQ(CustomerService customerservice);
	void deleteFAQ(int csNo);
	void writeNotice(NoticeBoard noticeBoard);
	List<NoticeBoard> noticeList(String userDivision);
	NoticeBoard getNotice(int no);
	void updateNotice(NoticeBoard noticeBoard);
	void deleteNotice(int no);
	List<Shop> shopManageList(@Param("searchShop") String searchShop, @Param("keyword") String keyword );
	void updateShopManage(@Param("sId") String sId, @Param("category") String category, @Param("status") String status);
	void insertChatMessage(ChatMessage chatMessage);
	List<ChatMessage> getChatMessage(String id);
	List<Addressbook> getMyAddress(String id);
	void addAddress(Addressbook addressbook);
	Addressbook getAddress(int no);
	void updateAddress(Addressbook addressbook);
	void deleteAddress(@Param("id") String id, @Param("no") int no);
	List<Shop> getLikeList(String id);
	void cancleLike(@Param("id") String id, @Param("sId") int sId);
	void decreaseShopLike(int sId);
}
