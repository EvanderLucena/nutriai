package com.nutriai.api.dto.biometry;

import com.nutriai.api.model.BiometryAssessment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BiometryAssessmentResponse(
        UUID id,
        UUID episodeId,
        LocalDate assessmentDate,
        BigDecimal weight,
        BigDecimal bodyFatPercent,
        BigDecimal leanMassKg,
        BigDecimal waterPercent,
        Integer visceralFatLevel,
        Integer bmrKcal,
        String device,
        String notes,
        List<SkinfoldResponse> skinfolds,
        List<PerimetryResponse> perimetry
) {
    public record SkinfoldResponse(
            UUID id,
            String measureKey,
            BigDecimal valueMm,
            Integer sortOrder
    ) {}

    public record PerimetryResponse(
            UUID id,
            String measureKey,
            BigDecimal valueCm,
            Integer sortOrder
    ) {}

    public static BiometryAssessmentResponse from(BiometryAssessment a) {
        return new BiometryAssessmentResponse(
                a.getId(),
                a.getEpisodeId(),
                a.getAssessmentDate(),
                a.getWeight(),
                a.getBodyFatPercent(),
                a.getLeanMassKg(),
                a.getWaterPercent(),
                a.getVisceralFatLevel(),
                a.getBmrKcal(),
                a.getDevice(),
                a.getNotes(),
                a.getSkinfolds() != null ? a.getSkinfolds().stream()
                        .map(s -> new SkinfoldResponse(s.getId(), s.getMeasureKey(), s.getValueMm(), s.getSortOrder()))
                        .toList() : List.of(),
                a.getPerimetries() != null ? a.getPerimetries().stream()
                        .map(p -> new PerimetryResponse(p.getId(), p.getMeasureKey(), p.getValueCm(), p.getSortOrder()))
                        .toList() : List.of()
        );
    }
}