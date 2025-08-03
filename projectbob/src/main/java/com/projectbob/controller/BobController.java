package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.projectbob.domain.*;
import com.projectbob.domain.NewOrder;
import com.projectbob.service.*;

import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class BobController {

    private final WebsocketService websocketService;
	
    
    @Autowired
	private LoginController loginController;
	
	@Autowired
	private BobService bobService; // 가게 전체 게시글 리스트 요청을 처리하는 메서드
	

	@Autowired
	private LoginService loginService;


	
	@PostMapping("/getAddress")
	public ResponseEntity<Map<String, Object>> getAddresses(HttpSession session) {
	    Map<String, Object> responseBody = new HashMap<>();
	    String userId = (String) session.getAttribute("loginId");

	    System.out.println("[DEBUG] 세션 userId: " + userId);

	    if (userId == null || userId.trim().isEmpty()) {
	        responseBody.put("success", false);
	        responseBody.put("message", "로그인이 필요합니다.");
	        responseBody.put("addressList", Collections.emptyList());
	        return ResponseEntity.status(401).body(responseBody);
	    }

	    try {
	        List<Addressbook> addresses = bobService.getAddressesByUserId(userId);
	        System.out.println("[DEBUG] 조회된 주소 수: " + addresses.size());

	        // 디버그용 주소 상세 출력
	        addresses.forEach(addr -> System.out.printf("[DEBUG] 주소 no: %d, aName: %s, address1: %s, address2: %s%n",
	                addr.getNo(), addr.getAName(), addr.getAddress1(), addr.getAddress2()));

	        responseBody.put("success", true);
	        responseBody.put("message", "사용자 ID로 주소 조회 성공");
	        responseBody.put("addressList", addresses);
	        return ResponseEntity.ok(responseBody);
	    } catch (Exception e) {
	        System.err.println("주소 조회 중 오류 발생: " + e.getMessage());
	        responseBody.put("success", false);
	        responseBody.put("message", "주소 조회 중 서버 오류가 발생했습니다.");
	        responseBody.put("addressList", Collections.emptyList());
	        return ResponseEntity.internalServerError().body(responseBody);
	    }
	}


	@Autowired
    private ShopService shopService;
	
    BobController(LoginController loginController, WebsocketService websocketService) {
        this.loginController = loginController;
        this.websocketService = websocketService;
    }


	@GetMapping({"/", "/main"})
	public String Main() {		
		return "views/main";
	}
	
	@GetMapping("/end")
	public String completed(@RequestParam("orderId") int orderId, Model model) {
		
		NewOrder order = bobService.getNewOrder(orderId);
		model.addAttribute("order", order);
		return "views/completed";
	}
	
	@GetMapping("/ordercheckout")
	public String ordercheckout() {
		return "views/ordercheckout";
	}
	
	  @GetMapping("/shopList") 
	  public String shopList(@RequestParam(value="category",required=false,
			  	defaultValue="전체보기") String category,
			  @RequestParam(value="keyword", required= false, defaultValue="null")String keyword,
			  Model model,HttpSession session,
			  @RequestParam(value="address", required = false) String address) {
	  log.info("BobController: shopList() called, category={}", category); 
	  if (keyword == null || "null".equals(keyword)) keyword = "";
		if(category == null) category = "전체보기";
		 log.info("category = {}", category);
		 List<Shop> shopList = bobService.shopList(category,keyword);
		  		  
		  for (Shop shop : shopList) {
		      log.info("Shop in sList: sId={}, name={}", shop.getSId(), shop.getName());
		  }
	  model.addAttribute("sList",bobService.shopList(category,keyword));
	  model.addAttribute("selectedCategory", category);
	  model.addAttribute("userAddress", address);
	  
	  String loginId = (String) session.getAttribute("loginId");
	  if(loginId != null) {
		  List<Integer> likeShopList = bobService.getLikeShopList(loginId);
		  model.addAttribute("likeShopList", likeShopList);
	  }
	  
	  	return "views/shopList"; 
	  }


	  	// 가게 상세보기 메서드		
		  @GetMapping("/MenuDetail") 

		  public String getMenuDetail(Model model,HttpSession session,	  
		  @RequestParam("sId") int sId) {
		  log.info("BobController: /MenuDetail 호출. 요청 s_id: {}", sId); // 가게 정보 가져오기
		  session.setAttribute("lastShopId", sId);
		  
		  Shop shop = bobService.getShopDetail(sId);
		  
		  if (shop != null) {
		      log.info("BobController: getMenuDetail - Retrieved shop sId: {}", shop.getSId());
		  } else {
		      log.warn("BobController: getMenuDetail - No shop found for sId: {}", sId);
		  }
		  
		  List<Menu> menuList = bobService.getMenuListByShopId(sId);
		  model.addAttribute("shop", shop);
		  model.addAttribute("menuList", menuList);
		  
		  List<Review> reviewList = bobService.getReviewList(sId);
		  model.addAttribute("reviewList", reviewList);
		  
		  Map<Integer, Menu> menuCalMap = new HashMap<>();
		  for (Menu menu : menuList) {
		      Menu menuCal = bobService.getMenuCal(menu.getMId());
		      if (menuCal != null) {
		    	  menuCalMap.put(menu.getMId(), menuCal);
		      }
		  }
		  model.addAttribute("menuCalMap", menuCalMap);
		  
		  // 회원 정보 세팅
		  String loginId = (String) session.getAttribute("loginId");
		  Member member = null;
		  if(loginId != null) {
			  member = loginService.getMember(loginId);
		  }
		 model.addAttribute("member", member);
		 
		 // 회원이 해당 가게에서 주문한 내역이 있는지 확인
		 boolean hasOrdered = false;
		 if (loginId != null) {
			 hasOrdered = bobService.hasUserOrderedFromShop(loginId, sId);
		 }
		 model.addAttribute("hasOrdered", hasOrdered);
		  
		 // 찜
		 boolean liked = false;
		 if(member != null) {
			 LikeList likeDto = new LikeList();
			 likeDto.setId(loginId);
			 likeDto.setSId(sId);
			 liked = bobService.isLiked(likeDto) > 0;			 
		 }
		 model.addAttribute("liked", liked);
		 model.addAttribute("heartCount", shop.getHeart());
		 
		 // 리뷰 탭
		  double reviewAvg = 0.0;
		  if (!reviewList.isEmpty()) {
			  reviewAvg = reviewList.stream().mapToInt(Review::getRating).average().orElse(0.0);			  
		  }
		  model.addAttribute("reviewAvg", reviewAvg);
		  

		  model.addAttribute("now", System.currentTimeMillis());
		  		  
		 Map<Integer, ReviewReply> reviewReplyMap = bobService.getReviewReplyMap(sId);
		 model.addAttribute("reviewReplyMap", reviewReplyMap);
		 
		  String userId = (String) session.getAttribute("loginId");
		    String guestId = (String) session.getAttribute("guestId"); // 비회원 guestId

		    CartSummaryDto cartSummary = bobService.getCartByUser(userId, guestId);

		  List<Cart> cartList = cartSummary.getCartList();
		  int totalQuantity = cartSummary.getTotalQuantity();
		  int totalPrice = cartSummary.getTotalPrice();
		    
		  model.addAttribute("cartList",cartList);
		  model.addAttribute("totalQuantity",totalQuantity);
		  model.addAttribute("totalPrice",totalPrice);
		  log.info("장바구니 총 수량: {}, 총액: {}", totalQuantity, totalPrice); 
		 
		  
		 List<String> openLines = shopService.buildOpenTextLines(shop);
         model.addAttribute("openLines", openLines);
		 
		  return "views/MenuDetail"; 
		  }
		  
	// 모달창 메뉴옵션보기 메서드
		  @GetMapping("/menuOptions")
		  @ResponseBody
		  public List<MenuOption> menuOptions(@RequestParam("mId") int mId){
			  return bobService.getMenuOptionsByMenuId(mId);
		  }
		  

		  //주문표에 담아서 주문하기 페이지로
		  @GetMapping("/pay")
		  public String payPageGet(HttpSession session, Model model) {
		      String userId = (String) session.getAttribute("loginId");
		      String guestId = (String) session.getAttribute("guestId");

		      // 로그인한 사용자 정보 조회 및 모델에 추가
		      if (userId != null) {
		          Member member = loginService.getMember(userId); // LoginService에 getMember(String id) 메서드 필요
		          log.info("Pay Page - Retrieved Member: {}", member); // 이 로그를 추가
		          model.addAttribute("member", member);
		          // session.removeAttribute("guestId"); // 로그인한 사용자가 있다면 guestId 제거
		      }

		      // 세션 기준 주문 내역 조회
		      CartSummaryDto cartSummary = bobService.getCartSummaryForUserOrGuest(userId, guestId);

			  log.info("Pay Page - Total Price from Service: {}", cartSummary.getTotalPrice());

		      // 뷰에 데이터 전달
		      model.addAttribute("orderSummary", cartSummary);
		      model.addAttribute("orderedItems", cartSummary.getCartList());
		      model.addAttribute("finalTotalPrice", cartSummary.getTotalPrice());

		      return "views/pay";
		  }
		  
		  //스크립트ajax
		  @PostMapping("/payjs")
			@ResponseBody
			public ResponseEntity<Map<String, Object>> payJsPage(@RequestBody OrderData orderData, HttpSession session) {
			    String userId = (String) session.getAttribute("loginId");
			    String guestId = (String) session.getAttribute("guestId");

			    // 주문 처리 (DB 저장)
			    bobService.processAndAddCartItems(orderData.getCartList(), userId, guestId);

			    Map<String, Object> response = new HashMap<>();
			    response.put("success", true);
			    response.put("redirectUrl", "/pay");

			    return ResponseEntity.ok(response);
			}
		
    @Autowired
	private PortoneService portoneService; // PortoneService 의존성 주입

    @PostMapping("/preparePayment")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> preparePayment(@RequestBody Map<String, Object> requestData, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userId = (String) session.getAttribute("loginId");
            String guestId = (String) session.getAttribute("guestId");

            // BobService를 통해 현재 장바구니 정보 가져오기
            CartSummaryDto cartSummary = bobService.getCartSummaryForUserOrGuest(userId, guestId);
            if (cartSummary == null || cartSummary.getCartList().isEmpty()) {
                response.put("success", false);
                response.put("message", "장바구니가 비어있습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // PortoneService를 통해 결제 준비 (가상의 서비스 호출)
            // 실제 구현에서는 PortoneService가 PortOne API를 호출하고 필요한 정보를 반환합니다.
            Map<String, Object> paymentInfo = portoneService.preparePayment(
                cartSummary.getTotalPrice(), // 총 결제 금액
                "주문 상품명", // 실제 상품명으로 대체 필요
                userId != null ? userId : guestId, // 주문자 ID
                (String) requestData.get("address1"),
                (String) requestData.get("address2"),
                (String) requestData.get("phone"),
                (String) requestData.get("orderRequest")
            );

            response.put("success", true);
            response.put("paymentData", paymentInfo); // PortOne SDK에 전달할 데이터
            response.put("orderId", "ORDER_" + System.currentTimeMillis()); // 임시 주문 ID (실제로는 DB에서 생성)

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("결제 준비 중 오류 발생: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "결제 준비 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/completePayment")
    @ResponseBody
    public Map<String, Object> completePayment(@RequestBody Map<String, Object> req, HttpSession session) {
        String userId = (String) session.getAttribute("loginId");
        String guestId = (String) session.getAttribute("guestId");
        log.info("completePayment - userId: {}, guestId: {}", userId, guestId);
    	boolean verified = portoneService.verifyPayment(
    			(String) req.get("paymentId"),
    			(String) req.get("orderId")
    			);
                if (!verified) {
                	return Map.of("success", false, "message", "결제 검증 실패");
                }
                int newOrderNo = bobService.createOrder(req, session, (String) req.get("paymentId"));
                
                //장바구니 비우기
                bobService.deleteAllCartItems(
                		(String) session.getAttribute("userId"),
                		(String) session.getAttribute("guestId")
                		);

            return Map.of("success", true, "orderNo", newOrderNo);
        }
    }


