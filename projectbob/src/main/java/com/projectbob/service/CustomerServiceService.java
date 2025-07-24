package com.projectbob.service;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.projectbob.domain.ChatMessage;
import com.projectbob.domain.CustomerService;
import com.projectbob.domain.NoticeBoard;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.CustomerServiceMapper;

@Service
public class CustomerServiceService {

	@Autowired
	CustomerServiceMapper csMapper;
	
	public List<CustomerService> FAQList(String type){
		List<CustomerService> faqList = csMapper.FAQList(type);
		return faqList;
	}
	
	
	public void writeFAQ(CustomerService cs) {
		csMapper.writeFAQ(cs);
	}
	
	
	public CustomerService getFAQ(int csNo) {
		
		CustomerService FAQ =  csMapper.getFAQ(csNo);
		
		return FAQ;
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
		
		List<NoticeBoard> notice = csMapper.noticeList(userDivision);
		
		return notice;
	}
	
	
	public NoticeBoard getNotice(int no) {
		
		NoticeBoard notice = csMapper.getNotice(no);
		
		return notice;
	}
	
	
	public void updateNotice(NoticeBoard noticeBoard){
		csMapper.updateNotice(noticeBoard);
	}
	
	
	public void deleteNotice(int no){
		csMapper.deleteNotice(no);
	}
	
	
	public List<Shop> shopManageList(String searchShop , String keyword){
		List<Shop> shopList = csMapper.shopManageList(searchShop, keyword);
		return shopList;
	}
	
	
	public void updateShopManage(String sId, String category, String status) {
		csMapper.updateShopManage(sId, category, status);
	}
	
	public void insertChatMessage(ChatMessage chatMessage) {
		csMapper.insertChatMessage(chatMessage);
	}
	
	public List<ChatMessage> getChatMessage(String id){
		
		List<ChatMessage> chatList = csMapper.getChatMessage(id);
		
		return chatList;
	}
	
	public String chatCounselor(String message) {
		
		String apiKey = "API 키";
		
		RestTemplate restTemplate = new RestTemplate();
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(apiKey);
		
		Map<String, Object> systemMessage = Map.of("role", "system","content", 
				"\"당신은 ProjectBOB의 고객센터 챗봇입니다. 실제 업무 처리는 사람이 하며, 고객에게는 실제 전화번호나 이메일 등 잘못된 정보를 제공하지 마세요. \\\r\n"
				+ "ProjectBOB 고객센터는 이메일만 받고 있습니다. \\\r\n"
				+ "이메일: minitest0623@naver.com \\\r\n"
				+ "이 정보 외에는 절대로 임의의 연락처를 만들지 마세요. 당신은 단순 안내 역할만 합니다. \\\\\\r\\n"
				+ "기본적인 질문은 인터넷을 참조해서 답해도 됩니다.\"");
		Map<String, Object> userMessage = Map.of("role", "user", "content", message);
		List<Map<String, Object>> messages = List.of(systemMessage, userMessage);
		Map<String, Object> requestBody = Map.of("model", "gpt-3.5-turbo","messages", messages);
		
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

	    ResponseEntity<Map> response = restTemplate.exchange("https://api.openai.com/v1/chat/completions", HttpMethod.POST, entity, Map.class);

	    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
	    Map<String, Object> messageObject = (Map<String, Object>) choices.get(0).get("message");
	    
	    String answer = messageObject.get("content").toString();

	    return answer;
		
	}
}
