package com.projectbob.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.projectbob.domain.Addressbook;
import com.projectbob.domain.ChatMessage;
import com.projectbob.domain.Coupon;
import com.projectbob.domain.CustomerService;
import com.projectbob.domain.NoticeBoard;
import com.projectbob.domain.Orders;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
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
	List<Coupon> couponList(@Param("searchCoupon") String searchCoupon, @Param("keyword") String keyword);
	void createCoupon(Coupon coupon);
	Coupon getCoupon(int cNo);
	void deleteCoupon(int cNo);
	void updateCoupon(Coupon coupon);
	List<Coupon> myCoupon(String id);
	List<Map<String, Object>> myReviewList(String id);
	List<Map<String, Object>> myOrderList(String id);
	List<Map<String, Object>> getMenuPrice(@Param("sId") String sId, @Param("name") String name);
	int getMenuOptionPrice(@Param("mId") int mId, @Param("content") String content);
	Review isReview(int oNo);
	List<Map<String, Object>> reviewReplyList(String id);
}
