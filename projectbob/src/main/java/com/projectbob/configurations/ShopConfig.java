package com.projectbob.configurations;

import com.projectbob.service.ShopService;
import com.projectbob.domain.Shop;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.SessionAttribute;

import java.util.List;
import java.util.Map;

@ControllerAdvice
public class ShopConfig {
    @Autowired
    private ShopService shopService;

    @ModelAttribute("shopListMain")
    public List<Shop> populateShopListMain(
        @SessionAttribute(name = "loginId", required = false) String loginId
    ) {
        if (loginId == null) return null;
        return shopService.findShopListByOwnerId(loginId);
    }
    
    @ModelAttribute("currentShop")
    public Shop populateCurrentShop(@RequestParam(name="s_id", required=false) Integer sId,
                                    @SessionAttribute(name="loginId", required=false) String loginId) {
        if (sId != null && loginId != null) {
            return shopService.findByShopIdAndOwnerId(sId, loginId);
        }
        return null;
    }
    
    /** 영업시간 텍스트 라인 */
    @ModelAttribute("openTextMap")
    public Map<Integer, List<String>> populateOpenTextMap(
            @ModelAttribute("shopListMain") List<Shop> shops) {

        if (shops == null) return java.util.Collections.emptyMap();

        String[] days = {"월","화","수","목","금","토","일"};
        Map<Integer, List<String>> map = new java.util.HashMap<>();

        for (Shop s : shops) {
            List<String[]> raw = shopService.getOpenTimeList(s);
            List<String> lines = new java.util.ArrayList<>();
            for (int i = 0; i < 7; i++) {
                String open = raw.get(i)[0];
                String close = raw.get(i)[1];
                boolean closed = open == null || open.isBlank() || "휴무".equals(open) || "-".equals(open);
                lines.add(days[i] + "요일 : " + (closed ? "휴무" : open + " ~ " + close));
            }
            map.put(s.getSId(), lines);
        }
        return map;
    }
    
    /* 영업시간 불러올때 쓸 코드
    <ul class="mb-0 ps-3" th:each="line : ${openTextMap[shop.sId]}">
    	<li th:text="${line}"></li>
  	</ul>
    */

}