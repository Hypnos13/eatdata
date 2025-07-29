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
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.projectbob.domain.*;
import com.projectbob.service.*;

import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class ShopController {
	
	@Autowired
	private ShopService shopService;
	
	@Autowired
    private BobService bobService;
	
	@Autowired
	private FileUploadService fileUploadService;
	
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
	        String finalUrlString = apiUrl
	                        + "?serviceKey=" + encodedServiceKey
	                        + "&FOOD_NM_KR=" + encodedFoodName // ✨ 파라미터 이름 수정
	                        + "&pageNo=1"
	                        + "&numOfRows=10"
	                        + "&type=json";

	        log.info("▶▶▶ 최종 요청 URL: {}", finalUrlString);
	        
	        HttpClient client = HttpClient.newHttpClient();
	        HttpRequest request = HttpRequest.newBuilder()
	                .uri(new URI(finalUrlString))
	                .GET()
	                .build();

	        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
	        
	        log.info("◀◀◀ API 응답: {}", response.body());

	        HttpHeaders responseHeaders = new HttpHeaders();
	        responseHeaders.setContentType(MediaType.APPLICATION_JSON);
	        return new ResponseEntity<>(response.body(), responseHeaders, HttpStatus.OK);

	    } catch (Exception e) {
	        log.error("!!! 식약처 API 호출 오류", e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body("{\"error\":\"API 호출 중 오류 발생\"}");
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
	
	/* ----------------------- 메인 ----------------------- */
    @GetMapping("/shopMain")
    public String shopMain(@RequestParam(value = "s_id", required = false) Integer sId,
                           @SessionAttribute(name = "loginId", required = false) String loginId,
                           HttpSession session,
                           Model model) {

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
    private Shop resolveCurrentShop(Integer sId,
                                    String loginId,
                                    HttpSession session,
                                    List<Shop> shopList) {
        if (loginId == null || shopList == null || shopList.isEmpty()) return null;

        if (sId != null) { // 1) 요청 파라미터 우선
            session.setAttribute("currentSId", sId);
        }

        Integer cur = (Integer) session.getAttribute("currentSId");
        if (cur != null) {
            for (Shop s : shopList) {
                if (s.getSId() == cur) {   // <-- 여기!
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
                             @SessionAttribute(name = "loginId", required = false) String loginId,
                             HttpSession session,
                             @RequestHeader(value = "Referer", required = false) String referer) {
        if (loginId == null) return "redirect:/login";
        Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
        if (shop != null) session.setAttribute("currentSId", sId);
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
                                @SessionAttribute(name = "loginId", required = false) String loginId,
                                HttpSession session,
                                Model model) {
        if (loginId == null) return "redirect:/login";

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
                               @SessionAttribute(name = "loginId", required = false) String loginId,
                               HttpSession session,
                               Model model) {
        if (loginId == null) return "redirect:/login";

        List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
        Shop currentShop = resolveCurrentShop(sId, loginId, session, shopList);
        if (currentShop == null) return "redirect:/shopMain";

        model.addAttribute("shop", currentShop);
        return "shop/shopBasicSet";
    }
	
 // 기본정보 수정 로직
    @PostMapping("/shop/updateBasic")
    public String updateBasicInfo(
            @SessionAttribute(name="loginId", required=false) String loginId,
            @ModelAttribute Shop shop,
            @RequestParam(value="sPicture", required=false) MultipartFile sPictureFile,
            @RequestParam(value="sLicense", required=false) MultipartFile sLicenseFile,
            Model model) throws IOException {

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
    public String shopListMain(
            Model model,
            @SessionAttribute(name = "loginId", required = false) String loginId,
            @RequestParam(value = "s_id", required = false) Integer sId,
            HttpSession session) {

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
            menuCountMap.put(
                shop.getSId(),
                shopService.getMenuCount(shop.getSId())
            );
        }

        // 4) 모델에 담기
        model.addAttribute("shopListMain",  shopListMain);
        model.addAttribute("currentShop",   currentShop);
        model.addAttribute("menuCountMap",  menuCountMap);

        return "shop/shopListMain";
    }

	
    /* ----------------------- 영업 상태 ----------------------- */
    @PostMapping("/shop/updateStatus")
    @ResponseBody
    public String updateShopStatusAjax(@RequestBody Map<String,Object> param,
                                       @SessionAttribute(name="loginId", required=false) String loginId){
        if(loginId == null) return "NOT_LOGIN";
        Integer sId = Integer.parseInt(param.get("sId").toString());
        String status = param.get("status").toString();
        shopService.updateShopStatus(sId, status);
        return "OK";
    }
	
    /* ----------------------- 영업시간 ----------------------- */
    @GetMapping("/shopOpenTime")
    public String shopOpenTime(@RequestParam(value = "s_id", required = false) Integer sId,
                               @SessionAttribute(name = "loginId", required = false) String loginId,
                               HttpSession session,
                               @ModelAttribute("message") String message,
                               Model model) {

        if (loginId == null) return "redirect:/login";
        List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
        Shop shop = resolveCurrentShop(sId, loginId, session, shopList);
        log.debug(">>> shop.opTime = {}", shop.getOpTime());
        if (shop == null) {
            model.addAttribute("message", "가게를 찾을 수 없습니다.");
            return "shop/errorPage";
        }

        // raw
        List<String[]> raw = shopService.getOpenTimeList(shop);
        while (raw.size() < 7) raw.add(new String[]{"-", ""});

        List<String> oH = new ArrayList<>(), oM = new ArrayList<>();
        List<String> cH = new ArrayList<>(), cM = new ArrayList<>();
        List<String> isOpenList = new ArrayList<>();

        for (String[] t : raw) {
            String open = t[0], close = t[1];
            boolean closed = (open == null) || open.equals("휴무") || open.equals("-") || open.isBlank();

            if (closed) {
                oH.add(""); oM.add("");
                cH.add(""); cM.add("");
                isOpenList.add("0");
            } else {
                oH.add(open.substring(0, 2));
                oM.add(open.substring(3, 5));
                cH.add(close.substring(0, 2));
                cM.add(close.substring(3, 5));
                isOpenList.add("1");
            }
        }

        model.addAttribute("daysOfWeek", Arrays.asList("월", "화", "수", "목", "금", "토", "일"));
        model.addAttribute("shop", shop);
        model.addAttribute("oH", oH);
        model.addAttribute("oM", oM);
        model.addAttribute("cH", cH);
        model.addAttribute("cM", cM);
        model.addAttribute("isOpenList", isOpenList);
        if (message != null && !message.isBlank()) model.addAttribute("message", message);

        return "shop/shopOpenTime";
    }

	// 영업시간 업데이트
    @PostMapping("/shopOpenTimeUpdate")
    public String shopOpenTimeUpdate(@RequestParam(value = "s_id", required = false) Integer sId,
                                     @RequestParam("openHour") String[] openHour,
                                     @RequestParam("openMin") String[] openMin,
                                     @RequestParam("closeHour") String[] closeHour,
                                     @RequestParam("closeMin") String[] closeMin,
                                     @RequestParam MultiValueMap<String, String> isOpenMap,
                                     @SessionAttribute(name = "loginId", required = false) String loginId,
                                     HttpSession session,
                                     RedirectAttributes redirectAttributes) {

        if (loginId == null) return "redirect:/login";
        if (sId == null) {
            sId = (Integer) session.getAttribute("currentSId");
        }

        log.info("len openHour={}, openMin={}, closeHour={}, closeMin={}",
                openHour.length, openMin.length, closeHour.length, closeMin.length);

        StringBuilder offDay = new StringBuilder();
        StringBuilder opTime = new StringBuilder();

        for (int i = 0; i < 7; i++) {
            List<String> vals = isOpenMap.get("isOpen[" + i + "]");
            String flag = (vals != null && !vals.isEmpty()) ? vals.get(vals.size() - 1) : "0";
            boolean closed = !"1".equals(flag);

            if (closed) {
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
                    opTime.append(oh).append(':').append(om).append(',')
                          .append(ch).append(':').append(cm).append(';');
                }
            }
        }

        if (opTime.length() > 0) opTime.setLength(opTime.length() - 1);
        if (offDay.length() > 0) offDay.setLength(offDay.length() - 1);

        Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
        if (shop == null) {
            redirectAttributes.addFlashAttribute("message", "가게를 찾을 수 없습니다.");
            return "redirect:/shopOpenTime?s_id=" + sId;
        }
        shop.setOpTime(opTime.toString());
        shop.setOffDay(offDay.toString());
        shopService.updateShopOpenTime(shop);

        redirectAttributes.addFlashAttribute("message", "영업시간 정보가 저장되었습니다.");
        return "redirect:/shopOpenTime?s_id=" + sId;
    }
	
    /** 배열 방어 */
    private String val(String[] arr, int idx, String def) {
        return (arr != null && idx < arr.length && arr[idx] != null) ? arr[idx] : def;
    }
	
	// 가게 운영상태 변경 요청
	@PostMapping("/shop/statusUpdate")
	@ResponseBody
	public String updateShopStatus(
	    @RequestParam("sId") Integer sId,
	    @RequestParam("status") String status, 
	    @SessionAttribute(name = "loginId", required = false) String loginId
	) {
	    if (loginId == null) return "NOT_LOGIN";
	    // (추가: 로그인한 사용자의 가게만 수정 가능하게 검증해도 됨)
	    shopService.updateShopStatus(sId, status);
	    return "OK";
	}

	// 가게 리스트 가져오기
	@GetMapping("/shopStatus")
	public String shopStatusPage(
	    @SessionAttribute(name = "loginId", required = false) String loginId,
	    Model model
	) {
	    if (loginId == null) return "redirect:/login";
	    List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
	    model.addAttribute("shopList", shopList);
	    if (!shopList.isEmpty()) {
	        model.addAttribute("shop", shopList.get(0)); // 또는 선택된 가게
	    }
	    return "shop/shopStatus"; 
	}
	
	// ── 사장님 공지 보기 ─────────────────────────────
    @GetMapping("/shopNotice")
    public String showNotice(
            @RequestParam("s_id") Integer sId,
            @SessionAttribute(name = "loginId", required = false) String loginId,
            HttpSession session,
            Model model) {
        if (loginId == null) {
            return "redirect:/login";
        }
        // 소유권 체크
        Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
        if (shop == null) {
            model.addAttribute("errorMessage", "권한이 없거나 가게를 찾을 수 없습니다.");
            return "shop/errorPage";
        }
        model.addAttribute("shop", shop);
        return "shop/shopNotice";
    }

    // ── 사장님 공지 & 가게소개 저장 ─────────────────────────────
    @PostMapping("/shopNotice")
    public String updateNotice(
            @RequestParam("s_id") Integer sId,
            @RequestParam(value = "notice", required = false) String notice,
            @RequestParam(value = "s_info", required = false) String sInfo,
            @RequestParam("action") String action,
            @SessionAttribute(name = "loginId", required = false) String loginId,
            RedirectAttributes ra) {

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
    
 // ① 리뷰 관리 화면
 @GetMapping("/shop/reviewManage")
 public String shopReviewManage(
         @SessionAttribute(name="loginId", required=false) String loginId,
         @RequestParam("s_id") Integer sId,
         HttpSession session,
         Model model) {

     if (loginId == null) {
         return "redirect:/login";
     }

     // 1) 사장님이 가진 가게 목록 조회
     List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);
     if (shopListMain.isEmpty()) {
         // 가게가 하나도 없으면 기본 페이지로
         return "redirect:/shopInfo";
     }

     // 2) currentShop 결정 (세션 or 파라미터 기반)
     Shop currentShop = resolveCurrentShop(sId, loginId, session, shopListMain);
     if (currentShop == null) {
         return "redirect:/shopMain";
     }

     // 3) 리뷰+답글 조회
     List<Review> reviews = shopService.getReviewsWithReplies(currentShop.getSId());

     // 4) 모델에 담기 (사이드바용 shopListMain/currentShop, 뷰용 shop/reviews)
     model.addAttribute("shopListMain", shopListMain);
     model.addAttribute("currentShop", currentShop);
     model.addAttribute("shop", currentShop);
     model.addAttribute("reviews", reviews);

     return "shop/shopReviewManage";
}

 // ② 답글 등록 처리
 @PostMapping("/shop/review/reply")
 public String postReviewReply(
         @SessionAttribute(name="loginId") String loginId,
         @ModelAttribute ReviewReply reply,
         RedirectAttributes ra) {

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
     return "redirect:/shop/reviewManage?s_id=" + reply.getSId();
 }
 
 
 /** 리뷰 등록 */
 @PostMapping("/review/add")
 public String addReview(@ModelAttribute Review review, RedirectAttributes ra) {
     review.setStatus("일반");
     bobService.addReview(review);
     ra.addFlashAttribute("msg", "리뷰가 등록되었습니다.");
     return "redirect:/shop/reviewManage?s_id=" + review.getSId();
 }

	/* ----------------------- 전역 타이틀 ----------------------- */
    @ControllerAdvice
    public static class GlobalModelAdvice {
        @ModelAttribute
        public void addGlobalAttributes(Model model, jakarta.servlet.http.HttpServletRequest request) {
            String uri = request.getRequestURI();
            String pageTitle = "";
            if (uri.contains("shopBasic")) pageTitle = "기본설정";
            else if (uri.contains("shopOpenTime")) pageTitle = "영업시간";
            else if (uri.contains("shopStatus")) pageTitle = "영업상태";
            else if (uri.contains("menu")) pageTitle = "메뉴관리";
            else if (uri.contains("shopNotice")) pageTitle = "사장님 공지";
            else if (uri.contains("shopReview")) pageTitle = "리뷰 관리";

            model.addAttribute("pageTitle", pageTitle);
        }
    }
		
}


