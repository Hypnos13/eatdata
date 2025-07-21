package com.projectbob.controller;

import java.io.*;
import java.util.*;

import org.springframework.beans.factory.annotation.*;
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
	public String showRegisterForm(Model model) {
		model.addAttribute("menu", new Menu()); //빈 Menu 객체를 넘겨 폼 바인딩 준비
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
	    return "redirect:/shop/menuList";
	}
	// 메뉴 목록 페이지(전체 메뉴)
	@GetMapping("/menuList")
	public String getMenuList(Model model) {
		List<Menu> menuList = shopService.getAllMenus();// 간단한 목록
		 for (Menu menu : menuList) {
			 System.out.println("Menu ID: " + menu.getMId() +
		                           ", Category: " + menu.getCategory() +
		                           ", Price: " + menu.getPrice() +
		                           ", Picture URL: " + menu.getMPictureUrl());
			 }
		model.addAttribute("menuList", menuList);
		return "/shop/menuList";
	}
	// 메뉴 수정 폼 이동
	@GetMapping("/menuUpdateForm")
	public String showUpdateForm(@RequestParam(value = "mId", required = false) Integer mId, Model model) {
		Menu selectedMenu = null;
		if(mId != null) {
			selectedMenu = shopService.getMenuDetail(mId);
		}
		if(selectedMenu != null) {
			try {
				// selectedMenu 객체를 JSON 문자열로 변환하여 모델에 추가 (JS에서 사용)
				String menuJson = objectMapper.writeValueAsString(selectedMenu);
				model.addAttribute("menuJson", menuJson);
			} catch (JsonProcessingException e) {
				log.error("메뉴 객체 JSON 변환 오류: " + e.getMessage());
				model.addAttribute("errorMessage", "메뉴 정보를 불러오는데 실패했습니다.");
			}
		} else {
			// mId가 없거나 메뉴를 찾지 못했을 경우 빈 Menu 객체 또는 Null 처리
			selectedMenu = new Menu(); // 새로운 매뉴 객체 생성
			model.addAttribute("menuJson", "{}");
		}
		model.addAttribute("menu", selectedMenu);
		model.addAttribute("menuList", shopService.getAllMenus());
		
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
