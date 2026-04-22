package com.nutriai.api.dto.patient;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdatePatientRequest(
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        LocalDate birthDate,

        @Pattern(regexp = "^[FM]$", message = "Sexo deve ser M ou F")
        String sex,

        @Min(50) @Max(300)
        Integer heightCm,

        @Size(max = 30)
        String whatsapp,

        String objective,

        String status,

        BigDecimal weight,

        BigDecimal weightDelta,

        @Min(0) @Max(100)
        Integer adherence,

        @Size(max = 50)
        String tag
) {}