package com.nutriai.api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PhoneNormalizationServiceTest {

    private final PhoneNormalizationService service = new PhoneNormalizationService();

    @Test
    void normalize_fullInternationalFormat_strips55AndPlus() {
        Optional<String> result = service.normalize("+5511999988776");
        assertEquals(Optional.of("11999988776"), result);
    }

    @Test
    void normalize_overlongInternationalFormat_returnsEmpty() {
        Optional<String> result = service.normalize("+55119999887766");
        assertTrue(result.isEmpty());
    }

    @Test
    void normalize_withSpacesStrips_cleanNumber() {
        Optional<String> result = service.normalize("11 9 9988-7766");
        assertEquals(Optional.of("11999887766"), result);
    }

    @Test
    void normalize_alreadyNormalized_noChange() {
        Optional<String> result = service.normalize("11999887766");
        assertEquals(Optional.of("11999887766"), result);
    }

    @Test
    void normalize_landlineFormat_returns8Digits() {
        Optional<String> result = service.normalize("1133445566");
        assertEquals(Optional.of("1133445566"), result);
    }

    @Test
    void normalize_invalidShort_returnsEmpty() {
        Optional<String> result = service.normalize("123");
        assertTrue(result.isEmpty());
    }

    @Test
    void normalize_withDDDAndLandline_keeps10Digits() {
        Optional<String> result = service.normalize("551133445566");
        assertEquals(Optional.of("1133445566"), result);
    }
}
