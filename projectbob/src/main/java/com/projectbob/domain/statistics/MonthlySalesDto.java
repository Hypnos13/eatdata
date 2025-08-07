package com.projectbob.domain.statistics;

import lombok.Data;

/**
 * 월별 매출 통계 결과를 담는 DTO
 */
@Data
public class MonthlySalesDto {
    // 월 (예: "2025-08")
    private String month;
    
    // 해당 월의 총 매출액
    private long totalSales;
}