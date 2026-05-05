package com.nutriai.api.controller;

import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.HmacVerificationService;
import com.nutriai.api.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;

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

    public WebhookController(WebhookService webhookService,
                             HmacVerificationService hmacVerificationService) {
        this.webhookService = webhookService;
        this.hmacVerificationService = hmacVerificationService;
    }

    @PostMapping
    public ResponseEntity<Void> receiveWebhook(
            @RequestBody WhatsAppWebhookDTO payload,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            HttpServletRequest request) {

        // Read raw body for HMAC verification
        String rawBody = readBody(request);

        // Verify HMAC signature
        if (!hmacVerificationService.verify(rawBody, signature)) {
            log.warn("Invalid HMAC signature for webhook from {}", request.getRemoteAddr());
            return ResponseEntity.status(403).build();
        }

        // Process the webhook
        webhookService.processIncoming(payload);

        // Return 200 immediately — processing is async (D-08)
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Void> verifyWebhook() {
        // Simple GET for webhook verification / health checks
        return ResponseEntity.ok().build();
    }

    private String readBody(HttpServletRequest request) {
        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } catch (IOException e) {
            log.error("Failed to read request body", e);
            return "";
        }
    }
}
