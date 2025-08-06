package com.projectbob.dto;

import com.projectbob.domain.Orders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewOrder {
	private Integer orderId;
	private Integer shopId;
	private String menuName;
	private Integer quantity;
	private Integer totalPrice;
	private String address;
	private String phone;
	private String request;
	private String status;
	
	public static NewOrder from(Orders o, String menuName) {
		return new NewOrder(
				o.getONo(),
				o.getSId(),
				menuName,
				o.getQuantity(),
				o.getTotalPrice(),
				o.getOAddress(),
				null,
				o.getRequest(),
				o.getStatus()
				);
	}
	
}
