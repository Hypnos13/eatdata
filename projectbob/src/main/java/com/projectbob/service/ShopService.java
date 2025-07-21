package com.projectbob.service;

import java.io.*;
import java.util.*;

import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import com.projectbob.domain.*;
import com.projectbob.mapper.*;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ShopService {
	
	@Autowired
	private ShopMapper shopMapper;
	
	@Autowired
	private FileUploadService fileUploadService;
	
	//가게 등록
	public void insertShop(Shop shop) {
		shopMapper.insertShop(shop);
	}
	
	//가게 리스트
	public List<Shop> shopList() {
		return shopMapper.shopList();
	}
	
<<<<<<< HEAD
	// 메뉴 등록
	@Transactional
	public void insertMenu(Menu menu, MultipartFile mPicture) throws IOException {
		//이미지 파일 처리
		if (mPicture != null && !mPicture.isEmpty()) {
			try {
				String fileUrl = fileUploadService.uploadFile(mPicture, "menu");
				menu.setMPictureUrl(fileUrl);
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 등록: 파일 업로드 오류 - "+ e.getMessage());
				menu.setMPictureUrl(null);
			}
		} else {
			menu.setMPictureUrl(null); //파일이 없을 시 null 로
		}
		shopMapper.insertMenu(menu);
		// 메뉴 옵션 등록
		if(menu.getOptions() != null && !menu.getOptions().isEmpty()) {
			for(MenuOption option : menu.getOptions()) {
				if(option != null && StringUtils.hasText(option.getMOption()) && StringUtils.hasText(option.getContent())) {
					option.setMId(menu.getMId());
					option.setStatus("active");
					shopMapper.insertMenuOption(option);
				}
			}
		}
	}
	//모든 메뉴 목록 조회
	public List<Menu> getAllMenus() {
		return shopMapper.getAllMenus();
	}
	// 특정 메뉴 상세 조회(옵션 포함)
	public Menu getMenuDetail(int mId) {
	    Menu menu = shopMapper.getMenuById(mId); // 1. 메뉴 기본 정보 로드
	    if (menu != null) {
	        List<MenuOption> options = shopMapper.getMenuOptionsByMenuId(mId); // 2. 메뉴 옵션 로드

	        // ★★★ 이 지점 (2번 라인 바로 다음)에 브레이크포인트 설정 ★★★
	        // 이 시점에서 `options` 리스트의 내용을 디버거의 변수 창에서 확인하세요.
	        // 예를 들어, mId가 7인 메뉴를 불러왔다면, options 리스트에 2개의 MenuOption 객체가 담겨 있어야 합니다.
	        // 각 MenuOption 객체의 필드(mOption, content, price 등)에 값이 제대로 들어있는지 확인하세요.

	        menu.setOptions(options); // 3. 로드된 옵션을 Menu 객체에 설정

	        // ★★★ 이 지점 (3번 라인 바로 다음)에도 브레이크포인트 설정 ★★★
	        // 이 시점에서 `menu` 객체 자체를 확인하세요.
	        // `menu.options` 필드에 방금 로드한 options 리스트가 제대로 설정되어 있는지 확인합니다.
	    }
	    return menu;
	}
	// 메뉴 정보 수정
	@Transactional
	public void updateMenu(Menu menu, MultipartFile newMPicture) throws IOException {
		String newPictureUrl = menu.getMPictureUrl(); // 기존 URL
		if (newMPicture != null && !newMPicture.isEmpty()) {
			// 새 파일이 업로드 된 경우 - 기존 파일 삭제 후 새 파일 저장
			Menu existingMenu = shopMapper.getMenuById(menu.getMId());
			if (existingMenu != null && StringUtils.hasText(existingMenu.getMPictureUrl())) {
				// 기존 URL에서 파일 경로 추출
				String oldFilePath = convertWebPathToSystemPath(existingMenu.getMPictureUrl());
				File oldFile = new File(oldFilePath);
				if (oldFile.exists()) {
					if (oldFile.delete()) {
						log.info("기존 메뉴 이미지 삭제: " + oldFile.getAbsolutePath());
					} else {
						log.warn("기존 메뉴 이미지 삭제 실패: "+ oldFile.getAbsolutePath());
					}
				}
			}
			try { // 새 파일 업로드
				newPictureUrl = fileUploadService.uploadFile(newMPicture, "menu");
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 수정: 새 파일 업로드 오류 - " + e.getMessage());
			}
		} else { // 새 파일이 업로드 되지 않은 경우: 기존 파일 URL을 유지
			Menu existingMenu = shopMapper.getMenuById(menu.getMId());
			if(existingMenu != null) {
				newPictureUrl = existingMenu.getMPictureUrl();
			}
		}
		menu.setMPictureUrl(newPictureUrl);
		
		shopMapper.updateMenu(menu);
		// 기존 옵션 삭제
		shopMapper.deleteMenuOptionsByMenuId(menu.getMId());
		if (menu.getOptions() != null && !menu.getOptions().isEmpty()) {
			for(MenuOption option : menu.getOptions()) {
				// 옵션의 이름과 내용이 비어있지 않고, 유효한 옵션만 저장
				if(option != null && StringUtils.hasText(option.getMOption()) && StringUtils.hasText(option.getContent()) 
							&& !"deleted".equals(option.getStatus())) {
					option.setMId(menu.getMId());
					option.setStatus("active");
					shopMapper.insertMenuOption(option);
				}
			}
		}
	}
	// 메뉴 삭제(관련 옵션 및 이미지파일 모두 삭제)
	@Transactional
	public void deleteMenu(int mId) {
		Menu menuToDelete = shopMapper.getMenuById(mId);
		shopMapper.deleteMenuOptionsByMenuId(mId);
		shopMapper.deleteMenu(mId);
		
		if(menuToDelete != null && StringUtils.hasText(menuToDelete.getMPictureUrl())) {
			String imageFilePath = convertWebPathToSystemPath(menuToDelete.getMPictureUrl());
			File imageFile = new File(imageFilePath);
			if(imageFile.exists()) {
				if(imageFile.delete()) {
					log.info("메뉴에 따른 이미지 파일 삭제: " + imageFile.getAbsolutePath());
				} else {
					log.warn("메뉴에 따른 이미지 파일 삭제 실패: " + imageFile.getAbsolutePath());
				}
			}
		}
	}
	// 웹 경로를 시스템 파일 경로로 변환하는 헬퍼 메서드
	private String convertWebPathToSystemPath(String webPath) {
		if (webPath == null || !webPath.startsWith("/images/")) {
			return null; // 유효하지 않은 웹 경로
		}
		String relativePath = webPath.substring("/images/".length());
		return fileUploadService.getUploadBaseDir() + File.separator + relativePath.replace("/", File.separator);
=======
	//가게 정보 불러오기
	public Shop findByOwnerId(String ownerId) {
	    return shopMapper.findByOwnerId(ownerId);
	}
	
	//가게 유무 판단해서 보여주기
	public List<Shop> findShopListByOwnerId(String ownerId) {
	    return shopMapper.findShopListByOwnerId(ownerId);
	}
	
	//다수 가게에서 현재 선택한 가게고정
	public Shop findByShopIdAndOwnerId(Integer sId, String ownerId) {
	    log.debug("가게 조회 요청 - sId: {}, ownerId: {}", sId, ownerId);
	    Shop shop = shopMapper.findByShopIdAndOwnerId(sId, ownerId);
	    if (shop == null) {
	        log.warn("가게를 찾을 수 없습니다. sId={}, ownerId={}", sId, ownerId);
	    }
	    return shop;
	}
	
	//기본정보 수정
	public void updateShopBasicInfo(Shop shop) {
	    // 업데이트 후 로그
	    int result = shopMapper.updateShopBasicInfo(shop);
	    log.info("업데이트 결과: {}", result);
	}
	
	public List<String[]> getOpenTimeList(Shop shop) {
	    String opTime = shop.getOpTime();
	    List<String[]> result = new ArrayList<>();
	    if (opTime == null || opTime.isBlank()) {
	        for (int i = 0; i < 7; i++) result.add(new String[] {"-", "-"});
	        return result;
	    }
	    String[] arr = opTime.split(",");
	    for (String s : arr) {
	        if (s.equals("휴무") || s.isBlank()) {
	            result.add(new String[] {"휴무", ""});
	        } else {
	            String[] t = s.split("-");
	            if (t.length == 2) result.add(new String[] {t[0], t[1]});
	            else result.add(new String[] {"-", "-"});
	        }
	    }
	    while (result.size() < 7) result.add(new String[] {"-", "-"});
	    return result;
>>>>>>> develop
	}
	
}
