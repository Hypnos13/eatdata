package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;

import java.io.IOException;
import java.util.*;
import java.security.Principal;
import java.sql.Timestamp;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.projectbob.domain.*;
import com.projectbob.service.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
	
	//기본정보 수정 로직
    @PostMapping("/shop/updateBasic")
    public String updateBasicInfo(@ModelAttribute Shop shop) {
        shop.setModiDate(new Timestamp(System.currentTimeMillis()));
        shopService.updateShopBasicInfo(shop);
        return "redirect:/shopBasicView?s_id=" + shop.getSId();
    }
	
    /* ----------------------- 내 가게 리스트 ----------------------- */
    @GetMapping("/shopListMain")
    public String shopListMain(Model model,
                               @SessionAttribute(name = "loginId", required = false) String loginId,
                               @RequestParam(value = "s_id", required = false) Integer sId,
                               HttpSession session) {
        if (loginId == null) return "redirect:/login";

        List<Shop> shopListMain = shopService.findShopListByOwnerId(loginId);
        if (shopListMain.isEmpty()) return "shop/shopInfo";

        Shop currentShop = resolveCurrentShop(sId, loginId, session, shopListMain);

        model.addAttribute("shopListMain", shopListMain);
        model.addAttribute("shop", currentShop);
        model.addAttribute("currentShop", currentShop);
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

            model.addAttribute("pageTitle", pageTitle);
        }
    }
		
}


