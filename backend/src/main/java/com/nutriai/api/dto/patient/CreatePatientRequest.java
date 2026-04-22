package com.nutriai.api.dto.patient;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePatientRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        LocalDate birthDate,

        @Pattern(regexp = "^[FM]$", message = "Sexo deve ser M ou F")
        String sex,

        @Min(50) @Max(300)
        Integer heightCm,

        @Size(max = 30)
        String whatsapp,

        @NotBlank(message = "Objetivo é obrigatório")
        String objective,

        @DecimalMin("0") @DecimalMax("500")
        BigDecimal weight
) {}