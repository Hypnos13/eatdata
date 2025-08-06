package com.projectbob.service;

import java.io.*;
import java.util.*;
import java.sql.Timestamp;

import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.SessionAttribute;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import org.springframework.ui.Model;

import com.projectbob.domain.*;
import com.projectbob.mapper.*;
import com.projectbob.service.PortoneService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ShopService {

    private final WebsocketService websocketService;
	
	@Autowired
	private ShopMapper shopMapper;

	@Autowired
	private PortoneService portoneService;
	
	@Autowired
	private FileUploadService fileUploadService;
	
    ShopService(WebsocketService websocketService) {
        this.websocketService = websocketService;
    }
	
    /* ---------- Menu ---------- */
	// 메뉴 등록
	@Transactional
	public void insertMenu(Menu menu, MultipartFile mPicture) throws IOException {
		//이미지 파일 처리
		if (mPicture != null && !mPicture.isEmpty()) {
			try {
				String fileUrl = fileUploadService.uploadFile(mPicture, "menu");
				menu.setMPictureUrl(fileUrl);
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 등록: 파일 업로드 오류 - "+ e.getMessage());
				menu.setMPictureUrl(null);
			}
		} else {
			menu.setMPictureUrl(null); //파일이 없을 시 null 로
		}
		shopMapper.insertMenu(menu);
		// 메뉴 옵션 등록
		if(menu.getOptions() != null && !menu.getOptions().isEmpty()) {
			for(MenuOption option : menu.getOptions()) {
				if(option != null && StringUtils.hasText(option.getMOption()) && StringUtils.hasText(option.getContent())) {
					option.setMId(menu.getMId());
					option.setStatus("active");
					shopMapper.insertMenuOption(option);
				}
			}
		}
	}
	
	//모든 메뉴 목록 조회
	public List<Menu> getAllMenus() {
		return shopMapper.getAllMenus();
	}

	//가게별 메뉴 수 조회
	public int getMenuCount(int sId) {
		return shopMapper.countMenusByShopId(sId);
	}
	
	// 메뉴 리스트
	public List<Menu> getMenusByShopId(int sId) {
		return shopMapper.getMenusByShopId(sId);
	}
	

	//category 파라미터 추가
    public List<Menu> getMenusByShopId(int sId, String category) {
        return shopMapper.getMenusByShopId(sId, category);
    }
    //카테고리 목록 조회 서비스 추가
    public List<String> getMenuCategoriesByShopId(int sId) {
        return shopMapper.getMenuCategoriesByShopId(sId);
    }
	// 메뉴 상태 업데이트
	public void updateMenuStatus(int mId, String status) {
		shopMapper.updateMenuStatus(mId, status);
	}

	// 특정 메뉴 상세 조회(옵션 포함)
	public Menu getMenuDetail(int mId) {
	    Menu menu = shopMapper.getMenuById(mId); // 1. 메뉴 기본 정보 로드
	    if (menu != null) {
	        List<MenuOption> options = shopMapper.getMenuOptionsByMenuId(mId); // 2. 메뉴 옵션 로드
	        menu.setOptions(options); // 3. 로드된 옵션을 Menu 객체에 설정
	    }
	    return menu;
	}
	// 메뉴 정보 수정
	@Transactional
	public void updateMenu(Menu menu, MultipartFile newMPicture) throws IOException {
		String newPictureUrl = menu.getMPictureUrl(); // 기존 URL
		if (newMPicture != null && !newMPicture.isEmpty()) {
			// 새 파일이 업로드 된 경우 - 기존 파일 삭제 후 새 파일 저장
			Menu existingMenu = shopMapper.getMenuById(menu.getMId());
			if (existingMenu != null && StringUtils.hasText(existingMenu.getMPictureUrl())) {
				// 기존 URL에서 파일 경로 추출
				String oldFilePath = convertWebPathToSystemPath(existingMenu.getMPictureUrl());
				File oldFile = new File(oldFilePath);
				if (oldFile.exists()) {
					if (oldFile.delete()) {
						log.info("기존 메뉴 이미지 삭제: " + oldFile.getAbsolutePath());
					} else {
						log.warn("기존 메뉴 이미지 삭제 실패: "+ oldFile.getAbsolutePath());
					}
				}
			}
			try { // 새 파일 업로드
				newPictureUrl = fileUploadService.uploadFile(newMPicture, "menu");
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 수정: 새 파일 업로드 오류 - " + e.getMessage());
			}
		} else { // 새 파일이 업로드 되지 않은 경우: 기존 파일 URL을 유지
			Menu existingMenu = shopMapper.getMenuById(menu.getMId());
			if(existingMenu != null) {
				newPictureUrl = existingMenu.getMPictureUrl();
			}
		}
		menu.setMPictureUrl(newPictureUrl);
		
		shopMapper.updateMenu(menu);
		// 기존 옵션 삭제
		shopMapper.deleteMenuOptionsByMenuId(menu.getMId());
		if (menu.getOptions() != null && !menu.getOptions().isEmpty()) {
			for(MenuOption option : menu.getOptions()) {
				// 옵션의 이름과 내용이 비어있지 않고, 유효한 옵션만 저장
				if(option != null && StringUtils.hasText(option.getMOption()) && StringUtils.hasText(option.getContent()) 
							&& !"deleted".equals(option.getStatus())) {
					option.setMId(menu.getMId());
					option.setStatus("active");
					shopMapper.insertMenuOption(option);
				}
			}
		}
	}
	// 메뉴 삭제(관련 옵션 및 이미지파일 모두 삭제)
	@Transactional
	public void deleteMenu(int mId) {
		Menu menuToDelete = shopMapper.getMenuById(mId);
		shopMapper.deleteMenuOptionsByMenuId(mId);
		shopMapper.deleteMenu(mId);
		
		if(menuToDelete != null && StringUtils.hasText(menuToDelete.getMPictureUrl())) {
			String imageFilePath = convertWebPathToSystemPath(menuToDelete.getMPictureUrl());
			File imageFile = new File(imageFilePath);
			if(imageFile.exists()) {
				if(imageFile.delete()) {
					log.info("메뉴에 따른 이미지 파일 삭제: " + imageFile.getAbsolutePath());
				} else {
					log.warn("메뉴에 따른 이미지 파일 삭제 실패: " + imageFile.getAbsolutePath());
				}
			}
		}
	}
	@Transactional
	public void deleteMenuWithAuthorization(int mId, String ownerId) {
	    Menu menu = shopMapper.getMenuById(mId);
	    if (menu == null) {
	        throw new IllegalArgumentException("존재하지 않는 메뉴입니다.");
	    }
	    // ★★★ 핵심: 메뉴의 가게(sId)가 로그인한 유저(ownerId)의 소유인지 확인
	    Shop shop = shopMapper.findByShopIdAndOwnerId(menu.getSId(), ownerId);
	    if (shop == null) {
	        // 남의 가게 메뉴를 지우려는 시도!
	        throw new SecurityException("해당 메뉴를 삭제할 권한이 없습니다.");
	    }

	    // 권한이 확인되었으므로 기존 삭제 로직 수행
	    deleteMenu(mId); 
	}
	// 웹 경로를 시스템 파일 경로로 변환하는 헬퍼 메서드
	private String convertWebPathToSystemPath(String webPath) {
		if (webPath == null || !webPath.startsWith("/images/")) {
			return null; // 유효하지 않은 웹 경로
		}
		String relativePath = webPath.substring("/images/".length());
		return fileUploadService.getUploadBaseDir() + File.separator + relativePath.replace("/", File.separator);
	}
	
	// 여러 상태값으로 주문 목록 조회
	public List<Orders> findOrdersByMultipleStatusesAndShop(List<String> statuses, int sId) {
	    return shopMapper.selectOrdersByMultipleStatusesAndShop(statuses, sId);
	}

	/* ---------- Shop ---------- */
	//가게 등록
	public void insertShop(Shop shop) {
		shopMapper.insertShop(shop);
	}
	
	@Transactional
	public void insertShop(Shop shop, MultipartFile sPicture, MultipartFile sLicense) throws IOException {
		//이미지 파일 처리
		if (sLicense != null && !sLicense.isEmpty()) {
			try {
				String fileUrl = fileUploadService.uploadFile(sLicense, "shop");
				shop.setSLicenseUrl(fileUrl);
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 등록: 라이센스 업로드 오류 - "+ e.getMessage());
				shop.setSLicenseUrl(null);
			}
		} else {
			shop.setSLicenseUrl(null); //파일이 없을 시 null 로
		}
		if (sPicture != null && !sPicture.isEmpty()) {
			try {
				String fileUrl = fileUploadService.uploadFile(sPicture, "shop");
				shop.setSPictureUrl(fileUrl);
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 등록: 가게사진 업로드 오류 - "+ e.getMessage());
				shop.setSPictureUrl(null);
			}
		} else {
			shop.setSPictureUrl(null); //파일이 없을 시 null 로
		}
		shopMapper.insertShop(shop);
	}
	
	//가게 리스트
	public List<Shop> shopList() {
		return shopMapper.shopList();
	}
	
	//가게 정보 불러오기
	public Shop findByOwnerId(String ownerId) {
	    return shopMapper.findByOwnerId(ownerId);
	}	
	
	//가게 유무 판단해서 보여주기
	public List<Shop> findShopListByOwnerId(String ownerId) {
	    return shopMapper.findShopListByOwnerId(ownerId);
	}
	
	//다수 가게에서 현재 선택한 가게고정
	public Shop findByShopIdAndOwnerId(Integer sId, String ownerId) {
	    log.debug("가게 조회 요청 - sId: {}, ownerId: {}", sId, ownerId);
	    Shop shop = shopMapper.findByShopIdAndOwnerId(sId, ownerId);
	    if (shop == null) {
	        log.warn("가게를 찾을 수 없습니다. sId={}, ownerId={}", sId, ownerId);
	    }
	    return shop;
	}
	
	//메뉴 컨트롤러 shop 모델 추가
	public Shop findBySId(int sId) {
	    return shopMapper.findBySId(sId);
	}
	
	//기본정보 수정
	public void updateShopBasicInfo(Shop shop) {
	    // 업데이트 후 로그
	    int result = shopMapper.updateShopBasicInfo(shop);
	    log.info("업데이트 결과: {}", result);
	}
	
	// 가게 운영상태 변경 요청
	public void updateShopStatus(Integer sId, String status) {
	    shopMapper.updateShopStatus(sId, status);
	}
	
	//영업시간 정보
	public List<String[]> getOpenTimeList(Shop shop) {
	    String opTime = shop.getOpTime();
	    List<String[]> result = new ArrayList<>();
	    if (opTime == null || opTime.isBlank()) {
	        for (int i = 0; i < 7; i++) result.add(new String[]{"-", "-"});
	        return result;
	    }
	    String[] arr = opTime.split(";");
	    for (String s : arr) {
	        s = s.trim();
	        if (s.equals("-,-") || s.isBlank()) {
	            result.add(new String[]{"휴무", ""});
	        } else {
	            String[] t = s.split(",");
	            if (t.length == 2) result.add(new String[]{t[0].trim(), t[1].trim()});
	            else result.add(new String[]{"-", "-"});
	        }
	    }
	    while (result.size() < 7) result.add(new String[]{"-", "-"});
	    return result;

	}
	
	//영업시간 업데이트
	public void updateShopOpenTime(Shop shop) {
	    shopMapper.updateShopOpenTime(shop);
	}
	
	//텍스트라인 헬퍼
	public List<String> buildOpenTextLines(Shop shop) {
	    List<String[]> list = getOpenTimeList(shop);
	    String[] days = {"월","화","수","목","금","토","일"};
	    List<String> lines = new ArrayList<>();
	    for (int i=0;i<7;i++) {
	        String[] t = list.get(i);
	        if ("휴무".equals(t[0])) {
	            lines.add(days[i] + "요일 : 휴무");
	        } else {
	            lines.add(days[i] + "요일 : " + t[0] + " ~ " + t[1]);
	        }
	    }
	    return lines;
	}
	
	// 사장님 공지 & 정보 업데이트
	@Transactional
    public void updateShopNotice(Integer sId, String notice) {
        shopMapper.updateShopNotice(sId, notice);
    }

    @Transactional
    public void updateShopInfo(Integer sId, String sInfo) {
        shopMapper.updateShopInfo(sId, sInfo);
    }
    
    // 리뷰 + 답글 함께 불러오기
    public List<Review> getReviewsWithReplies(int sId) {
        List<Review> reviews = shopMapper.findReviewsByShopId(sId);
        for (Review r : reviews) {
            r.getReplies().addAll(
                shopMapper.findRepliesByReviewNo(r.getRNo())
            );
        }
        return reviews;
    }

    // 리뷰 등록
    @Transactional
    public void addReview(Review review) {
        shopMapper.insertReview(review);              // 리뷰 등록
        shopMapper.updateShopRatingBySId(review.getSId()); // ★ 평점 갱신
    }

    // 리뷰 수정
    @Transactional
    public void updateReview(Review review) {
        shopMapper.updateReview(review);              // 리뷰 수정
        shopMapper.updateShopRatingBySId(review.getSId()); // ★ 평점 갱신
    }
    
    // 리뷰 삭제 
    @Transactional
    public void deleteReview(int rNo, int sId) {
        shopMapper.deleteReview(rNo);                 // 리뷰 삭제
        shopMapper.updateShopRatingBySId(sId);             // ★ 평점 갱신
    }

    // 답글 등록
    public void addReply(ReviewReply reply) {
        shopMapper.insertReviewReply(reply);
    }
    
    //답글 수정 
    @Transactional
    public void updateReply(ReviewReply reply) {
        shopMapper.updateReviewReply(reply);
    }
    
    // 답글 삭제(soft-delete) 
    @Transactional
    public void deleteReply(int rrNo) {
        shopMapper.deleteReviewReply(rrNo);
    }
    
    // 전체 리뷰 개수 조회 (필수)
    public int countReviewsByShopId(int sId) {
        return shopMapper.countReviewsByShopId(sId);
    }

    // 페이징된 리뷰 + 답글 조회 (필수)
    public List<Review> getReviewsWithRepliesPaged(int sId, int page, int size) {
        int offset = (page - 1) * size;
        List<Review> reviews = shopMapper.findReviewsByShopIdPaged(sId, offset, size);
        for (Review r : reviews) {
            r.getReplies().addAll(
                shopMapper.findRepliesByReviewNo(r.getRNo())
            );
        }
        return reviews;
    }
    
    //주문 조회
    public List<Orders> findOrdersByShopId(int sId) {
        return shopMapper.selectOrdersByShopId(sId);
    }
    
    // 단일 주문 상세 조회 
    public Orders findOrderByNo(int oNo) {
        return shopMapper.selectOrderByNo(oNo);
    }

    // 주문 상태 변경
    @Transactional
    public void updateOrderStatus(int oNo, String newStatus) {
        // 1. 주문 상태를 DB에서 먼저 업데이트합니다.
        shopMapper.updateOrderStatus(oNo, newStatus);

        // 2. 알림 전송에 필요한 추가 정보를 조회합니다 (가게ID, 고객ID 등).
        Orders order = findOrderByNo(oNo);
        if (order == null) {
            log.error("주문 정보를 찾을 수 없습니다. (oNo: {})", oNo);
            return;
        }
        String userId = shopMapper.getUserIdByOrderNo(oNo);
        int shopId = order.getSId();


        // 3. Payload 생성
        String message = "";
        if ("ACCEPTED".equals(newStatus)) {
            message = "✅ 주문 #" + oNo + "이(가) 수락되었습니다! 곧 준비가 시작됩니다.";
        } else if ("REJECTED".equals(newStatus)) {
            message = "❌ 주문 #" + oNo + "이(가) 가게 사정으로 취소되었습니다. 결제 금액은 자동 환불됩니다.";
        } else if ("DELIVERING".equals(newStatus)) {
            message = "🛵 주문 #" + oNo + "이(가) 배달을 시작했습니다!";
        } else if ("COMPLETED".equals(newStatus)) {
            message = "✅ 주문 #" + oNo + "이(가) 완료되었습니다! 맛있게 드세요.";
        } else {
            message = "🔔 주문 #" + oNo + " 상태 업데이트: " + newStatus;
        }


        // 3. (핵심) 상태 변경 후, 최신 PENDING 주문 개수를 다시 DB에서 조회합니다.
        // 이 개수는 점주 페이지의 헤더 알림 뱃지를 실시간으로 정확하게 업데이트하는 데 사용됩니다.
        int newPendingCount = shopMapper.countOrdersByStatusAndShop("PENDING", shopId);


        // 4. WebsocketService를 통해 점주에게 변경 사실과 '최신 알림 개수'를 함께 전송합니다.
        websocketService.sendOrderStatusChange(oNo, shopId, newStatus, newPendingCount);

        // 5. 주문한 고객에게만 보내는 1:1 알림을 전송합니다.
        if (userId != null && !userId.isEmpty()) {
            Map<String, Object> payload = Map.of("oNo", oNo, "newStatus", newStatus);
            websocketService.sendOrderStatusUpdateToUser(userId, payload);
            log.info("고객에게 주문 상태 변경 알림 전송 완료. userId: {}, oNo: {}, status: {}", userId, oNo, newStatus);
        } else {
            log.error("고객 ID를 찾을 수 없어 주문 상태 변경 알림을 전송하지 못했습니다. (oNo: {})", oNo);
        }
    }
    
    // 주문 거절 및 환불 처리
    @Transactional
    public boolean rejectOrderAndCancelPayment(int oNo, String reason) {
        // 1. 주문 정보 조회
        Orders order = findOrderByNo(oNo);
        if (order == null) {
            log.error("주문 거절 실패: 주문 정보를 찾을 수 없습니다. (oNo: {})", oNo);
            return false;
        }

        // 디버깅: paymentUid 값 확인
        log.info("rejectOrderAndProcessRefund: 주문번호 {}의 paymentUid: {}", oNo, order.getPaymentUid());

        // 2. 포트원 결제 취소 요청
        boolean isCancelled = portoneService.cancelPayment(order.getPaymentUid(), String.valueOf(oNo), reason, order.getTotalPrice());

        // 3. 결제 취소 성공 시 주문 상태 변경
        if (isCancelled) {
            updateOrderStatus(oNo, "REJECTED");
            log.info("주문이 성공적으로 거절되고 환불 처리되었습니다. (oNo: {})", oNo);
            return true;
        } else {
            log.error("포트원 결제 취소에 실패했습니다. (oNo: {}, paymentUid: {})", oNo, order.getPaymentUid());
            return false;
        }
    }
    
    //신규주문 insert
    @Transactional
    public Orders placeOrder(Map<String,Object> req) {
        // 1. 주문 정보 객체 생성 (모든 필드 세팅)
        Orders order = new Orders();    // ← 반드시 선언!
        order.setSId((Integer) req.get("sId"));
        order.setId((String) req.get("id"));
        order.setTotalPrice((Integer) req.get("totalPrice"));
        order.setPayment((String) req.get("payment"));
        order.setOAddress((String) req.get("oAddress"));
        order.setRequest((String) req.get("request"));
        order.setStatus("PENDING");
        order.setQuantity((Integer) req.getOrDefault("quantity", 1));
        order.setMenus((String) req.get("menus"));
        order.setPaymentUid((String) req.get("paymentUid"));
        // regDate, modiDate는 DB에서 SYSDATE()로 자동 설정

        // 2. DB에 주문 insert
        shopMapper.insertOrder(order);
        Orders inserted = shopMapper.selectOrderByNo(order.getONo());
        order.setRegDate(inserted.getRegDate());
        order.setModiDate(inserted.getModiDate());

        // 3. 추가 정보 조회
        Shop shop = shopMapper.findBySId(order.getSId());
        String shopName = shop.getName();
        String customerPhone = (String) req.get("phone");

        // 4. WebSocket용 NewOrder DTO 생성
        long regDateMs = order.getRegDate().getTime();  // ← 반드시 order 변수 사용!

        NewOrder newOrder = new NewOrder(
            order.getONo(),           // orderId
            order.getSId(),           // shopId
            shopName,                 // shopName
            order.getMenus(),         // menus
            order.getTotalPrice(),    // totalPrice
            order.getPayment(),       // payment
            order.getOAddress(),      // address
            customerPhone,            // phone
            order.getRequest(),       // request
            order.getStatus(),        // status
            order.getRegDate(),       // regDate
            regDateMs                 // regDateMs ← 추가된 필드!
        );

        // 5. WebSocket 알림
        websocketService.sendNewOrder(newOrder);

        // 6. 주문 엔티티 반환
        return order;
    }
    
    // 상태별 & 가게별 주문 조회
    public List<Orders> findOrdersByStatusAndShop(String status, int sId) {
        return shopMapper.selectOrdersByStatusAndShop(status, sId);
    }
    
    
    // 상태별 & 오너별 "신규 주문" 알림 목록
    public List<Orders> findNewOrdersByOwner(String loginId) {
        return shopMapper.findOrdersByOwnerAndStatus(loginId, "NEW");
    }

    //헤더알림 주문으로 이동
    public List<Orders> findNewOrdersByOwnerId(String ownerId) {
        return shopMapper.findNewOrdersByOwnerId(ownerId);
    }

}
