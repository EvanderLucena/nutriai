package com.nutriai.api.dto.biometry;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateBiometryAssessmentRequest(
        LocalDate assessmentDate,
        @DecimalMin("0.1") BigDecimal weight,
        @DecimalMin("0.01") @DecimalMax("100") BigDecimal bodyFatPercent,
        @DecimalMin("0") BigDecimal leanMassKg,
        @DecimalMin("0") @DecimalMax("100") BigDecimal waterPercent,
        @PositiveOrZero Integer visceralFatLevel,
        @PositiveOrZero Integer bmrKcal,
        String device,
        String notes,
        @Valid List<SkinfoldEntry> skinfolds,
        @Valid List<PerimetryEntry> perimetry
) {
    public record SkinfoldEntry(
            @NotBlank String measureKey,
            @NotNull @DecimalMin("0") BigDecimal valueMm,
            @NotNull @Positive Integer sortOrder
    ) {}

    public record PerimetryEntry(
            @NotBlank String measureKey,
            @NotNull @DecimalMin("0") BigDecimal valueCm,
            @NotNull @Positive Integer sortOrder
    ) {}
}
