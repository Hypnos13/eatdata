package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;
import org.springframework.http.*;

import java.util.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Year;

import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.projectbob.domain.*;
import com.projectbob.domain.statistics.*;
import com.projectbob.mapper.ShopMapper;
import com.projectbob.service.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class ShopController {

    private final WebsocketService websocketService;
    private final PortoneService portoneService; 

	@Autowired
	private ShopService shopService;

	@Autowired
	private ShopMapper shopMapper;

	@Autowired
	private BobService bobService;

	@Autowired
	private FileUploadService fileUploadService;

	@Autowired
    private SimpMessagingTemplate messagingTemplate;
	
	@Autowired
    private ObjectMapper objectMapper;

    ShopController(WebsocketService websocketService, PortoneService portoneService) {
        this.websocketService = websocketService;
        this.portoneService = portoneService;
    }
	
	// 식품영양성분DB API 검색
	@GetMapping("/api/nutrition-search")
	@ResponseBody
	public ResponseEntity<?> searchNutritionData(@RequestParam("foodName") String foodName) {
		String serviceKey = "25HM7lP49D4X9CnOWL0S6Ec9UnBOQh5/T5rfLzXtv7qn0Wzg+grCn9czsAmSwvR1rjdFDY8h3GxkPLoSZeuglA==";

		// ✨ 1. 최종적으로 확인된, 가장 단순한 형태의 실제 서비스 URL
		String apiUrl = "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02";

		try {
			String encodedServiceKey = URLEncoder.encode(serviceKey, StandardCharsets.UTF_8);
			String encodedFoodName = URLEncoder.encode(foodName, StandardCharsets.UTF_8);

			// ✨ 2. 검색 파라미터 이름을 'desc_kor'에서 'FOOD_NM_KR'로 변경
			String finalUrlString = apiUrl + "?serviceKey=" + encodedServiceKey + "&FOOD_NM_KR=" + encodedFoodName // ✨
																													// 파라미터
																													// 이름
																													// 수정
					+ "&pageNo=1" + "&numOfRows=20" + "&type=json";

			log.info("▶▶▶ 최종 요청 URL: {}", finalUrlString);

			HttpClient client = HttpClient.newHttpClient();
			HttpRequest request = HttpRequest.newBuilder().uri(new URI(finalUrlString)).GET().build();

			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

			log.info("◀◀◀ API 응답: {}", response.body());

			HttpHeaders responseHeaders = new HttpHeaders();
			responseHeaders.setContentType(MediaType.APPLICATION_JSON);
			return new ResponseEntity<>(response.body(), responseHeaders, HttpStatus.OK);

		} catch (Exception e) {
			log.error("!!! 식약처 API 호출 오류", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"error\":\"API 호출 중 오류 발생\"}");
		}
	}

	// 입점 신청
	@PostMapping("/insertShop")
	public String insertShop( @RequestParam("id") String id,
	        @RequestParam("sNumber") String sNumber, @RequestParam("owner") String owner, 
	        @RequestParam("phone") String phone, @RequestParam("name") String name, 
	        @RequestParam("zipcode") String zipcode, @RequestParam("address1") String address1, 
	        @RequestParam("address2") String address2, @RequestParam("sPicture") MultipartFile sPictureFile, 
	        @RequestParam("sLicense") MultipartFile sLicenseFile, Model model ) { 

	    String sLicenseUrl = null;
	    String sPictureUrl = null;

	    try {
	        // 1. 사업자 등록증 파일이 비어있지 않을 때만 업로드
	        if (sLicenseFile != null && !sLicenseFile.isEmpty()) {
	            sLicenseUrl = fileUploadService.uploadFile(sLicenseFile, "business-licenses/");
	            log.info("사업자등록증 업로드 성공. URL: {}", sLicenseUrl);
	        }
	        
	        // 2. 가게 사진 파일이 비어있지 않을 때만 업로드
	        if (sPictureFile != null && !sPictureFile.isEmpty()) {
	            sPictureUrl = fileUploadService.uploadFile(sPictureFile, "shop/");
	            log.info("가게 사진 업로드 성공. URL: {}", sPictureUrl);
	        }

	    } catch (IOException e) {
	        log.error("파일 업로드 중 IOException 발생", e);
	        model.addAttribute("errorMessage", "파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
	        return "/shop/shopJoinForm";
	    }
	    
	    Shop shop = new Shop();
	    shop.setId(id);
	    shop.setSNumber(sNumber);
	    shop.setOwner(owner);
	    shop.setPhone(phone);
	    shop.setName(name);
	    shop.setZipcode(zipcode);
	    shop.setAddress1(address1);
	    shop.setAddress2(address2);
	    shop.setSPictureUrl(sPictureUrl);
	    shop.setSLicenseUrl(sLicenseUrl);
	    shopService.insertShop(shop);

	    model.addAttribute("message", "가게 정보가 성공적으로 등록되었습니다.");
	    return "redirect:shopMain";
	}
	
	//배달 대행 요청
	@GetMapping("/shop/delivery")
	public String deliveryDispatchPage(
	        @SessionAttribute(name = "loginId", required = false) String loginId,
	        @SessionAttribute(name = "currentSId", required = false) Integer sId,
	        Model model) {

	    if (loginId == null || sId == null) {
	        return "redirect:/login";
	    }

	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    if (currentShop == null) {
	        return "redirect:/shopMain";
	    }
	    
	    List<Orders> waitingOrders = bobService.findOrdersByStatusAndShop("ACCEPTED", sId);
	    Orders selectedOrder = waitingOrders.isEmpty() ? null : waitingOrders.get(0);
	    List<String> deliveryAgencies = Arrays.asList("생각대로", "바로고", "부릉", "기타");

	    try {
	        String shopJson = objectMapper.writeValueAsString(currentShop);
	        String waitingOrdersJson = objectMapper.writeValueAsString(waitingOrders);

	        model.addAttribute("shopJson", shopJson);
	        model.addAttribute("waitingOrdersJson", waitingOrdersJson);
	    } catch (Exception e) {
	        log.error("JSON 변환 오류", e);
	        model.addAttribute("shopJson", "{}");
	        model.addAttribute("waitingOrdersJson", "[]");
	    }

	    model.addAttribute("shop", currentShop);
	    model.addAttribute("waitingOrders", waitingOrders);
	    model.addAttribute("selectedOrder", selectedOrder);
	    model.addAttribute("deliveryAgencies", deliveryAgencies);

	    return "shop/delivery"; 
	}
	//라이더 페이지
	@GetMapping("/rider/request")
	public String riderRequestPage() {
	    return "rider/rider_request";
	}
	
	// 배차요청
	// ShopController.java

	@PostMapping("/shop/orders/{orderId}/dispatch")
	@ResponseBody
	public ResponseEntity<?> dispatchOrder(
	        @PathVariable("orderId") int orderId,
	        @RequestBody Map<String, String> payload,
	        @SessionAttribute("loginId") String loginId,
	        @SessionAttribute("currentSId") Integer sId) {

	    log.info(">>>>>>>>>>>>> ✅✅✅ 최종 수정된 dispatchOrder 메서드 실행됨! ✅✅✅ <<<<<<<<<<<<<");

	    // findByOwnerId(loginId) 호출은 완전히 삭제되어야 합니다.
	    
	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    Orders order = bobService.findOrderByONo((long)orderId);

	    if (currentShop == null || order == null || order.getSId() != currentShop.getSId()) {
	        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "권한이 없습니다."));
	    }

	    String pickupTimeStr = payload.get("pickupTime");
	    String deliveryTimeStr = payload.get("deliveryTime");
	    
	    DispatchInfo dispatchInfo = new DispatchInfo(
	        order.getONo(),
	        currentShop.getSId(),
	        currentShop.getName(),
	        currentShop.getAddress1() + " " + currentShop.getAddress2(),
	        currentShop.getPhone(),
	        order.getOAddress(),
	        order.getClientPhone(),
	        pickupTimeStr,
	        deliveryTimeStr,
	        "DISPATCH_REQUEST"
	    );

	    websocketService.sendDispatchToRiders(dispatchInfo);
	    
	    return ResponseEntity.ok(Map.of("success", true, "message", "배차를 요청했습니다."));
	}
	
	/**
	 * [통계] 가게 주인을 위한 통계 페이지를 보여줍니다.
	 * @param sId 세션에서 가져온 현재 가게 ID
	 * @param loginId 세션에서 가져온 로그인 ID
	 * @param model View에 데이터를 전달하기 위한 객체
	 * @return 통계 페이지 view 이름
	 */
	@GetMapping("/shop/statistics")
	public String statisticsPage(@SessionAttribute(name = "currentSId") Integer sId,
	                             @SessionAttribute(name = "loginId") String loginId,
	                             Model model) {
	    
	    // 현재 가게 정보와 가게 목록을 모델에 추가 (레이아웃 등에서 필요)
	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);
	    model.addAttribute("currentShop", currentShop);
	    model.addAttribute("shopListMain", shopListMain);
	    
	    // 현재 연도를 모델에 추가하여 View에서 사용할 수 있게 함
	    model.addAttribute("currentYear", Year.now().getValue());
	    
	    return "shop/statistics"; // `resources/templates/shop/statistics.html` 파일을 가리킴
	}

	/**
	 * [API] 월별 매출 통계 데이터를 JSON 형태로 제공합니다.
	 * @param sId 세션에서 가져온 현재 가게 ID
	 * @param year 조회할 연도 (기본값: 현재 연도)
	 * @return 월별 매출 데이터 리스트를 담은 ResponseEntity
	 */
	@GetMapping("/api/shop/statistics/monthly-sales")
	@ResponseBody
	public ResponseEntity<List<MonthlySalesDto>> getMonthlySalesData(
	                                @SessionAttribute(name = "currentSId") Integer sId,
	                                @RequestParam(value = "year", defaultValue = "0") int year) {
	    
	    // year 파라미터가 없으면 현재 연도로 설정
	    if (year == 0) {
	        year = Year.now().getValue();
	    }
	    
	    List<MonthlySalesDto> salesData = shopService.getMonthlySalesStats(sId, year);
	    return ResponseEntity.ok(salesData);
	}

	/**
	 * [API] 메뉴별 주문 횟수(인기) 통계 데이터를 JSON 형태로 제공합니다.
	 * @param sId 세션에서 가져온 현재 가게 ID
	 * @return 메뉴별 주문 횟수 데이터 리스트를 담은 ResponseEntity
	 */
	@GetMapping("/api/shop/statistics/menu-popularity")
	@ResponseBody
	public ResponseEntity<List<MenuPopularityDto>> getMenuPopularityData(
	                                @SessionAttribute(name = "currentSId") Integer sId) {
	    
	    List<MenuPopularityDto> popularityData = shopService.getMenuPopularityStats(sId);
	    return ResponseEntity.ok(popularityData);
	}
	
	/* ----------------------- 메인 ----------------------- */
	@GetMapping("/shopMain")
	public String shopMain(
	    @RequestParam(value = "s_id", required = false) Integer sId,
	    @SessionAttribute(name = "loginId", required = false) String loginId,
	    HttpSession session, Model model) {

	    boolean isLogin = (loginId != null);
	    List<Shop> shopListMain = isLogin ? shopService.findShopListByOwnerId(loginId) : Collections.emptyList();
	    boolean hasShop = !shopListMain.isEmpty();
	    Shop currentShop = hasShop ? resolveCurrentShop(sId, loginId, session, shopListMain) : null;

	    model.addAttribute("isLogin", isLogin);
	    model.addAttribute("hasShop", hasShop);
	    model.addAttribute("shopListMain", shopListMain);
	    model.addAttribute("currentShop", currentShop);
	    model.addAttribute("shopCnt", shopListMain.size());
	    model.addAttribute("selectedSid", (currentShop != null) ? currentShop.getSId() : null);

	    List<Orders> newOrders = isLogin ? shopService.findNewOrdersByOwner(loginId) : Collections.emptyList();
	    model.addAttribute("newOrders", newOrders);

	    // 👇 notifies를 빈 리스트라도 무조건 추가!
	    model.addAttribute("notifies", Collections.emptyList());

	    return "shop/shopMain";
	}

	/** 선택 가게 세션 저장 및 반환 */
	private Shop resolveCurrentShop(Integer sId, String loginId, HttpSession session, List<Shop> shopList) {
		if (loginId == null || shopList == null || shopList.isEmpty())
			return null;

		if (sId != null) { // 1) 요청 파라미터 우선
			session.setAttribute("currentSId", sId);
		}

		Integer cur = (Integer) session.getAttribute("currentSId");
		if (cur != null) {
			for (Shop s : shopList) {
				if (s.getSId() == cur) { // <-- 여기!
					return s;
				}
			}
		}
		// 3) 기본값: 첫 번째
		Shop first = shopList.get(0);
		session.setAttribute("currentSId", first.getSId());
		return first;
	}

	/* 현재 선택 가게 변경용 */
	@GetMapping("/selectShop")
	public String selectShop(@RequestParam("s_id") Integer sId,
			@SessionAttribute(name = "loginId", required = false) String loginId, HttpSession session,
			@RequestHeader(value = "Referer", required = false) String referer) {
		if (loginId == null)
			return "redirect:/login";
		Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
		if (shop != null)
			session.setAttribute("currentSId", sId);
		return "redirect:" + (referer != null ? referer : "/shopMain");
	}

	/* ----------------------- 가게 가입/안내 ----------------------- */
	@GetMapping("/shopJoinForm")
	public String shopJoinForm(Model model) {
		model.addAttribute("shop", new Shop());
		return "shop/shopJoinForm";
	}

	@GetMapping("/shopInfo")
	public String shopInfo() {
		return "shop/shopInfo";
	}

	/* ----------------------- 기본정보 뷰/수정 ----------------------- */
	@GetMapping("/shopBasicView")
	public String shopBasicView(@RequestParam(value = "s_id", required = false) Integer sId,
			@SessionAttribute(name = "loginId", required = false) String loginId, HttpSession session, Model model) {
		if (loginId == null)
			return "redirect:/login";

		List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
		Shop currentShop = resolveCurrentShop(sId, loginId, session, shopList);
		if (currentShop == null) {
			model.addAttribute("errorMessage", "가게 정보를 찾을 수 없습니다.");
			return "redirect:/shopMain";
		}
		
		model.addAttribute("shop", currentShop);
		model.addAttribute("currentShop", currentShop);
		Shop fullShop = shopService.findByShopIdAndOwnerId(currentShop.getSId(), loginId);
	    model.addAttribute("shop", fullShop);
	    
		return "shop/shopBasicView";
	}

	// 기본설정 수정(폼) 페이지
	@GetMapping("/shopBasicSet")
	public String shopBasicSet(@RequestParam(value = "s_id", required = false) Integer sId,
			@SessionAttribute(name = "loginId", required = false) String loginId, HttpSession session, Model model) {
		if (loginId == null)
			return "redirect:/login";

		List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
		Shop currentShop = resolveCurrentShop(sId, loginId, session, shopList);
		if (currentShop == null)
			return "redirect:/shopMain";

		Shop fullShop = shopService.findByShopIdAndOwnerId(currentShop.getSId(), loginId);
	    model.addAttribute("shop", fullShop);
	    model.addAttribute("currentShop", fullShop);
	    return "shop/shopBasicSet";
	}

	// 기본정보 수정 로직
	@PostMapping("/shop/updateBasic")
	public String updateBasicInfo(@SessionAttribute(name = "loginId", required = false) String loginId,
			@ModelAttribute Shop shop, @RequestParam(value = "sPicture", required = false) MultipartFile sPictureFile,
			@RequestParam(value = "sLicense", required = false) MultipartFile sLicenseFile, Model model)
			throws IOException {

		// 0) 로그인 체크
		if (loginId == null) {
			return "redirect:/login";
		}

		// 1) 기존 Shop 조회 (소유권 검증 포함)
		Shop existing = shopService.findByShopIdAndOwnerId(shop.getSId(), loginId);
		if (existing == null) {
			model.addAttribute("errorMessage", "가게 정보를 찾을 수 없습니다.");
			return "shop/shopBasicSet";
		}

		// 2) 파일 업로드 처리 & 기존 URL 복원
		try {
			// 가게 사진
			if (sPictureFile != null && !sPictureFile.isEmpty()) {
				String picUrl = fileUploadService.uploadFile(sPictureFile, "shop");
				shop.setSPictureUrl(picUrl);
			} else {
				// 업로드 없으면 기존 URL 유지
				shop.setSPictureUrl(existing.getSPictureUrl());
			}
			// 사업자등록증
			if (sLicenseFile != null && !sLicenseFile.isEmpty()) {
				String licUrl = fileUploadService.uploadFile(sLicenseFile, "business-licenses");
				shop.setSLicenseUrl(licUrl);
			} else {
				shop.setSLicenseUrl(existing.getSLicenseUrl());
			}
		} catch (IllegalArgumentException e) {
			model.addAttribute("errorMessage", e.getMessage());
			return "shop/shopBasicSet";
		}

		// 3) 수정 일시 세팅
		shop.setModiDate(new Timestamp(System.currentTimeMillis()));

		// 4) DB 업데이트
		shopService.updateShopBasicInfo(shop);

		// 5) 리다이렉트
		return "redirect:/shopBasicView?s_id=" + shop.getSId();
	}

	/* ----------------------- 내 가게 리스트 ----------------------- */
	@GetMapping("/shopListMain")
	public String shopListMain(Model model, @SessionAttribute(name = "loginId", required = false) String loginId,
			@RequestParam(value = "s_id", required = false) Integer sId, HttpSession session) {

		// 0) 로그인 체크
		if (loginId == null) {
			return "redirect:/login";
		}

		// 1) 사장님이 가진 가게 목록 조회
		List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);
		if (shopListMain.isEmpty()) {
			return "shop/shopInfo";
		}

		// 2) currentShop 결정 (세션 또는 파라미터 기반)
		Shop currentShop = resolveCurrentShop(sId, loginId, session, shopListMain);

		// 3) 메뉴 개수 맵 생성
		Map<Integer, Integer> menuCountMap = new HashMap<>();
		for (Shop shop : shopListMain) {
			menuCountMap.put(shop.getSId(), shopService.getMenuCount(shop.getSId()));
		}

		// 4) 모델에 담기
		model.addAttribute("shopListMain", shopListMain);
		model.addAttribute("currentShop", currentShop);
		model.addAttribute("menuCountMap", menuCountMap);

		return "shop/shopListMain";
	}

	/* ----------------------- 영업 상태 ----------------------- */
	@PostMapping("/shop/updateStatus")
	@ResponseBody
	public String updateShopStatusAjax(@RequestBody Map<String, Object> param,
			@SessionAttribute(name = "loginId", required = false) String loginId) {
		if (loginId == null)
			return "NOT_LOGIN";
		Integer sId = Integer.parseInt(param.get("sId").toString());
		String status = param.get("status").toString();
		shopService.updateShopStatus(sId, status);
		return "OK";
	}

	/* ----------------------- 영업시간 ----------------------- */
	@GetMapping("/shopOpenTime")
	public String shopOpenTime(@SessionAttribute(name = "loginId", required = false) String loginId,
			@ModelAttribute("message") String message, @ModelAttribute("currentShop") Shop shop, Model model) {

		if (loginId == null)
			return "redirect:/login";
		if (shop == null) {
			model.addAttribute("message", "가게를 찾을 수 없습니다.");
			return "shop/errorPage";
		}

		List<String[]> raw = shopService.getOpenTimeList(shop);
		while (raw.size() < 7)
			raw.add(new String[] { "-", "" });

		List<String> oH = new ArrayList<>(), oM = new ArrayList<>();
		List<String> cH = new ArrayList<>(), cM = new ArrayList<>();
		List<String> isOpenList = new ArrayList<>();

		for (String[] t : raw) {
			String open = t[0], close = t[1];
			boolean closed = (open == null) || open.equals("휴무") || open.equals("-") || open.isBlank();

			if (closed) {
				oH.add("");
				oM.add("");
				cH.add("");
				cM.add("");
				isOpenList.add("0");
			} else {
				oH.add(open.substring(0, 2));
				oM.add(open.substring(3, 5));
				cH.add(close.substring(0, 2));
				cM.add(close.substring(3, 5));
				isOpenList.add("1");
			}
		}

		model.addAttribute("shop", shop);
		model.addAttribute("daysOfWeek", Arrays.asList("월", "화", "수", "목", "금", "토", "일"));
		model.addAttribute("oH", oH);
		model.addAttribute("oM", oM);
		model.addAttribute("cH", cH);
		model.addAttribute("cM", cM);
		model.addAttribute("isOpenList", isOpenList);
		if (message != null && !message.isBlank())
			model.addAttribute("message", message);

		return "shop/shopOpenTime";
	}

	// 영업시간 업데이트
	@PostMapping("/shopOpenTimeUpdate")
	public String shopOpenTimeUpdate(@ModelAttribute("currentShop") Shop shop,
			@RequestParam("openHour") String[] openHour, @RequestParam("openMin") String[] openMin,
			@RequestParam("closeHour") String[] closeHour, @RequestParam("closeMin") String[] closeMin,
			@RequestParam MultiValueMap<String, String> isOpenMap,
			@SessionAttribute(name = "loginId", required = false) String loginId, RedirectAttributes ra) {

		if (loginId == null) {
			return "redirect:/login";
		}
		if (shop == null) {
			ra.addFlashAttribute("message", "가게를 찾을 수 없습니다.");
			return "redirect:/shopOpenTime";
		}

		// offDay, opTime 문자열 조립
		StringBuilder offDay = new StringBuilder();
		StringBuilder opTime = new StringBuilder();
		for (int i = 0; i < 7; i++) {
			String flag = Optional.ofNullable(isOpenMap.get("isOpen[" + i + "]")).filter(l -> !l.isEmpty())
					.map(l -> l.get(l.size() - 1)).orElse("0");
			if (!"1".equals(flag)) {
				offDay.append(i).append(',');
				opTime.append("-,").append("-;");
			} else {
				String oh = val(openHour, i, "");
				String om = val(openMin, i, "");
				String ch = val(closeHour, i, "");
				String cm = val(closeMin, i, "");
				if (oh.isBlank() || om.isBlank() || ch.isBlank() || cm.isBlank()) {
					offDay.append(i).append(',');
					opTime.append("-,").append("-;");
				} else {
					opTime.append(oh).append(':').append(om).append(',').append(ch).append(':').append(cm).append(';');
				}
			}
		}
		if (offDay.length() > 0)
			offDay.setLength(offDay.length() - 1);
		if (opTime.length() > 0)
			opTime.setLength(opTime.length() - 1);

		// Shop 엔티티에 반영 후 저장
		shop.setOffDay(offDay.toString());
		shop.setOpTime(opTime.toString());
		shopService.updateShopOpenTime(shop);

		ra.addFlashAttribute("message", "영업시간 정보가 저장되었습니다.");
		return "redirect:/shopOpenTime?s_id=" + shop.getSId();
	}

	/** 배열 방어 */
	private String val(String[] arr, int idx, String def) {
		return (arr != null && idx < arr.length && arr[idx] != null) ? arr[idx] : def;
	}

	// 가게 운영상태 변경 요청
	@PostMapping("/shop/statusUpdate")
	@ResponseBody
	public String updateShopStatus(@RequestParam("sId") Integer sId, @RequestParam("status") String status,
			@SessionAttribute(name = "loginId", required = false) String loginId) {
		if (loginId == null)
			return "NOT_LOGIN";
		// (추가: 로그인한 사용자의 가게만 수정 가능하게 검증해도 됨)
		shopService.updateShopStatus(sId, status);
		return "OK";
	}

	// 가게 리스트 가져오기
	@GetMapping("/shopStatus")
	public String shopStatusPage(@SessionAttribute(name = "loginId", required = false) String loginId, Model model) {
		if (loginId == null)
			return "redirect:/login";
		List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
		model.addAttribute("shopList", shopList);
		if (!shopList.isEmpty()) {
			model.addAttribute("shop", shopList.get(0)); // 또는 선택된 가게
		}
		return "shop/shopStatus";
	}

	// ── 사장님 공지 보기 ─────────────────────────────
	@GetMapping("/shopNotice")
	public String showNotice(@ModelAttribute("currentShop") Shop shop,
			@SessionAttribute(name = "loginId", required = false) String loginId, Model model) {

		if (loginId == null)
			return "redirect:/login";
		if (shop == null) {
			model.addAttribute("errorMessage", "권한이 없거나 가게를 찾을 수 없습니다.");
			return "shop/errorPage";
		}

		model.addAttribute("shop", shop);
		return "shop/shopNotice";
	}

	// ── 사장님 공지 & 가게소개 & 최소주문금액 저장 ─────────────────────────────
	@PostMapping("/shopNotice")
	public String updateNotice(@RequestParam("s_id") Integer sId,
			@RequestParam(value = "notice", required = false) String notice,
			@RequestParam(value = "s_info", required = false) String sInfo, @RequestParam("action") String action,
			@RequestParam(value = "minPrice", required = false) String minPrice,
			@SessionAttribute(name = "loginId", required = false) String loginId, RedirectAttributes ra) {

		if (loginId == null) {
			return "redirect:/login";
		}

		// 권한 확인
		Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
		if (shop == null) {
			ra.addFlashAttribute("errorMessage", "권한이 없거나 가게를 찾을 수 없습니다.");
			return "redirect:/shopNotice?s_id=" + sId;
		}

		if ("notice".equals(action)) {
			shopService.updateShopNotice(sId, notice);
			ra.addFlashAttribute("message", "공지사항이 저장되었습니다.");
		} else if ("info".equals(action)) {
			shopService.updateShopInfo(sId, sInfo);
			ra.addFlashAttribute("message", "가게소개가 저장되었습니다.");
		} else if ("minPrice".equals(action)) {
			shopService.updateShopMinPrice(sId, minPrice);
			ra.addFlashAttribute("message", "최소 금액이 저장되었습니다.");
		}

		return "redirect:/shopNotice?s_id=" + sId;
	}

	// ── 리뷰 관리 화면 (페이징 지원) ─────────────────────────────
	@GetMapping("/shop/reviewManage")
	public String shopReviewManage(@SessionAttribute(name = "loginId", required = false) String loginId,
			@RequestParam("s_id") Integer sId, @RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, HttpSession session, Model model) {

		if (loginId == null) {
			return "redirect:/login";
		}

		// 1) 사장님 가게 목록 & currentShop 결정
		List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);
		if (shopListMain.isEmpty()) {
			return "redirect:/shopInfo";
		}
		Shop currentShop = resolveCurrentShop(sId, loginId, session, shopListMain);
		if (currentShop == null) {
			return "redirect:/shopMain";
		}

		// 2) 전체 리뷰 개수 & 총 페이지 수
		int totalReviews = shopService.countReviewsByShopId(currentShop.getSId());
		int totalPages = (int) Math.ceil((double) totalReviews / size);
		// 페이지번호 범위 안전 처리
		page = Math.max(1, Math.min(page, totalPages));

		// 3) 페이징된 리뷰+답글 조회
		List<Review> reviews = shopService.getReviewsWithRepliesPaged(currentShop.getSId(), page, size);

		// 4) 페이지 그룹 (1~10, 11~20…)
		int groupSize = 10;
		int startPageGroup = ((page - 1) / groupSize) * groupSize + 1;
		int endPageGroup = Math.min(startPageGroup + groupSize - 1, totalPages);

		// 5) 모델에 담기
		model.addAttribute("shopListMain", shopListMain);
		model.addAttribute("currentShop", currentShop);
		model.addAttribute("shop", currentShop);
		model.addAttribute("reviews", reviews);
		model.addAttribute("currentPage", page);
		model.addAttribute("pageSize", size);
		model.addAttribute("totalReviews", totalReviews);
		model.addAttribute("totalPages", totalPages);
		model.addAttribute("startPageGroup", startPageGroup);
		model.addAttribute("endPageGroup", endPageGroup);

		return "shop/shopReviewManage";
	}

	// 리뷰 등록
	@PostMapping("/review/add")
	public String addReview(@ModelAttribute Review review, RedirectAttributes ra) {
		review.setStatus("일반");
		bobService.addReview(review);
		ra.addFlashAttribute("msg", "리뷰가 등록되었습니다.");
		return "redirect:/shop/reviewManage?s_id=" + review.getSId();
	}

	// ② 답글 등록 처리
	@PostMapping("/shop/review/reply")
	public String postReviewReply(@SessionAttribute(name = "loginId") String loginId, @ModelAttribute ReviewReply reply,
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, RedirectAttributes ra) {

		// 로그인 체크
		if (loginId == null) {
			return "redirect:/login";
		}

		// 소유권 검증
		Shop shop = shopService.findByShopIdAndOwnerId(reply.getSId(), loginId);
		if (shop == null) {
			ra.addFlashAttribute("error", "권한이 없습니다.");
			return "redirect:/shopMain";
		}

		// 답글 작성자 세팅
		reply.setId(loginId);
		shopService.addReply(reply);

		ra.addFlashAttribute("msg", "답글이 등록되었습니다.");
		return "redirect:/shop/reviewManage" + "?s_id=" + reply.getSId() + "&page=" + page + "&size=" + size
				+ "#review-" + reply.getRNo();
	}

	// 답글 수정 처리
	@PostMapping("/shop/review/reply/update")
	public String updateReviewReply(@ModelAttribute ReviewReply reply, RedirectAttributes ra) {
		shopService.updateReply(reply);
		ra.addFlashAttribute("msg", "답글이 수정되었습니다.");
		// 수정 후 다시 관리 페이지로
		return "redirect:/shop/reviewManage?s_id=" + reply.getSId();
	}

	// 답글 삭제 처리
	@PostMapping("/shop/review/reply/delete")
	public String deleteReviewReply(@RequestParam("rrNo") int rrNo, @RequestParam("sId") int sId,
			RedirectAttributes ra) {
		shopService.deleteReply(rrNo);
		ra.addFlashAttribute("msg", "답글이 삭제되었습니다.");
		return "redirect:/shop/reviewManage?s_id=" + sId;
	}

	/* ----------------------- 신규주문 ----------------------- */
	@GetMapping("/shop/newOrders")
	public String newOrders(
	        @SessionAttribute(name = "currentSId", required = false) Integer sId,
	        @SessionAttribute(name = "loginId", required = false) String loginId,
	        HttpSession session,
	        Model model) {

	    // 1) 인증/세션 체크
	    if (loginId == null || sId == null) {
	        return "redirect:/login";
	    }

	    // 2) 나의 가게 목록 & currentShop 세팅 (layout에서 사용하는 속성)
	    List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);
	    model.addAttribute("shopListMain", shopListMain);

	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    model.addAttribute("currentShop", currentShop);

	    // 3) 신규 주문 리스트
	    List<Orders> orders = shopService.findOrdersByStatusAndShop("PENDING", sId);
	    model.addAttribute("orders", orders);
	    if (!orders.isEmpty()) {
	        model.addAttribute("selectedOrder", orders.get(0));
	    }

	    // 3-2) 헤더 알림 뱃지와 동기화: 
	    //       - pending 리스트가 비어 있으면 0 으로 리셋  
	    //       - 비어 있지 않으면 실제 개수로 덮어쓰기
	    int pendingCount = orders.size();
	    session.setAttribute("notifyCount", pendingCount);
	    
	    // 4) layout에서 active 상태 표시용 status 속성
	    model.addAttribute("status", "PENDING");

	    return "shop/shopNewOrders";
	}

	/* ----------------------- 주문 관리 ----------------------- */
	@GetMapping("/shop/orderManage")
	public String orderManage(
	    @RequestParam(value="status", defaultValue="ACCEPTED") String status,
	    @RequestParam(value="oNo",    required=false) Integer oNo,
	    @SessionAttribute("currentSId") Integer sId,
	    @SessionAttribute("loginId")     String loginId,
	    Model model) {

	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    List<Orders> orders;
	    if ("ACCEPTED".equalsIgnoreCase(status)) {
	        // "조리 중" 탭에서는 ACCEPTED와 DISPATCHED 상태를 모두 조회
	        orders = shopService.findOrdersByMultipleStatusesAndShop(List.of("ACCEPTED", "DISPATCHED"), sId);
	    } else if ("ALL".equalsIgnoreCase(status)) {
	        orders = shopService.findOrdersByShopId(sId);
	    } else {
	        orders = shopService.findOrdersByStatusAndShop(status, sId);
	    }

	    model.addAttribute("orders", orders);
	    model.addAttribute("status", status);
	    model.addAttribute("currentShop", currentShop);
	    if (oNo != null) {
	        model.addAttribute("selectedOrder", shopService.findOrderByNo(oNo));
	    }
	    return "shop/shopOrderManage";
	}

	// ----------------------- 주문 상태 변경 및 리다이렉트 -----------------------
	@GetMapping("/shop/orderManage/{oNo}/status")
	public String changeOrderStatusAndRedirect(
	        @PathVariable("oNo") int oNo,             // <-- 변수명 명시
	        @RequestParam("newStatus") String newStatus,
	        @SessionAttribute("currentSId") Integer shopId,
	        @SessionAttribute("loginId") String loginId,
	        RedirectAttributes ra) {

	    // 1) DB 상태 업데이트
	    shopService.updateOrderStatus(oNo, newStatus);

	    // 2) WebSocket 브로드캐스트 (운영자 화면 + 고객 화면)
	    Map<String, Object> payload = Map.of("oNo", oNo, "newStatus", newStatus);
	    messagingTemplate.convertAndSend("/topic/orderStatus/" + oNo, payload);
	    messagingTemplate.convertAndSend("/topic/orderStatus/shop/" + shopId, payload);

	    // 3) 같은 주문 번호로 주문관리 페이지로 되돌아가기
	    // 바뀐 상태를 status 파라미터로 넘겨 줘야,
	    // 버튼 눌렀을 때 해당 탭(DELIVERING 또는 COMPLETED 등)이 유지됩니다.
	    return "redirect:/shop/orderManage?status=" 
	          + newStatus 
	          + "&oNo=" 
	          + oNo;
	}
	
	/* ----------------------- 헤더 알림용 PENDING 리스트 API (변경 없음) ----------------------- */
	@GetMapping("/api/shop/{sId}/pendingOrders")
	@ResponseBody
	public List<Map<String, Object>> getPendingOrders(@PathVariable Integer sId) {
	    List<Orders> pending = shopService.findOrdersByStatusAndShop("PENDING", sId);
	    return pending.stream().map(o -> {
	        Map<String, Object> map = new HashMap<>();
	        map.put("oNo", o.getONo());
	        map.put("menus", o.getMenus());
	        map.put("regDate", o.getRegDate());
	        map.put("totalPrice", o.getTotalPrice());
	        map.put("quantity", o.getQuantity());
	        map.put("oAddress", o.getOAddress());
	        map.put("request", o.getRequest());
	        return map;
	    }).toList();
	}

	
	/* ----------------------- 주문 상세 보기 ----------------------- */
	@GetMapping("/shop/orderDetail")
	public String orderDetail(@RequestParam("oNo") int oNo,
			@SessionAttribute(name = "loginId", required = false) String loginId,
			@SessionAttribute(name = "currentSId", required = false) Integer sId, Model model) {

		if (loginId == null || sId == null) {
			return "redirect:/login";
		}

		// OrderItem 테이블 없이 orders 테이블만 조회
		Orders order = shopService.findOrderByNo(oNo);
		model.addAttribute("order", order);
		model.addAttribute("currentShop", shopService.findByShopIdAndOwnerId(sId, loginId));

		return "shop/shopOrderDetail";
	}

	/* ----------------------- 주문 상태 변경 (수락/거절/완료) ----------------------- */
	@PostMapping("/shop/orderManage/{oNo}/status")
	@ResponseBody
	@Transactional

	public ResponseEntity<Map<String,Object>> changeOrderStatus(
	    @PathVariable("oNo") int oNo,
	    @RequestParam("newStatus") String newStatus,
	    @SessionAttribute(name="currentSId") Integer shopId
	) {


		// 1) DB 업데이트
		  shopService.updateOrderStatus(oNo, newStatus);

		  // 2) 상세 갱신용
		  messagingTemplate.convertAndSend("/topic/orderStatus/" + oNo,
		      Map.of("oNo", oNo, "newStatus", newStatus));


		// 3. 주문 정보를 조회하여 사용자 ID를 얻습니다.
		Orders order = shopService.findOrderByNo(oNo);
		if (order != null) {
			if ("REJECTED".equals(newStatus)) {
				// 주문 거절 시 결제 환불 처리
				String paymentUid = order.getPaymentUid();
				int totalPrice = order.getTotalPrice();
				if (paymentUid != null && totalPrice > 0) {
					log.info("주문 거절: 결제 환불 시작. paymentUid: {}, totalPrice: {}", paymentUid, totalPrice);
					boolean refunded = portoneService.cancelPayment(
					    paymentUid,
					    null, // merchant_uid는 사용하지 않음 (imp_uid로 충분)
					    "가게 사정으로 인한 주문 거절", // reason
					    null // 전액 환불
					);
					if (!refunded) {
						log.error("결제 환불 실패: {}", "PortoneService.cancelPayment 반환값 false");
						// 환불 실패 시 적절한 에러 처리 (예: 사용자에게 알림, 관리자에게 보고)
						return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false, "message", "주문 거절은 되었으나 결제 환불에 실패했습니다."));
					}
					log.info("결제 환불 성공");
				} else {
					log.warn("주문 거절: paymentUid 또는 totalPrice가 없어 환불을 진행할 수 없습니다. oNo: {}", oNo);
				}
			}

			
		}

		  // 3) ★가게 전체 갱신용
		  messagingTemplate.convertAndSend("/topic/orderStatus/shop/" + shopId,
		      Map.of("oNo", oNo, "newStatus", newStatus));


		
		  return ResponseEntity.ok(Map.of("success", true));
	}

	/* ----------------------- 기존 주문 내역 보기 ----------------------- */
	@GetMapping("/shop/orders")
	public String viewOrders(
	        @RequestParam("s_id") Integer sId,
	        @SessionAttribute(name = "loginId", required = false) String loginId,
	        Model model) {
	    if (loginId == null || sId == null) {
	        return "redirect:/login";
	    }
	    List<Orders> orders = shopService.findOrdersByShopId(sId);
	    model.addAttribute("orders", orders);
	    model.addAttribute("currentShop",
	           shopService.findByShopIdAndOwnerId(sId, loginId));
	    return "shop/shopOrders";
	}

	// 주문정보 출력 및 WebSocket 알림 추가
	@PostMapping(value = "/order", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Map<String, Integer>> createOrder(@RequestBody Map<String, Object> req) {
		// 1) 주문 저장 → placeOrder 안에서 websocketService.sendNewOrder(newOrder) 실행됨
		Orders saved = shopService.placeOrder(req);

		// 2) 생성된 주문번호만 반환
		return ResponseEntity.ok(Map.of("oNo", saved.getONo()));
	}

	/* ----------------------- 헤더알림 주문으로 이동 ----------------------- */
	@GetMapping("/shopNewOrders")
	public String showShopNewOrders(
	        @RequestParam(value = "sOrderNo", required = false) Integer sOrderNo,
	        @SessionAttribute(name = "loginId", required = false) String loginId,
	        Model model
	) {
	    if (loginId == null) return "redirect:/login";

	    List<Orders> orders = shopService.findNewOrdersByOwnerId(loginId);
	    model.addAttribute("orders", orders);

	    Orders selectedOrder = null;
	    if (orders != null && !orders.isEmpty()) {
	        if (sOrderNo != null) {
	            selectedOrder = orders.stream()
	                .filter(o -> o.getONo() == sOrderNo)
	                .findFirst()
	                .orElse(orders.get(0));
	        } else {
	            selectedOrder = orders.get(0);
	        }
	    }
	    model.addAttribute("selectedOrder", selectedOrder);

	    return "shop/shopNewOrders";
	}
	
}