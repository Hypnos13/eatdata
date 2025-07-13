package com.projectbob.controller;

import org.springframework.beans.factory.annotation.*;

import java.io.IOException;
import java.util.*;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.projectbob.domain.*;
import com.projectbob.service.*;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
@RequestMapping("/owner")
public class ShopController {
	
	@Autowired
	private ShopService shopService;
	
	@Autowired
	private FileUploadService fileUploadService;
	
	@PostMapping("/insertShop")
	public String insertShop(
			@RequestParam("sNumber") String sNumber, @RequestParam("owner") String owner, 
			@RequestParam("phone") String phone, @RequestParam("name") String name, 
			@RequestParam("zipcode") String zipcode, @RequestParam("address1") String address1, 
			@RequestParam("address2") String address2, @RequestParam("sLicenseFile") MultipartFile sLicenseFile, 
			Model model ) {
		
		String sLicenseUrl = null; // DB에 저장할 사업자등록증 URL

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
            return "owner/shop_register_form";
        } catch (IOException e) {
            e.printStackTrace();
            model.addAttribute("errorMessage", "파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            return "owner/shop_register_form";
        }

        // 3. 모든 정보 (sLicenseUrl 포함)를 DB에 저장하는 로직
        // (가정) Shop 엔티티와 ShopService를 사용
        // Shop shop = new Shop();
        // shop.setsNumber(sNumber);
        // shop.setOwner(owner);
        // shop.setPhone(phone);
        // shop.setName(shopName);
        // shop.setZipcode(zipcode);
        // shop.setAddress1(address1);
        // shop.setAddress2(address2);
        // shop.setsLicenseUrl(sLicenseUrl); // DB에 파일의 웹 접근 URL 저장
        // // if (shopImageUrl != null) shop.setShopImageUrl(shopImageUrl); // 가게사진도 있다면 저장

        // shopService.saveShop(shop); // DB 저장 로직 호출

        model.addAttribute("message", "가게 정보가 성공적으로 등록되었습니다.");
		return "redirect:oMain";
	}
	
	
	@GetMapping("/shopMain")
	public String shopMain() {
		return "shop/shopMain";
	}
	
	@PostMapping("/insertMenu")
	public String insertMenu(Menu menu) {
		System.out.println("id test"+menu.getSId());
		shopService.insertMenu(menu);
		return "redirect:shopMain";
	}
	
	@GetMapping("/menuJoinForm")
	public String menuJoinForm() {
		return "shop/menuJoinForm";
	}
	
	@GetMapping("/shopInfo")
	public String shopInfo() {
		return "shop/shopInfo";
	}
	
	@GetMapping("/shopBasicSet")
	public String shopBasicSet() {
		return "shop/shopBasicSet";
	}
}
