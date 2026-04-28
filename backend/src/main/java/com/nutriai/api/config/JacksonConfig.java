package com.nutriai.api.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        SimpleModule module = new SimpleModule();
        module.addDeserializer(BigDecimal.class, new PtBRBigDecimalDeserializer());
        mapper.registerModule(module);
        return mapper;
    }

    static class PtBRBigDecimalDeserializer extends JsonDeserializer<BigDecimal> {

        @Override
        public BigDecimal deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            JsonNode node = p.readValueAsTree();

            if (node.isNumber()) {
                return node.decimalValue();
            }

            if (node.isTextual()) {
                String raw = node.asText().trim();
                return parsePtBRDecimal(raw);
            }

            throw new IllegalArgumentException(
                "Valor numérico inválido. Use formato como 4.5 ou 4,5.");
        }

        BigDecimal parsePtBRDecimal(String raw) {
            if (raw.isEmpty()) {
                throw new IllegalArgumentException(
                    "Valor numérico vazio. Informe um número como 4.5 ou 4,5.");
            }

            boolean negative = raw.startsWith("-");
            String working = negative ? raw.substring(1) : raw;

            working = working.replaceAll("[^0-9.,]", "");

            if (working.isEmpty()) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido. Informe um número como 4.5 ou 4,5.");
            }

            int firstComma = working.indexOf(',');
            int firstDot = working.indexOf('.');
            int lastComma = working.lastIndexOf(',');
            int lastDot = working.lastIndexOf('.');
            String sign = negative ? "-" : "";
            String normalized;

            if (firstComma == -1 && firstDot == -1) {
                normalized = working;
            } else if (firstComma != -1 && firstDot != -1) {
                if (lastComma > lastDot) {
                    String beforeComma = working.substring(0, lastComma).replace(".", "");
                    String afterComma = working.substring(lastComma + 1);
                    normalized = beforeComma + "." + afterComma;
                } else {
                    String beforeDot = working.substring(0, lastDot).replace(",", "");
                    String afterDot = working.substring(lastDot + 1);
                    normalized = beforeDot + "." + afterDot;
                }
            } else if (firstComma != -1) {
                if (lastComma != firstComma) {
                    String before = working.substring(0, lastComma).replace(",", "");
                    String after = working.substring(lastComma + 1);
                    normalized = before + "." + after;
                } else {
                    String before = working.substring(0, firstComma);
                    String after = working.substring(firstComma + 1);
                    normalized = before + "." + after;
                }
            } else {
                long dotCount = working.chars().filter(c -> c == '.').count();
                if (dotCount > 1) {
                    normalized = working.replace(".", "");
                } else {
                    String before = working.substring(0, firstDot);
                    String after = working.substring(firstDot + 1);
                    if (after.length() == 3 && !before.isEmpty() && before.chars().allMatch(Character::isDigit)) {
                        normalized = before + after;
                    } else {
                        normalized = before + "." + after;
                    }
                }
            }

            try {
                BigDecimal result = new BigDecimal(sign + normalized);
                result = result.setScale(10, RoundingMode.HALF_UP);
                if (result.scale() > 0) {
                    result = result.stripTrailingZeros();
                }
                if (result.scale() < 0) {
                    result = result.setScale(0, RoundingMode.UNNECESSARY);
                }
                return result;
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw + "'. Use formato como 4.5 ou 4,5.");
            }
        }
    }
}