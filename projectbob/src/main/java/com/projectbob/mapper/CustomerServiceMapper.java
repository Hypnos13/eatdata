package com.projectbob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.projectbob.domain.CustomerService;

@Mapper
public interface CustomerServiceMapper {

	void writeFAQ(CustomerService customerservice);
	List<CustomerService> FAQList(String type);
	
}
