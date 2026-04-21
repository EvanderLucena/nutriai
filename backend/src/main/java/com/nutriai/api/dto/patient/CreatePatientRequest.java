package com.nutriai.api.dto.patient;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreatePatientRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        @Min(0) @Max(150)
        Integer age,

        @NotBlank(message = "Objetivo é obrigatório")
        String objective,

        @DecimalMin("0") @DecimalMax("500")
        BigDecimal weight
) {}