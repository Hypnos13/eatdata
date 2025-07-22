package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;

import java.io.IOException;
import java.util.*;
import java.security.Principal;
import java.sql.Timestamp;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.projectbob.domain.*;
import com.projectbob.service.*;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class ShopController {
	
	@Autowired
	private ShopService shopService;
	
	@Autowired
	private FileUploadService fileUploadService;
	
	@PostMapping("/insertShop")
	public String insertShop( @RequestParam("id") String id,
			@RequestParam("sNumber") String sNumber, @RequestParam("owner") String owner, 
			@RequestParam("phone") String phone, @RequestParam("name") String name, 
			@RequestParam("zipcode") String zipcode, @RequestParam("address1") String address1, 
			@RequestParam("address2") String address2, Model model ) { //@RequestParam("sLicense") MultipartFile sLicenseFile
		
		/*String sLicenseUrl = null; // DB에 저장할 사업자등록증 URL

        try {
            // 1. 사업자등록증 파일을 FileUploadService를 통해 업로드
            // "business-licenses/"는 images/ 하위의 폴더
            sLicenseUrl = fileUploadService.uploadFile(sLicenseFile, "business-licenses/");
            System.out.println("사업자등록증 업로드 성공. URL: " + sLicenseUrl);

            // // 2. (선택) 가게 사진도 있다면 동일하게 업로드
            // String shopImageUrl = null;
            // if (shopImageFile != null && !shopImageFile.isEmpty()) {
            //     shopImageUrl = fileUploadService.uploadFile(shopImageFile, "shop-images/"); // 가게 사진 전용 폴더
            //     System.out.println("가게 사진 업로드 성공. URL: " + shopImageUrl);
            // }

        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMessage", e.getMessage()); // 파일이 비어있는 경우
            return "/shop/shopJoinForm";
        } catch (IOException e) {
            e.printStackTrace();
            model.addAttribute("errorMessage", "파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            return "/shop/shopJoinForm";
        */
		
        Shop shop = new Shop();
        shop.setId(id);
        shop.setSNumber(sNumber);
        shop.setOwner(owner);
        shop.setPhone(phone);
        shop.setName(name);
        shop.setZipcode(zipcode);
        shop.setAddress1(address1);
        shop.setAddress2(address2);
        //shop.setSLicenseURL(sLicenseUrl);
        shopService.insertShop(shop);

        model.addAttribute("message", "가게 정보가 성공적으로 등록되었습니다.");
		return "redirect:shopMain";
	}
	
	@GetMapping("/shopMain")
	public String shopMain(Model model, @SessionAttribute(name = "loginId", required = false) String loginId) {
	    boolean hasShop = false;
	    boolean isLogin = (loginId != null);
	    List<Shop> shopListMain = new ArrayList<>();
	    Shop shop = null;
	    if (isLogin) {
	        shopListMain = shopService.findShopListByOwnerId(loginId);
	        hasShop = (shopListMain != null && !shopListMain.isEmpty());
	    }
	    model.addAttribute("hasShop", hasShop);
	    model.addAttribute("isLogin", isLogin);
	    model.addAttribute("shopListMain", shopListMain);
	    model.addAttribute("shop", shop);
	    return "shop/shopMain";
	}
	
	@GetMapping("/shopJoinForm")
	public String shopJoinForm(Model model ) {
		model.addAttribute("shop", new Shop());
		return "shop/shopJoinForm";
	}
	
	@GetMapping("/shopInfo")
	public String shopInfo() {
	    return "shop/shopInfo";
	}
	
	//기본정보 뷰페이지
	@GetMapping("/shopBasicView")
	public String shopBasicView(
	    @RequestParam("s_id") Integer sId,
	    @SessionAttribute(name = "loginId", required = false) String loginId,
	    Model model) 
	{
	    if (loginId == null) return "redirect:/login";

	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);

	    if (currentShop == null) {
	        model.addAttribute("errorMessage", "가게 정보를 찾을 수 없습니다.");
	        return "redirect:/shopMain";  // 또는 에러용 뷰
	    }

	    model.addAttribute("shop", currentShop);
	    model.addAttribute("currentShop", currentShop);
	    return "shop/shopBasicView";
	}
	
	// 기본설정 수정(폼) 페이지
	@GetMapping("/shopBasicSet")
	public String shopBasicSet(@RequestParam("s_id") Integer sId,
	                           @SessionAttribute(name = "loginId", required = false) String loginId,
	                           Model model) {
	    if (loginId == null) return "redirect:/login";
	    Shop currentShop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    model.addAttribute("shop", currentShop);
	    return "shop/shopBasicSet";
	}
	
	//기본정보 수정 로직
		@PostMapping("/shop/updateBasic")
		public String updateBasicInfo(@ModelAttribute Shop shop, Model model) {
		    // 수정일자 갱신
		    shop.setModiDate(new Timestamp(System.currentTimeMillis()));
		    
		    // DB 업데이트
		    shopService.updateShopBasicInfo(shop);

		    // redirect or model 추가
		    return "redirect:/shopBasicView?s_id=" + shop.getSId();
		}
	
	@GetMapping("/shopListMain")
	public String shopListMain(
	        Model model,
	        @SessionAttribute(name = "loginId", required = false) String loginId,
	        @RequestParam(name = "s_id", required = false) Integer sId) {

	    if (loginId == null) return "redirect:/login";
	    List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);

	    if (shopListMain == null || shopListMain.isEmpty()) {
	        return "shop/shopInfo"; // 가게 없으면 안내페이지로 이동
	    }

	    // ★ 현재 선택된 가게 찾기: sId로 조회, 없으면 첫번째
	    Shop shop = null;
	    if (sId != null) {
	        shop = shopListMain.stream()
	                .filter(s -> s.getSId() == sId)
	                .findFirst()
	                .orElse(shopListMain.get(0)); // 못찾으면 첫 번째
	    } else {
	        shop = shopListMain.get(0);
	    }

	    model.addAttribute("shopListMain", shopListMain);
	    model.addAttribute("shop", shop);
	    model.addAttribute("currentShop", shop);

	    return "shop/shopListMain";
	}
	
	//가게 상태 업데이트
	@PostMapping("/shop/updateStatus")
	@ResponseBody
	public String updateShopStatus(@RequestBody Map<String, Object> param) {
	    Integer sId = Integer.parseInt(param.get("sId").toString());
	    String status = param.get("status").toString();
	    shopService.updateStatus(sId, status); // 실제 update 쿼리 실행
	    return "ok";
	}
	
	//영업시간 페이지
	@GetMapping("/shopOpenTime")
	public String shopOpenTime(
	    @RequestParam("s_id") Integer sId,
	    Model model,
	    @SessionAttribute(name = "loginId", required = false) String loginId,
	    @ModelAttribute("message") String message
	) {
	    if (loginId == null) return "redirect:/login";
	    Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    if (shop == null) {
	        model.addAttribute("message", "가게를 찾을 수 없습니다.");
	        return "shop/errorPage";
	    }

	    List<String[]> openTimeListRaw = shopService.getOpenTimeList(shop);
	    if (openTimeListRaw == null) openTimeListRaw = new ArrayList<>();
	    while (openTimeListRaw.size() < 7) openTimeListRaw.add(new String[]{"", ""});

	    List<String> openTimeList = new ArrayList<>();
	    List<String> closeTimeList = new ArrayList<>();
	    for (String[] times : openTimeListRaw) {
	        openTimeList.add(times.length > 0 ? times[0] : "");
	        closeTimeList.add(times.length > 1 ? times[1] : "");
	    }

	    List<String> daysOfWeek = Arrays.asList("월","화","수","목","금","토","일");
	    int todayIndex = java.time.LocalDate.now().getDayOfWeek().getValue() % 7;

	    List<String> offDayList = new ArrayList<>();
	    if (shop.getOffDay() != null && !shop.getOffDay().isBlank()) {
	        offDayList.addAll(Arrays.asList(shop.getOffDay().split(",")));
	    }
	    while (offDayList.size() < 7) offDayList.add("0");

	    model.addAttribute("daysOfWeek", daysOfWeek);
	    model.addAttribute("todayIndex", todayIndex);
	    model.addAttribute("shop", shop);
	    model.addAttribute("openTimeList", openTimeList);
	    model.addAttribute("closeTimeList", closeTimeList);
	    model.addAttribute("offDayList", offDayList);
	    if (message != null && !message.isBlank()) model.addAttribute("message", message);

	    return "shop/shopOpenTime";
	}

	//영업시간 업데이트
	@PostMapping("/shopOpenTimeUpdate")
	public String shopOpenTimeUpdate(
	    @RequestParam("s_id") Integer sId,
	    @RequestParam("openTime") String[] openTimes,
	    @RequestParam("closeTime") String[] closeTimes,
	    @SessionAttribute(name = "loginId", required = false) String loginId,
	    RedirectAttributes redirectAttributes
	) {
	    if (loginId == null) return "redirect:/login";

	    StringBuilder offDayBuilder = new StringBuilder();
	    StringBuilder opTimeBuilder = new StringBuilder();

	    for (int i = 0; i < openTimes.length; i++) {
	        String open = openTimes[i];
	        String close = closeTimes[i];

	        if ((open == null || open.isBlank()) && (close == null || close.isBlank())) {
	            offDayBuilder.append(i).append(",");
	            opTimeBuilder.append("-,").append("-;");
	        } else {
	            opTimeBuilder.append(open == null ? "-" : open).append(",");
	            opTimeBuilder.append(close == null ? "-" : close).append(";");
	        }
	    }
	    String opTime = opTimeBuilder.toString();
	    if (opTime.endsWith(";")) opTime = opTime.substring(0, opTime.length() - 1);
	    String offDay = offDayBuilder.toString();
	    if (offDay.endsWith(",")) offDay = offDay.substring(0, offDay.length() - 1);

	    Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    if (shop == null) {
	        redirectAttributes.addFlashAttribute("message", "가게를 찾을 수 없습니다.");
	        return "redirect:/shopOpenTime?s_id=" + sId;
	    }
	    shop.setOpTime(opTime);
	    shop.setOffDay(offDay);
	    shopService.updateShopOpenTime(shop);

	    redirectAttributes.addFlashAttribute("message", "영업시간 정보가 저장되었습니다.");
	    return "redirect:/shopOpenTime?s_id=" + sId;
	}
	
	// 가게 운영상태 변경 요청
	@PostMapping("/shop/statUpdate")
	@ResponseBody
	public String updateShopStat(
	    @RequestParam("sId") Integer sId,
	    @RequestParam("stat") String stat,
	    @SessionAttribute(name = "loginId", required = false) String loginId
	) {
	    if (loginId == null) return "NOT_LOGIN";
	    // (추가: 로그인한 사용자의 가게만 수정 가능하게 검증해도 됨)
	    shopService.updateShopStat(sId, stat);
	    return "OK";
	}
	
	//가게 리스트 가져오기
	@GetMapping("/shopStat")
	public String shopStatPage(
	    @SessionAttribute(name = "loginId", required = false) String loginId,
	    Model model
	) {
	    if (loginId == null) return "redirect:/login";
	    List<Shop> shopList = shopService.findShopListByOwnerId(loginId);
	    model.addAttribute("shopList", shopList);
	    return "shop/shopStat"; // 운영상태 관리 페이지명
	}


}


