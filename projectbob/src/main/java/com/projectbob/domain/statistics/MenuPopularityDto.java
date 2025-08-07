package com.projectbob.domain.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메뉴별 주문 횟수(인기) 통계 결과를 담는 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuPopularityDto {
    // 메뉴 이름
    private String menuName;
    
    // 해당 메뉴가 주문된 총 횟수
    private long orderCount;
}