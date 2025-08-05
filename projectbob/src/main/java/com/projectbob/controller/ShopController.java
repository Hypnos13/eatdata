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

import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.projectbob.domain.*;
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

    ShopController(WebsocketService websocketService) {
        this.websocketService = websocketService;
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
	public String insertShop(@RequestParam("id") String id, @RequestParam("sNumber") String sNumber,
			@RequestParam("owner") String owner, @RequestParam("phone") String phone, @RequestParam("name") String name,
			@RequestParam("zipcode") String zipcode, @RequestParam("address1") String address1,
			@RequestParam("address2") String address2, @RequestParam("sPicture") MultipartFile sPictureFile,
			@RequestParam("sLicense") MultipartFile sLicenseFile, Model model) {

		String sLicenseUrl = null;
		String sPictureUrl = null;

		try {
			sLicenseUrl = fileUploadService.uploadFile(sLicenseFile, "business-licenses/");
			System.out.println("사업자등록증 업로드 성공. URL: " + sLicenseUrl);
			if (sPictureFile != null && !sPictureFile.isEmpty()) {
				sPictureUrl = fileUploadService.uploadFile(sPictureFile, "shop/");
				System.out.println("가게 사진 업로드 성공. URL: " + sPictureUrl);
			}
		} catch (IllegalArgumentException e) {
			model.addAttribute("errorMessage", e.getMessage()); // 파일이 비어있는 경우
			return "/shop/shopJoinForm";
		} catch (IOException e) {
			e.printStackTrace();
			model.addAttribute("errorMessage", "파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
			return "/shop/shopJoinForm";
		}

<<<<<<< HEAD
        model.addAttribute("message", "가게 정보가 성공적으로 등록되었습니다.");
		return "redirect:/shopMain";
=======
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
>>>>>>> develop
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

	/* ----------------------- 메인 ----------------------- */
	@GetMapping("/shopMain")
	public String shopMain(@RequestParam(value = "s_id", required = false) Integer sId,
			@SessionAttribute(name = "loginId", required = false) String loginId, HttpSession session, Model model) {

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

		model.addAttribute("shop", currentShop);
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

	// ── 사장님 공지 & 가게소개 저장 ─────────────────────────────
	@PostMapping("/shopNotice")
	public String updateNotice(@RequestParam("s_id") Integer sId,
			@RequestParam(value = "notice", required = false) String notice,
			@RequestParam(value = "s_info", required = false) String sInfo, @RequestParam("action") String action,
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

	/* ----------------------- 상태별 주문 관리 ----------------------- */
	@GetMapping("/shop/orderManage")
	public String orderManage(
	        @RequestParam(value = "status", defaultValue = "ALL") String status,
	        @RequestParam(value = "oNo", required = false) Integer oNo,
	        @SessionAttribute(name = "currentSId", required = false) Integer sId,
	        @SessionAttribute(name = "loginId", required = false) String loginId,
	        Model model) {

	    if (loginId == null || sId == null) {
	        return "redirect:/login";
	    }
	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    if (currentShop == null) {
	        return "redirect:/shopMain";
	    }

	    List<Orders> orders;
	    if ("ALL".equals(status)) {
	        // ALL이란, 거절(REJECTED)·완료(DELIVERED)만 빼고 다 보여주기
	        orders = shopService.findOrdersByShopId(sId).stream()
	            .filter(o -> !"REJECTED".equals(o.getStatus()) && !"DELIVERED".equals(o.getStatus()))
	            .toList();
	    } else {
	        // 특정 상태로 필터링 (COOKING, IN_PROGRESS 등)
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
	public ResponseEntity<Map<String, Object>> changeOrderStatus(@PathVariable int oNo,
			@RequestParam("newStatus") String newStatus) {

		// 1. 주문 상태를 DB에 업데이트합니다.
		shopService.updateOrderStatus(oNo, newStatus);

		// 2. 가게의 다른 관리자 페이지 UI를 실시간으로 업데이트하기 위해 메시지를 보냅니다.
		messagingTemplate.convertAndSend("/topic/orderStatus/" + oNo, Map.of("oNo", oNo, "newStatus", newStatus));

		// 3. 주문 정보를 조회하여 사용자 ID를 얻습니다.
		Orders order = shopService.findOrderByNo(oNo);
		if (order != null && order.getId() != null) {
			// 4. 해당 사용자에게 개인화된 알림을 보냅니다.
			Map<String, Object> payload = Map.of("oNo", oNo, "status", newStatus, "message",
					"주문이 " + ("ACCEPTED".equals(newStatus) ? "수락" : "취소") + "되었습니다.");
			websocketService.sendOrderStatusUpdateToUser(order.getId(), payload);
		}

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
	
}