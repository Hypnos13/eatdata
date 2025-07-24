package com.projectbob.dto;

public class NewOrderDto {
	private Integer orderId;
	private Integer shopId;
	private String menuName;
	private Integer quantity;
	private Integer totalPrice;
	private String address;
	private String phone;
	private String request;
	
	public NewOrderDto() {}
	public Integer getOrderId() {return orderId;}
	public void setOrderId(Integer orderId) {this.orderId = orderId;}

}


public static NewOrderDto from(Order o) {
	return new NewOrderDto(
			o.getOrderId(),
			);
			
}