package com.nutriai.api.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Configuration
public class JacksonConfig {

    @Bean
    public SimpleModule ptBRBigDecimalModule() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(BigDecimal.class, new PtBRBigDecimalDeserializer());
        return module;
    }

    static class PtBRBigDecimalDeserializer extends JsonDeserializer<BigDecimal> {

        @Override
        public BigDecimal deserialize(JsonParser p, DeserializationContext ctxt)
                throws IOException {
            JsonNode node = p.readValueAsTree();
            if (node.isNumber()) {
                return node.decimalValue();
            }
            if (node.isTextual()) {
                return parsePtBRDecimal(node.asText().trim());
            }
            throw new IllegalArgumentException(
                "Valor numérico inválido. Use formato como 4.5 ou 4,5.");
        }

        BigDecimal parsePtBRDecimal(String raw) {
            validateNotEmpty(raw);
            boolean negative = raw.startsWith("-");
            String working = negative ? raw.substring(1) : raw;
            working = working.replaceAll("[^0-9.,]", "");
            validateCleanInput(working, raw);
            String normalized = normalize(working, raw);
            return toBigDecimal(normalized, negative, raw);
        }

        private void validateNotEmpty(String raw) {
            if (raw.isEmpty()) {
                throw new IllegalArgumentException(
                    "Valor numérico vazio. Informe um número como 4.5 ou 4,5.");
            }
        }

        private void validateCleanInput(String working, String raw) {
            if (working.isEmpty()) {
                throw invalidFormat(raw);
            }
            if (working.contains("..") || working.contains(",,")) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Separadores duplicados não são permitidos.");
            }
            if (working.contains(",.") || working.contains(".,")) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Separadores adjacentes não são permitidos.");
            }
        }

        private String normalize(String working, String raw) {
            int firstComma = working.indexOf(',');
            int firstDot = working.indexOf('.');
            int lastComma = working.lastIndexOf(',');
            int lastDot = working.lastIndexOf('.');

            if (firstComma == -1 && firstDot == -1) {
                return working;
            }
            if (firstComma != -1 && firstDot != -1) {
                return normalizeMixed(working, raw, firstComma, firstDot,
                        lastComma, lastDot);
            }
            if (firstComma != -1) {
                return normalizeCommaOnly(working, firstComma, lastComma);
            }
            return normalizeDotOnly(working, firstDot, lastDot, raw);
        }

        private String normalizeMixed(String w, String raw,
                int fc, int fd, int lc, int ld) {
            long dotCount = w.chars().filter(c -> c == '.').count();
            long commaCount = w.chars().filter(c -> c == ',').count();
            if (dotCount > 1 && commaCount > 0) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw + "'. Formato ambíguo.");
            }
            if (dotCount == 1 && commaCount == 1
                    && Math.abs(fd - fc) <= 2) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Separadores muito próximos — formato ambíguo.");
            }
            if (lc > ld) {
                return w.substring(0, lc).replace(".", "")
                    + "." + w.substring(lc + 1);
            }
            return w.substring(0, ld).replace(",", "")
                + "." + w.substring(ld + 1);
        }

        private String normalizeCommaOnly(String w,
                int firstComma, int lastComma) {
            if (lastComma != firstComma) {
                return w.substring(0, lastComma).replace(",", "")
                    + "." + w.substring(lastComma + 1);
            }
            return w.substring(0, firstComma)
                + "." + w.substring(firstComma + 1);
        }

        private String normalizeDotOnly(String w,
                int firstDot, int lastDot, String raw) {
            long dotCount = w.chars().filter(c -> c == '.').count();
            if (dotCount > 1) {
                return normalizeThousandDot(w, raw);
            }
            String before = w.substring(0, firstDot);
            String after = w.substring(firstDot + 1);
            if (after.length() == 3 && !before.isEmpty()
                    && before.chars().allMatch(Character::isDigit)) {
                return before + after;
            }
            return before + "." + after;
        }

        private String normalizeThousandDot(String w, String raw) {
            String[] chunks = w.split("\\.");
            for (String chunk : chunks) {
                if (chunk.isEmpty()) {
                    throw new IllegalArgumentException(
                        "Valor numérico inválido: '" + raw
                        + "'. Separadores de milhar mal posicionados.");
                }
            }
            boolean allGrouped3 = true;
            for (int i = 0; i < chunks.length - 1; i++) {
                if (chunks[i].length() != 3) {
                    allGrouped3 = false;
                    break;
                }
            }
            String lastChunk = chunks[chunks.length - 1];
            if (allGrouped3 && lastChunk.length() == 3) {
                return w.replace(".", "");
            }
            throw new IllegalArgumentException(
                "Valor numérico inválido: '" + raw
                + "'. Separadores de milhar mal posicionados.");
        }

        private BigDecimal toBigDecimal(String normalized,
                boolean negative, String raw) {
            String sign = negative ? "-" : "";
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
                throw invalidFormat(raw);
            }
        }

        private IllegalArgumentException invalidFormat(String raw) {
            return new IllegalArgumentException(
                "Valor numérico inválido: '" + raw
                + "'. Use formato como 4.5 ou 4,5.");
        }
    }
}