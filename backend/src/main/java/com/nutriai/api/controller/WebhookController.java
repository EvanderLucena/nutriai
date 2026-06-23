package com.nutriai.api.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.HmacVerificationService;
import com.nutriai.api.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public webhook endpoint for Evolution API WhatsApp callbacks.
 * No @PreAuthorize — validated via HMAC signature (D-06, D-07).
 */
@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final WebhookService webhookService;
    private final HmacVerificationService hmacVerificationService;
    private final ObjectMapper objectMapper;

    public WebhookController(WebhookService webhookService,
                             HmacVerificationService hmacVerificationService,
                             ObjectMapper objectMapper) {
        this.webhookService = webhookService;
        this.hmacVerificationService = hmacVerificationService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<Void> receiveWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "apikey", required = false) String apikey,
            HttpServletRequest request) {

        // Verify webhook — HMAC if configured, otherwise Evolution API apikey header
        if (!hmacVerificationService.verify(rawBody, signature, apikey)) {
            log.warn("Invalid webhook auth from {} (signaturePresent={}, apikeyPresent={})",
                    request.getRemoteAddr(), signature != null, apikey != null);
            return ResponseEntity.status(403).build();
        }

        WhatsAppWebhookDTO payload = parsePayload(rawBody);
        if (payload == null) {
            log.warn("Invalid webhook payload from {}", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // Process the webhook
        webhookService.processIncoming(payload);

        // Return 200 immediately — processing is async (D-08)
        return ResponseEntity.ok().build();
    }

    private WhatsAppWebhookDTO parsePayload(String rawBody) {
        try {
            return objectMapper.readValue(rawBody, WhatsAppWebhookDTO.class);
        } catch (JsonProcessingException e) {
            log.debug("Failed to deserialize WhatsApp webhook payload", e);
            return null;
        }
    }
}
