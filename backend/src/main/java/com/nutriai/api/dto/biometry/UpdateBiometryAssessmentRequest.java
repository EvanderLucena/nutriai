package com.nutriai.api.dto.biometry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateBiometryAssessmentRequest(
        LocalDate assessmentDate,
        BigDecimal weight,
        BigDecimal bodyFatPercent,
        BigDecimal leanMassKg,
        BigDecimal waterPercent,
        Integer visceralFatLevel,
        Integer bmrKcal,
        String device,
        String notes,
        List<SkinfoldEntry> skinfolds,
        List<PerimetryEntry> perimetry
) {
    public record SkinfoldEntry(
            String measureKey,
            BigDecimal valueMm,
            Integer sortOrder
    ) {}

    public record PerimetryEntry(
            String measureKey,
            BigDecimal valueCm,
            Integer sortOrder
    ) {}
}