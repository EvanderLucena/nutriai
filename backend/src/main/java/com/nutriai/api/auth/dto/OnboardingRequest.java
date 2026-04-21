package com.nutriai.api.auth.dto;

public record OnboardingRequest(
        int step,
        boolean completed
) {}