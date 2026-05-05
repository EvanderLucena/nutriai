package com.nutriai.api.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * HMAC-SHA256 verification for incoming WhatsApp webhooks.
 * Uses timing-safe comparison to prevent timing attacks.
 */
@Service
public class HmacVerificationService {

    private final String secret;

    public HmacVerificationService(@Qualifier("webhookHmacSecret") String secret) {
        this.secret = secret;
    }

    /**
     * Verify HMAC-SHA256 signature of request body.
     * Rejects requests when the secret is not configured so unauthenticated
     * webhooks are never accepted by accident.
     */
    public boolean verify(String body, String signatureHeader) {
        if (secret == null || secret.isBlank()) {
            return false;
        }

        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }

        String expected = computeHmac(body);
        // Strip "sha256=" prefix if present (standard GitHub/Facebook format)
        String actual = signatureHeader.startsWith("sha256=")
                ? signatureHeader.substring(7)
                : signatureHeader;

        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String computeHmac(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC", e);
        }
    }
}
