package com.projectbob.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.CustomerService;
import com.projectbob.domain.NoticeBoard;
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
}
