package com.projectbob.domain;

import java.util.List;

import groovy.transform.ToString;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class CartSummaryDto {
	 private List<Cart> cartList;
	    private int totalQuantity;
	    private int totalPrice;
}
