package com.nutriai.api.dto.patient;

import com.nutriai.api.model.Patient;

import java.math.BigDecimal;
import java.util.UUID;

public record PatientResponse(
        UUID id,
        String name,
        String initials,
        Integer age,
        String objective,
        String status,
        Integer adherence,
        BigDecimal weight,
        BigDecimal weightDelta,
        String tag,
        Boolean active
) {
    public static PatientResponse from(Patient p) {
        return new PatientResponse(
                p.getId(),
                p.getName(),
                p.getInitials(),
                p.getAge(),
                p.getObjective().name(),
                p.getStatus().name(),
                p.getAdherence(),
                p.getWeight(),
                p.getWeightDelta(),
                p.getTag(),
                p.getActive()
        );
    }
}