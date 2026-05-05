package com.nutriai.api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class HmacVerificationServiceTest {

    @Test
    void verify_validSignature_returnsTrue() {
        String secret = "test-secret";
        HmacVerificationService service = new HmacVerificationService(secret);
        String body = "test body";
        String sig = computeHmac(secret, body);
        assertTrue(service.verify(body, sig));
    }

    @Test
    void verify_invalidSignature_returnsFalse() {
        HmacVerificationService service = new HmacVerificationService("test-secret");
        assertFalse(service.verify("test body", "invalid-signature"));
    }

    @Test
    void verify_noSecretConfigured_returnsFalse() {
        HmacVerificationService service = new HmacVerificationService("");
        assertFalse(service.verify("any body", "any sig"));
    }

    @Test
    void verify_emptyBody_validSignature() {
        String secret = "test-secret";
        HmacVerificationService service = new HmacVerificationService(secret);
        String sig = computeHmac(secret, "");
        assertTrue(service.verify("", sig));
    }

    @Test
    void verify_withSha256Prefix_stripsPrefix() {
        String secret = "test-secret";
        HmacVerificationService service = new HmacVerificationService(secret);
        String body = "test body";
        String sig = "sha256=" + computeHmac(secret, body);
        assertTrue(service.verify(body, sig));
    }

    private String computeHmac(String secret, String body) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec keySpec = new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getEncoder().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
