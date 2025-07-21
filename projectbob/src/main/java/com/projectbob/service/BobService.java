package com.projectbob.service;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectbob.domain.Cart;
import com.projectbob.domain.CartAddRequestDto;
import com.projectbob.domain.Menu;
import com.projectbob.domain.MenuOption;
import com.projectbob.domain.Review;
import com.projectbob.domain.Shop;
import com.projectbob.mapper.BobMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BobService {

	// DB작업에 필요한 BobMapper 객체 의존성 주입 설정
	@Autowired
	private BobMapper bobMapper;
	
	public void addCartItem(CartAddRequestDto dto) {
        // 1) 메뉴 기본정보 + 수량으로 Cart insert (옵션 제외)
        Cart cart = new Cart();
        cart.setId(dto.getUId());
        cart.setMId(dto.getMId());
        cart.setSId(dto.getSId());
        cart.setQuantity(dto.getQuantity());
        // 가격 계산 필요 시 추가 처리 가능 (dto 또는 서비스 내 계산)

        // 총 가격은 (메뉴 가격 + 옵션 가격 합산) * 수량 계산해서 setTotalPrice 해야 하지만
        // 여기서는 임시 0으로 세팅 (실제 가격 계산 로직은 서비스 내 추가 필요)
        cart.setTotalPrice(0);

        bobMapper.insertCart(cart);  // insert 후 자동으로 caId 세팅됨

        int cartId = cart.getCaId();

        // 2) 옵션이 있으면 cart_option 테이블에 하나씩 insert
        if (dto.getOptionList() != null) {
            for (MenuOption option : dto.getOptionList()) {
                bobMapper.insertCartOption(cartId, option.getMoId());
            }
        }
    }

    public List<Cart> getCartListByUser(String userId) {
        return bobMapper.selectCartListByUser(userId);
    }

	// 가게 검색하기
//	public List<Shop> searchList(String keyword){
//		return bobMapper.searchList(keyword);
//	}

	// 전체 게시글을 읽어와 반환하는 메서드

	public List<Shop> shopList(String category, String keyword) {
		log.info("BobService: shopList(), category={}", category);

		return bobMapper.shopList(category, keyword);
	}

	// s_id에 해당하는 게시글을 읽어와 반환하는 메서드

	public Shop getShopDetail(int sId) {
		log.info("BobService: getShopDetail(int s_id) 호출, 요청 s_id: {}", sId);
		return bobMapper.getShopDetail(sId);
	}

	public List<Menu> getMenuListByShopId(int sId) {

		return bobMapper.getMenuListByShopId(sId);
	}

	// 메뉴 옵션 모달창

	public List<MenuOption> getMenuOptionsByMenuId(int mId) {
		return bobMapper.getMenuOptionsByMenuId(mId);
	}

	// @Override
//	public List<String> getMenuCategoriesByShopId(int s_id){
//		return bobMapper.getMenuCategoriesByShopId(s_id);
//	}

	// 가게 번호에 해당하는 리뷰리스트에 사용
	public List<Review> reviewList(int sId) {
		return bobMapper.reviewList(sId);
	}

	// 가게 찜 (하트) 증가
	public int plusHeart(int sId) {
		return bobMapper.plusHeart(sId);
	}

	public Integer getHeartCount(int sId) {
		return bobMapper.getHeartCount(sId);
	}

	// 댓글 등록하는 메서드
	public void addReview(Review review) {
		bobMapper.addReview(review);
	}

	//주문 목록보기
	public List<Cart> getCart(String id) {
		return bobMapper.getCart(id);
	}
	
	//주문 추가
//	public boolean insertCart(Cart cart) {
//		return bobMapper.insertCart(cart) > 0;
//	}
	
	//수량 업데이트
	public boolean updateCartQuantity(Cart cart) {
		return bobMapper.countUpdateCart(cart) > 0;
	}
	
	//주문메뉴 개당 삭제
	public boolean deleteMenu(Cart cart) {
		return bobMapper.deleteMenu(cart) > 0;
	}
	
	//주문표 전체삭제
	public boolean deleteAllCart(String id) {
		return bobMapper.deleteAllCart(id) > 0;
	}

}
