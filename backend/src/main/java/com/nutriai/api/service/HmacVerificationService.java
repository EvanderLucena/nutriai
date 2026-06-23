package com.nutriai.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Authenticates incoming WhatsApp webhooks.
 *
 * Two strategies are supported, evaluated in order:
 * 1. HMAC-SHA256 signature (header "X-Hub-Signature-256") — used when NUTRIAI_WEBHOOK_SECRET is set.
 *    Required for custom integrations or Evolution API setups that forward an HMAC-signed body.
 * 2. Apikey header ("apikey") — used when NUTRIAI_WEBHOOK_SECRET is empty.
 *    This is the default Evolution API v2 auth model: the gateway echoes the configured
 *    AUTHENTICATION_API_KEY on every webhook call, so we verify it matches our known key.
 *
 * When neither secret nor apikey is configured, verification fails closed (403).
 */
@Service
public class HmacVerificationService {

    private static final Logger log = LoggerFactory.getLogger(HmacVerificationService.class);

    private final String secret;
    private final String evolutionApiKey;

    public HmacVerificationService(
            @Qualifier("webhookHmacSecret") String secret,
            @Qualifier("evolutionWebhookApiKey") String evolutionApiKey) {
        this.secret = secret;
        this.evolutionApiKey = evolutionApiKey;
    }

    /**
     * Verify an inbound webhook request.
     *
     * @param body             raw request body (used only for HMAC)
     * @param signatureHeader  value of "X-Hub-Signature-256" header (nullable)
     * @param apikeyHeader     value of "apikey" header (nullable) — Evolution API v2 default
     * @return true if the request is authenticated under any enabled strategy
     */
    public boolean verify(String body, String signatureHeader, String apikeyHeader) {
        // Strategy 1: HMAC (preferred when configured)
        if (secret != null && !secret.isBlank()) {
            return verifyHmac(body, signatureHeader);
        }

        // Strategy 2: Evolution API apikey header
        if (evolutionApiKey != null && !evolutionApiKey.isBlank()) {
            return verifyApikey(apikeyHeader);
        }

        // Fail closed — never accept unauthenticated webhooks by accident
        log.warn("Webhook auth: no strategy configured (neither HMAC secret nor Evolution apikey)");
        return false;
    }

    /**
     * Backwards-compatible overload for callers that only have the signature header.
     * Equivalent to calling {@link #verify} with a null apikey.
     */
    public boolean verify(String body, String signatureHeader) {
        return verify(body, signatureHeader, null);
    }

    private boolean verifyHmac(String body, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        String expected = computeHmac(body);
        String actual = signatureHeader.startsWith("sha256=")
                ? signatureHeader.substring(7)
                : signatureHeader;
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean verifyApikey(String apikeyHeader) {
        if (apikeyHeader == null || apikeyHeader.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                evolutionApiKey.getBytes(StandardCharsets.UTF_8),
                apikeyHeader.getBytes(StandardCharsets.UTF_8)
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
