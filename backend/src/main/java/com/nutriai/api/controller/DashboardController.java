package com.nutriai.api.controller;

import com.nutriai.api.auth.NutritionistAccess;
import com.nutriai.api.dto.ApiResponse;
import com.nutriai.api.dto.dashboard.DashboardResponse;
import com.nutriai.api.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> get() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        DashboardResponse response = dashboardService.getDashboard(nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}