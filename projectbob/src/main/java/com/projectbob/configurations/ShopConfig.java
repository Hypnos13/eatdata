package com.projectbob.configurations;

import com.projectbob.service.ShopService;
import com.projectbob.domain.Shop;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.SessionAttribute;

import java.util.List;

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
}