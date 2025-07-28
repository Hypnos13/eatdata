package com.projectbob.service;

import java.io.*;
import java.sql.Timestamp;
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
	
    /* ---------- Menu ---------- */
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

	//가게별 메뉴 수 조회
	public int getMenuCount(int sId) {
		return shopMapper.countMenusByShopId(sId);
	}
	
	// 메뉴 리스트
	public List<Menu> getMenusByShopId(int sId) {
		return shopMapper.getMenusByShopId(sId);
	}
	

	//category 파라미터 추가
    public List<Menu> getMenusByShopId(int sId, String category) {
        return shopMapper.getMenusByShopId(sId, category);
    }
    //카테고리 목록 조회 서비스 추가
    public List<String> getMenuCategoriesByShopId(int sId) {
        return shopMapper.getMenuCategoriesByShopId(sId);
    }
	// 메뉴 상태 업데이트
	public void updateMenuStatus(int mId, String status) {
		shopMapper.updateMenuStatus(mId, status);
	}

	// 특정 메뉴 상세 조회(옵션 포함)
	public Menu getMenuDetail(int mId) {
	    Menu menu = shopMapper.getMenuById(mId); // 1. 메뉴 기본 정보 로드
	    if (menu != null) {
	        List<MenuOption> options = shopMapper.getMenuOptionsByMenuId(mId); // 2. 메뉴 옵션 로드
	        menu.setOptions(options); // 3. 로드된 옵션을 Menu 객체에 설정
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
	@Transactional
	public void deleteMenuWithAuthorization(int mId, String ownerId) {
	    Menu menu = shopMapper.getMenuById(mId);
	    if (menu == null) {
	        throw new IllegalArgumentException("존재하지 않는 메뉴입니다.");
	    }
	    // ★★★ 핵심: 메뉴의 가게(sId)가 로그인한 유저(ownerId)의 소유인지 확인
	    Shop shop = shopMapper.findByShopIdAndOwnerId(menu.getSId(), ownerId);
	    if (shop == null) {
	        // 남의 가게 메뉴를 지우려는 시도!
	        throw new SecurityException("해당 메뉴를 삭제할 권한이 없습니다.");
	    }

	    // 권한이 확인되었으므로 기존 삭제 로직 수행
	    deleteMenu(mId); 
	}
	// 웹 경로를 시스템 파일 경로로 변환하는 헬퍼 메서드
	private String convertWebPathToSystemPath(String webPath) {
		if (webPath == null || !webPath.startsWith("/images/")) {
			return null; // 유효하지 않은 웹 경로
		}
		String relativePath = webPath.substring("/images/".length());
		return fileUploadService.getUploadBaseDir() + File.separator + relativePath.replace("/", File.separator);
	}

	/* ---------- Shop ---------- */
	//가게 등록
	public void insertShop(Shop shop) {
		shopMapper.insertShop(shop);
	}
	
	@Transactional
	public void insertShop(Shop shop, MultipartFile sPicture, MultipartFile sLicense) throws IOException {
		//이미지 파일 처리
		if (sLicense != null && !sLicense.isEmpty()) {
			try {
				String fileUrl = fileUploadService.uploadFile(sLicense, "shop");
				shop.setSLicenseUrl(fileUrl);
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 등록: 라이센스 업로드 오류 - "+ e.getMessage());
				shop.setSLicenseUrl(null);
			}
		} else {
			shop.setSLicenseUrl(null); //파일이 없을 시 null 로
		}
		if (sPicture != null && !sPicture.isEmpty()) {
			try {
				String fileUrl = fileUploadService.uploadFile(sPicture, "shop");
				shop.setSPictureUrl(fileUrl);
			} catch (IllegalArgumentException e) {
				log.warn("메뉴 등록: 가게사진 업로드 오류 - "+ e.getMessage());
				shop.setSPictureUrl(null);
			}
		} else {
			shop.setSPictureUrl(null); //파일이 없을 시 null 로
		}
		shopMapper.insertShop(shop);
	}
	
	//가게 리스트
	public List<Shop> shopList() {
		return shopMapper.shopList();
	}
	
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
	
	//메뉴 컨트롤러 shop 모델 추가
	public Shop findBySId(int sId) {
	    return shopMapper.findBySId(sId);
	}
	
	//기본정보 수정
	public void updateShopBasicInfo(Shop shop) {
	    // 업데이트 후 로그
	    int result = shopMapper.updateShopBasicInfo(shop);
	    log.info("업데이트 결과: {}", result);
	}
	
	// 가게 운영상태 변경 요청
	public void updateShopStatus(Integer sId, String status) {
	    shopMapper.updateShopStatus(sId, status);
	}
	
	//영업시간 정보
	public List<String[]> getOpenTimeList(Shop shop) {
	    String opTime = shop.getOpTime();
	    List<String[]> result = new ArrayList<>();
	    if (opTime == null || opTime.isBlank()) {
	        for (int i = 0; i < 7; i++) result.add(new String[]{"-", "-"});
	        return result;
	    }
	    String[] arr = opTime.split(";");
	    for (String s : arr) {
	        s = s.trim();
	        if (s.equals("-,-") || s.isBlank()) {
	            result.add(new String[]{"휴무", ""});
	        } else {
	            String[] t = s.split(",");
	            if (t.length == 2) result.add(new String[]{t[0].trim(), t[1].trim()});
	            else result.add(new String[]{"-", "-"});
	        }
	    }
	    while (result.size() < 7) result.add(new String[]{"-", "-"});
	    return result;

	}
	
	//영업시간 업데이트
	public void updateShopOpenTime(Shop shop) {
	    shopMapper.updateShopOpenTime(shop);
	}
	
	//텍스트라인 헬퍼
	public List<String> buildOpenTextLines(Shop shop) {
	    List<String[]> list = getOpenTimeList(shop);
	    String[] days = {"월","화","수","목","금","토","일"};
	    List<String> lines = new ArrayList<>();
	    for (int i=0;i<7;i++) {
	        String[] t = list.get(i);
	        if ("휴무".equals(t[0])) {
	            lines.add(days[i] + "요일 : 휴무");
	        } else {
	            lines.add(days[i] + "요일 : " + t[0] + " ~ " + t[1]);
	        }
	    }
	    return lines;
	}
	
	// 사장님 공지 & 정보 업데이트
	@Transactional
    public void updateShopNotice(Integer sId, String notice) {
        shopMapper.updateShopNotice(sId, notice);
    }

    @Transactional
    public void updateShopInfo(Integer sId, String sInfo) {
        shopMapper.updateShopInfo(sId, sInfo);
    }
    
}
