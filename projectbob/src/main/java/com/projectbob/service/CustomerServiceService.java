package com.projectbob.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.projectbob.domain.Addressbook;
import com.projectbob.domain.ChatMessage;
import com.projectbob.domain.Coupon;
import com.projectbob.domain.CustomerService;
import com.projectbob.domain.LikeList;
import com.projectbob.domain.NoticeBoard;
import com.projectbob.domain.Orders;
import com.projectbob.domain.Review;
import com.projectbob.domain.ReviewReply;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.CustomerServiceMapper;

@Service
public class CustomerServiceService {

	@Autowired
	CustomerServiceMapper csMapper;
	
	public List<CustomerService> FAQList(String type){
		return csMapper.FAQList(type);
	}	
	
	public void writeFAQ(CustomerService cs) {
		csMapper.writeFAQ(cs);
	}
	
	public CustomerService getFAQ(int csNo) {	
		return csMapper.getFAQ(csNo);
	}
	
	public void updateFAQ(CustomerService cs) {
		csMapper.updateFAQ(cs);
	}
	
	public void deleteFAQ(int csNo) {
		csMapper.deleteFAQ(csNo);
	}	
	
	public void writeNotice(NoticeBoard noticeBoard){
		csMapper.writeNotice(noticeBoard);
	}
		
	public List<NoticeBoard> noticeList(String userDivision){	
		return csMapper.noticeList(userDivision);
	}
	
	public NoticeBoard getNotice(int no) {	
		return csMapper.getNotice(no);
	}
		
	public void updateNotice(NoticeBoard noticeBoard){
		csMapper.updateNotice(noticeBoard);
	}
	
	public void deleteNotice(int no){
		csMapper.deleteNotice(no);
	}
	
	public List<Shop> shopManageList(String searchShop , String keyword){
		return csMapper.shopManageList(searchShop, keyword);
	}
	
	public void updateShopManage(String sId, String category, String status) {
		csMapper.updateShopManage(sId, category, status);
	}
	
	public void insertChatMessage(ChatMessage chatMessage) {
		csMapper.insertChatMessage(chatMessage);
	}
	
	public List<ChatMessage> getChatMessage(String id){
		return csMapper.getChatMessage(id);
	}
	
	public String chatCounselor(String message) {
		
		String apiKey = "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";  // ChatGPTAPI
		
		RestTemplate restTemplate = new RestTemplate();  //HTTP 요청을 보낼 때 사용하는 객체
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);		// content-Type 설정
		headers.setBearerAuth(apiKey);
		
		Map<String, Object> systemMessage = Map.of("role", "system","content", 
						"당신은 BOB의 고객센터 챗봇입니다.\n" +
					    "실제 업무 처리는 사람이 하며, 고객에게는 정확한 정보만 제공합니다.\n" +
					    "\n" +
					    "[서비스 정보]\n" +
					    "- BOB은 음식 주문 및 딜리버리를 위한 커머스 관리 웹서비스입니다.\n" +
					    "- 고객센터는 이메일만 받고 있습니다.\n" +
					    "- 문의 이메일: minitest0623@naver.com\n" +
					    "\n" +
					    "[안내 규칙]\n" +
					    "1. 환불 요청이나 주문 취소는 기본적으로 주문한 가게로 직접 연락하라고 안내합니다.\n" +
					    "2. 가게 연락이 불가능하거나 이미 거절당한 경우, 이메일 문의로 안내합니다.\n" +
					    "3. 음식 이물질 발견 시 사진 등 증거를 확보 후 가게 또는 고객센터 이메일로 안내합니다.\n" +
					    "\n" +
					    "[금지 사항]\n" +
					    "- 잘못된 전화번호나 이메일을 제공하지 않습니다.\n" +
					    "- 임의로 연락처를 만들어 제공하지 않습니다.\n" +
					    "\n" +
					    "[허용 범위]\n" +
					    "- 기본적인 질문은 인터넷을 참조하여 답할 수 있습니다.\n" +
					    "- 그러나 BOB 서비스와 무관한 질문은 적절히 거절합니다.\n" +
					    "\n" +
					    "[자주 묻는 질문]\n" +
					    "Q: 주문 성공 여부는 어떻게 알 수 있나요?\n" +
					    "A: 주문 완료 시 알림이 발송되며, 메인 화면 종 아이콘 또는 마이페이지 > 주문내역에서 확인 가능합니다.\n" +
					    "Q: 배달이 지연되면 어떻게 하나요?\n" +
					    "A: 주문하신 가게에 먼저 문의해 주세요.\n" +
					    "Q: 주문 메뉴 변경·취소 가능 여부는?\n" +
					    "A: 가게에 문의해 주세요. 단, 조리 완료·배달 시작 후에는 변경/취소가 어렵습니다.\n" +
					    "Q: 배달 지연으로 환불 가능한가요?\n" +
					    "A: 가게 사정으로 인한 지연은 환불·보상이 어렵습니다.\n" +
					    "Q: 회원가입 방법은?\n" +
					    "A: 로그인 화면 하단의 회원가입 버튼을 통해 가능합니다.\n" +
					    "Q: 리뷰 작성 조건은?\n" +
					    "A: 실제 주문 내역이 있는 고객만 작성 가능합니다.\n" +
					    "Q: 회원 탈퇴 방법은?\n" +
					    "A: 로그인 > 내정보수정 > 비밀번호 입력 > 회원 탈퇴 클릭.\n" +
					    "Q: 아이디/비밀번호 찾기 방법은?\n" +
					    "A: 로그인 화면의 ‘아이디 찾기 / 비밀번호 찾기’ 기능을 사용합니다.\n" +
					    "Q: 결제 수단은 무엇이 가능한가요?\n" +
					    "A: 카카오 QR코드 결제가 가능합니다.\n" +
					    "Q: 할인 이벤트는 없나요?\n" +
					    "A: 공지사항에서 확인 가능합니다.");   // Chat GPT에게 역할을 부여하는 프롬프트
		Map<String, Object> userMessage = Map.of("role", "user", "content", message);		// 사용자의 메시지
		List<Map<String, Object>> messages = List.of(systemMessage, userMessage);	// 총 설정 보냄
		Map<String, Object> requestBody = Map.of("model", "gpt-3.5-turbo","messages", messages);  // GPT 사용할 모델 (모델에 따라 사용료가 다름)
		
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);	// 요청할 Header와 Body 모두 담은 요청 객체

	    ResponseEntity<Map> response = restTemplate.exchange("https://api.openai.com/v1/chat/completions", HttpMethod.POST, entity, Map.class); // Ghat API에 POST로 요청 받음

	    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");		// 받은 응답을 파싱
	    Map<String, Object> messageObject = (Map<String, Object>) choices.get(0).get("message");
	    
	    String answer = messageObject.get("content").toString();

	    return answer;
		
	}
	
	public List<Addressbook> getMyAddress(String id){
		return csMapper.getMyAddress(id);
	}
	
	public void addAddress(Addressbook addressbook) {
		csMapper.addAddress(addressbook);
	}
	
	public Addressbook getAddress(int no) {
		return csMapper.getAddress(no);
	}
	
	public void updateAddress(Addressbook addressbook) {
		csMapper.updateAddress(addressbook);
	}
	
	public void deleteAddress(String id, int no) {
		csMapper.deleteAddress(id, no);
	}
	
	public List<Shop> getLikeList(String id){
		return csMapper.getLikeList(id);
	}
	
	public void cancleLike(String id, int sId) {
		csMapper.cancleLike(id, sId);
		csMapper.decreaseShopLike(sId);
	}
	
	public List<Coupon> couponList(String searchCoupon, String keyword){
		return csMapper.couponList(searchCoupon, keyword);
	}
	
	public void createCoupon(Coupon coupon) {
		csMapper.createCoupon(coupon);
	}
	
	public Coupon getCoupon(int cNo) {
		return csMapper.getCoupon(cNo);
	}
	
	public void deleteCoupon(int cNo) {
		csMapper.deleteCoupon(cNo);
	} 
	
	public void updateCoupon(Coupon coupon){
		csMapper.updateCoupon(coupon);
	}
	
	public List<Coupon> myCoupon(String id){
		return csMapper.myCoupon(id);
	}
	
	public List<Map<String, Object>> myReviewList(String id){
		return csMapper.myReviewList(id);
	}
	
	public List<Map<String, Object>> myOrderList(String id){
		
		List<Map<String, Object>> myOrderList = csMapper.myOrderList(id);
		
		for(Map<String, Object> order : myOrderList) {
			String menuStr = (String) order.get("menu");
			String sId = (String) order.get("sId").toString();
			int oNo = Integer.parseInt(order.get("no").toString());
			
			List<Map<String, Object>> parsedMenus = new ArrayList<>();
			Review review = csMapper.isReview(oNo); 
			boolean hasReview = (review != null);
			order.put("hasReview", hasReview);
			
			for (String item : menuStr.split("\\s*,\\s*")) {
			   Matcher m = Pattern.compile("(.+?)\\s*\\*\\s*(\\d+)(?:\\s*\\((.+?)\\))?").matcher(item);
	           Map<String, Object> parsed = new HashMap<>();

	           if (m.matches()) {
	        	   String menuName = m.group(1).trim();
	               int count = Integer.parseInt(m.group(2).trim());
	               String option = m.group(3) != null ? m.group(3).trim() : "";
	               
	               parsed.put("menu", menuName);
	               parsed.put("count", count);
	               parsed.put("option", option);
	               parsed.put("sId", sId);
	               
	               List<Map<String, Object>> menuPriceList = csMapper.getMenuPrice(sId, menuName);
	               
	               if (menuPriceList != null) {
	            	   	Map<String, Object> menuInfo = menuPriceList.get(0);
	            	    int mId = Integer.parseInt(menuInfo.get("m_id").toString());       
	            	    int menuPrice = Integer.parseInt(menuInfo.get("price").toString());

	            	    parsed.put("menuPrice", menuPrice);
	            	    
	            	    System.out.println("파싱된 메뉴명: " + menuName + ", 옵션: [" + option + "], sId: " + sId);
	            	    System.out.println("선택된 m_id: " + mId);

	            	    if (!option.isEmpty()) {
	                        // 1. Mapper의 반환 타입이 Integer로 변경되었다고 가정
	                        Integer optionPrice = csMapper.getMenuOptionPrice(mId, option);

	                        // 2. null 체크: 반환된 가격이 null이 아닐 때만 값을 사용하고, null이면 0을 사용
	                        if (optionPrice != null) {
	                            parsed.put("optionPrice", optionPrice);
	                        } else {
	                            parsed.put("optionPrice", 0);
	                        }
	                    } else {
	                        parsed.put("optionPrice", 0);
	                    }
	                } else {
	                    parsed.put("menuPrice", 0);
	                    parsed.put("optionPrice", 0);
	                }
	               
	           } else {
	        	   parsed.put("menu", item.trim());
	               parsed.put("count", 1);
	               parsed.put("option", "");
	               parsed.put("sId", sId);
	               parsed.put("menuPrice", 0);
	               parsed.put("optionPrice", 0);
	           }
	            System.out.println("parsed : " + parsed);
	            
	            parsedMenus.add(parsed);
	        }
			
			 order.put("parsedMenus", parsedMenus);
		}
		
		
		return myOrderList;
	}
	
	public List<Map<String, Object>> reviewReplyList(String id){
		return csMapper.reviewReplyList(id);
	}
}
