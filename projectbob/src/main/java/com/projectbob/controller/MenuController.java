package com.projectbob.controller;

import java.io.*;
import java.util.*;

import org.springframework.beans.factory.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectbob.domain.*;
import com.projectbob.service.*;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
@RequestMapping("/shop")
public class MenuController {
	
	@Autowired
	private ShopService shopService;
	
	@Autowired
	private ObjectMapper objectMapper;
	
	// 메뉴 등록 폼으로 이동
	@GetMapping("/menuRegisterForm")
	public String showRegisterForm(@RequestParam("s_id") Integer sId, Model model) {
	    Menu menu = new Menu();
	    // 1. URL로부터 받은 sId를 새로운 Menu 객체에 설정
	    menu.setSId(sId);
	    // 2. sId가 설정된 menu 객체를 모델에 담아 뷰로 전달
	    model.addAttribute("menu", menu); 
	    
	    // 영업시간 안나와서 넣은거 - 준혁
	    Shop shop = shopService.findBySId(sId);
	    model.addAttribute("shop", shop);

	    return "/shop/menuRegisterForm";
	}
	// 메뉴 등록
	@PostMapping("/insertMenu")
	public String insertMenu(@ModelAttribute Menu menu,
	                         @RequestParam(value = "mPicture", required = false) MultipartFile mPicture,
	                         RedirectAttributes reAttrs) {
	    try {
	        shopService.insertMenu(menu, mPicture);
	        reAttrs.addFlashAttribute("message", "메뉴가 성공적으로 등록되었습니다.");
	    } catch (IOException e) {
	        log.error("메뉴 등록 중 파일 처리 오류: "+e.getMessage());
	        reAttrs.addFlashAttribute("errorMessage", "메뉴 등록에 실패했습니다.(파일 오류)");
	        return "redirect:/shop/menuRegisterForm";
	    } catch (Exception e) {
	        log.error("메뉴 등록 실패: "+e.getMessage(), e);
	        reAttrs.addFlashAttribute("errorMessage", "메뉴 등록에 실패했습니다.");
	        return "redirect:/shop/menuRegisterForm";
	    }
	    // 
	    return "redirect:/shop/menuList?s_id=" + menu.getSId();
	}
	// 메뉴 목록 페이지(전체 메뉴)
	@GetMapping("/menuList")
	public String getMenuList(@RequestParam("s_id") Integer sId, 
				@RequestParam(value = "category", required=false) String category , Model model) {
	    // 카테고리 목록 조회
		List<String> categories = shopService.getMenuCategoriesByShopId(sId);
		// sId로 해당 가게의 메뉴만 필터링해서 가져옴
	    List<Menu> menuList = shopService.getMenusByShopId(sId, category);
	    
	    // 영업시간 안나와서 넣은거 - 준혁
	    Shop shop = shopService.findBySId(sId);
	    model.addAttribute("shop", shop);
	    model.addAttribute("menuList", menuList);
	    model.addAttribute("categories", categories);
	    model.addAttribute("currentShopId", sId); // 새 메뉴 등록 시 sId를 넘겨주기 위해 추가
	    model.addAttribute("selectedCategory", category );
	    return "/shop/menuList";
	}
	
	// 메뉴 상태 변경
	@PostMapping("/menu/updateStatus")
	@ResponseBody
	public ResponseEntity<?> updateMenuStatus(@RequestBody Map<String, Object> payload) {
		try {
			Integer mId = (Integer) payload.get("mId");
			String currentStatus = (String) payload.get("status");
			// 현재 상태에 따라 새 상태 결정
			String newStatus = "판매중".equals(currentStatus) ? "품절" : "판매중";
			shopService.updateMenuStatus(mId, newStatus);
			// 성공 응답 반환
			return ResponseEntity.ok(Map.of("success", true, "newStatus", newStatus));
		} catch (Exception e) {
			log.error("메뉴 상태 변경 실패", e);
			return ResponseEntity.badRequest().body(Map.of("success", false));
		}
	}
	
	// 메뉴 수정 폼 이동
	@GetMapping("/menuUpdateForm")
	public String showUpdateForm(
	        @RequestParam("s_id") Integer sId, // 1. 현재 가게 ID를 받습니다.
	        @RequestParam(value = "mId", required = false) Integer mId, 
	        Model model) {

	    // 2. 드롭다운 목록을 현재 가게(sId)의 메뉴로만 채웁니다.
	    List<Menu> menuListForDropdown = shopService.getMenusByShopId(sId);
	    model.addAttribute("menuList", menuListForDropdown);
	    
	    // 영업시간 안나와서 넣은거 - 준혁
	    Shop shop = shopService.findBySId(sId);
	    model.addAttribute("shop", shop);

	    Menu selectedMenu = null;
	    if (mId != null) {
	        // 3. mId가 있으면, 해당 메뉴의 상세 정보를 불러옵니다.
	        selectedMenu = shopService.getMenuDetail(mId);
	    }

	    // 4. 만약 mId 없이 sId만 넘어왔다면, (드롭다운의 기본 선택값이 없도록) 빈 객체를 전달하거나
	    //    혹은 목록의 첫 번째 메뉴를 기본으로 보여줄 수도 있습니다. (현재는 null로 처리)
	    if (selectedMenu == null) {
	        selectedMenu = new Menu();
	        selectedMenu.setSId(sId); // sId는 기본으로 설정
	    }

	    try {
	        String menuJson = objectMapper.writeValueAsString(selectedMenu);
	        model.addAttribute("menuJson", menuJson);
	    } catch (JsonProcessingException e) {
	        log.error("메뉴 객체 JSON 변환 오류: " + e.getMessage());
	        model.addAttribute("menuJson", "{}");
	    }

	    model.addAttribute("menu", selectedMenu);
	    model.addAttribute("sId", sId); // 5. sId를 뷰에 전달하여 '목록으로' 버튼 등에서 사용

	    return "/shop/menuUpdateForm";
	}
	
	// 메뉴 수정 처리
	@PostMapping("/updateMenu")
	public String updateMenu(@ModelAttribute Menu menu, 
			@RequestParam(value = "mPicture", required = false) MultipartFile newMPicture,
			RedirectAttributes reAttrs) {
		try {
			shopService.updateMenu(menu, newMPicture);
			reAttrs.addFlashAttribute("message", "메뉴 수정이 정상적으로 처리되었습니다.");
		} catch (IOException e) {
			log.error("메뉴 수정 중 파일 처리 오류: " + e.getMessage());
			reAttrs.addFlashAttribute("errorMessage", "메뉴 정보 수정에 실패했습니다.(파일 오류)");
			return "redirect:/shop/menuUpdateForm?mId=" + menu.getMId();
		}
		return "redirect:/shop/menuList?s_id=" + menu.getSId();
	}
	// 메뉴 삭제 처리
	@PostMapping("/deleteMenu")
	public String deleteMenu(@RequestParam("mId") int mId, 
	                         @RequestParam("sId") int sId, 
	                         RedirectAttributes reAttrs) {
	    try {
	        // shopService.deleteMenuWithAuthorization(mId, loginId);
	        shopService.deleteMenu(mId); 
	        reAttrs.addFlashAttribute("message", "메뉴가 정상적으로 삭제되었습니다.");
	    } catch (Exception e) {
	        log.error("메뉴 삭제 실패: " + e.getMessage(), e);
	        reAttrs.addFlashAttribute("errorMessage", "메뉴 삭제에 실패했습니다.");
	    }
	    return "redirect:/shop/menuList?s_id=" + sId;
	}
	
}
