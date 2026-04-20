package com.nutriai.api.controller;

import com.nutriai.api.repository.NutritionistRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private final NutritionistRepository nutritionistRepository;

    @Value("${nutriai.version:0.1.0}")
    private String version;

    public HealthController(NutritionistRepository nutritionistRepository) {
        this.nutritionistRepository = nutritionistRepository;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new java.util.LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("version", version);

        try {
            nutritionistRepository.count();
            response.put("status", "UP");
            response.put("db", "connected");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("db", "disconnected");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }
}