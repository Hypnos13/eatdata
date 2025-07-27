package com.projectbob.domain;

import java.util.List;

public class OrderData {
	 private List<Cart> cartList;
	    private int totalPrice;
	    private int totalQuantity;
	    private String userId;
	    private String guestId;
	    private Integer shopId;

	    // getters/setters

	    public List<Cart> getCartList() {
	        return cartList;
	    }
	    public void setCartList(List<Cart> cartList) {
	        this.cartList = cartList;
	    }
	    public int getTotalPrice() {
	        return totalPrice;
	    }
	    public void setTotalPrice(int totalPrice) {
	        this.totalPrice = totalPrice;
	    }
	    public int getTotalQuantity() {
	        return totalQuantity;
	    }
	    public void setTotalQuantity(int totalQuantity) {
	        this.totalQuantity = totalQuantity;
	    }
	    public String getUserId() {
	        return userId;
	    }
	    public void setUserId(String userId) {
	        this.userId = userId;
	    }
	    public String getGuestId() {
	        return guestId;
	    }
	    public void setGuestId(String guestId) {
	        this.guestId = guestId;
	    }
	    public Integer getShopId() {
	        return shopId;
	    }
	    public void setShopId(Integer shopId) {
	        this.shopId = shopId;
	    }
}
