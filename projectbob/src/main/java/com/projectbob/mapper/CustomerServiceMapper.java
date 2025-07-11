package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.CustomerService;
import com.projectbob.domain.NoticeBoard;

@Mapper
public interface CustomerServiceMapper {

	void writeFAQ(CustomerService customerservice);
	List<CustomerService> FAQList(String type);
	CustomerService getFAQ(int csNo);
	void updateFAQ(CustomerService customerservice);
	void deleteFAQ(int csNo);
	void writeNotice(NoticeBoard noticeBaord);
}
