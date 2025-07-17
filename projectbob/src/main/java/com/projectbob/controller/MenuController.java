package com.projectbob.controller;

import java.io.*;
import java.util.*;

import org.springframework.beans.factory.annotation.*;
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
@RequestMapping("/shop")
public class MenuController {
	
	@Autowired
	private ShopService shopService;
	
	// 메뉴 등록 폼으로 이동
	@GetMapping("/menuRegisterForm")
	public String showRegisterForm(Model model) {
		model.addAttribute("menu", new Menu()); //빈 Menu 객체를 넘겨 폼 바인딩 준비
		return "/shop/menuRegisterForm";
	}
	// 메뉴 등록
	@PostMapping("/insertMenu")
	public String insertMenu(@ModelAttribute Menu menu, //Menu 객체와 그 안의 options 리스트가 자동으로 바인딩됨 
							 @RequestParam(value = "mPicture", required = false) MultipartFile mPicture, 
							 RedirectAttributes reAttrs) {
		try {
			shopService.insertMenu(menu, mPicture);
			reAttrs.addFlashAttribute("message", "메뉴가 성공적으로 등록되었습니다.");
		} catch (IOException e) {
			log.error("메뉴 등록 중 파일 처리 오류: "+e.getMessage());
			reAttrs.addFlashAttribute("errorMessage", "메뉴 등록에 실패했습니다.(파일 오류)");
			return "redirect:/shop/menuRegisterFrom";
		} catch (Exception e) {
			log.error("메뉴 등록 실패: "+e.getMessage(), e);
			reAttrs.addFlashAttribute("errorMessage", "메뉴 등록에 실패했습니다.");
			return "redirect:/shop/menuRegisterFrom";
		}
		return "redirect:/menuList";
	}
	// 메뉴 목록 페이지(전체 메뉴)
	@GetMapping("/menuList")
	public String getMenuList(Model model) {
		List<Menu> menuList = shopService.getAllMenus();// 간단한 목록
		model.addAttribute("menuList", menuList);
		return "/shop/menuList";
	}
	// 메뉴 수정 폼 이동
	@GetMapping("/menuUpdateForm")
	public String showUpdateForm(@RequestParam(value = "mId", required = false) Integer mId, Model model) {
		List<Menu> menuList = shopService.getAllMenus();// 드롭다운에 전체 메뉴 출력
		model.addAttribute("menuList", menuList);
		
		Menu menu = new Menu();
		if (mId != null) {
			Menu selectedMenu = shopService.getMenuDetail(mId); //옵션 포함
			if(selectedMenu != null) {
				menu = selectedMenu;
			} else {
				model.addAttribute("errorMessage", "선택한 메뉴를 찾을 수 없습니다.");
			}
		}
		model.addAttribute("menu", menu);// 최종적으로 폼에 바인딩할 메뉴 객체 전달
		
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
		return "redirect:/shop/menuList";
	}
	// 메뉴 삭제 처리
	@PostMapping("/deleteMenu")
	public String deleteMenu(@RequestParam("mId") int mId, RedirectAttributes reAttrs) {
		try {
			shopService.deleteMenu(mId);
			reAttrs.addFlashAttribute("message", "메뉴가 정상적으로 삭제되었습니다.");
		} catch (Exception e) {
			log.error("메뉴 삭제 실패: " + e.getMessage(), e);
			reAttrs.addFlashAttribute("errorMeaage", "메뉴 삭제에 실패했습니다.");
		}
		return "redirect:/shop/menuList";
	}
	
}
