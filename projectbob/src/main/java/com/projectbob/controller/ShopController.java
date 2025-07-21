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
	
	@PostMapping("/insertMenu")
	public String insertMenu( @RequestParam("sId") int sId,
			@RequestParam("category") String category, @RequestParam("name") String name, 
			@RequestParam("price") int price, @RequestParam("mInfo") String mInfo, 
			@RequestParam("mPicture") MultipartFile mPictureFile, Model model ) {
		
		String mPictureUrl = null;

        try {
        	mPictureUrl = fileUploadService.uploadFile(mPictureFile, "business-licenses/");
            System.out.println("메뉴사진 업로드 성공. URL: " + mPictureUrl);
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMessage", e.getMessage()); // 파일이 비어있는 경우
            return "/shop/menuJoinForm";
        } catch (IOException e) {
            e.printStackTrace();
            model.addAttribute("errorMessage", "파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            return "/shop/menuJoinForm";
        }
        Menu menu = new Menu();
        menu.setSId(sId);
        menu.setCategory(category);
        menu.setName(name);
        menu.setPrice(price);
        menu.setMInfo(mInfo);
        menu.setMPictureUrl(mPictureUrl);
        
        shopService.insertMenu(menu);

        model.addAttribute("message", "메뉴 정보가 성공적으로 등록되었습니다.");
		return "redirect:menuJoinForm";
	}
	
	@PostMapping("/insertMenuOption")
	public String insertMenuOption( @RequestParam("mId") int mId,
			@RequestParam("mOption") String mOption, @RequestParam("content") String content, 
			@RequestParam("price") int price, Model model ) {
		
        MenuOption menuOption = new MenuOption();
        menuOption.setMId(mId);
        menuOption.setMOption(mOption);
        menuOption.setContent(content);
        menuOption.setPrice(price);
        
        shopService.insertMenuOption(menuOption);

        model.addAttribute("message", "메뉴옵션 정보가 성공적으로 등록되었습니다.");
		return "redirect:optionJoinForm";
	}
	
	@GetMapping("/shopMain")
	public String shopMain(Model model, @SessionAttribute(name = "loginId", required = false) String loginId) {
	    boolean hasShop = false;
	    boolean isLogin = (loginId != null);
	    List<Shop> shopListMain = new ArrayList<>();
	    if (isLogin) {
	        shopListMain = shopService.findShopListByOwnerId(loginId);
	        hasShop = (shopListMain != null && !shopListMain.isEmpty());
	    }
	    model.addAttribute("hasShop", hasShop);
	    model.addAttribute("isLogin", isLogin);
	    model.addAttribute("shopListMain", shopListMain); // 추가
	    return "shop/shopMain";
	}
	
	@GetMapping("/shopJoinForm")
	public String shopJoinForm() {
		return "shop/shopJoinForm";
	}
	
	@GetMapping("/menuJoinForm")
	public String menuJoinForm() {
		return "shop/menuJoinForm";
	}
	
	@GetMapping("/menuUpdateForm")
	public String menuUpdateForm() {
		return "shop/menuUpdateForm";
	}
	
	@GetMapping("/optionJoinForm")
	public String optionJoinForm() {
		return "shop/optionJoinForm";
	}
	
	@GetMapping("/shopInfo")
	public String shopInfo() {
		return "shop/shopInfo";
	}
	
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
	    model.addAttribute("shop", shop); // ★ 이 부분 추가!

	    return "shop/shopListMain";
	}

	
	@GetMapping("/shopOpenTime")
	public String shopOpenTime(
	        @RequestParam("s_id") Integer sId,
	        Model model,
	        @SessionAttribute(name = "loginId", required = false) String loginId
	) {
	    if (loginId == null) return "redirect:/login";
	    Shop shop = shopService.findByShopIdAndOwnerId(sId, loginId);
	    if (shop == null) {
	        model.addAttribute("message", "가게를 찾을 수 없습니다.");
	        return "shop/errorPage";
	    }
	    List<String[]> openTimeList = shopService.getOpenTimeList(shop);

	    // 요일 리스트 직접 추가
	    List<String> daysOfWeek = Arrays.asList("월", "화", "수", "목", "금", "토", "일");
	    model.addAttribute("shop", shop);
	    model.addAttribute("openTimeList", openTimeList);
	    model.addAttribute("daysOfWeek", daysOfWeek);
	    return "shop/shopOpenTime";
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
	
	
}



