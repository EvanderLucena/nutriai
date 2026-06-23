package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.HmacVerificationService;
import com.nutriai.api.service.WebhookService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebhookControllerTest {

    @Mock WebhookService webhookService;
    @Mock HmacVerificationService hmacVerificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void receiveWebhook_validSignature_returns200() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "valid-sig", null)).thenReturn(true);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "valid-sig", null, request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_invalidSignature_returns403() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "bad-sig", null)).thenReturn(false);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "bad-sig", null, request);

        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_dedupMessage_returns200AndSkips() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "sig", null)).thenReturn(true);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.empty());

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "sig", null, request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_invalidPayload_returns400() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{invalid-json";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "sig", null)).thenReturn(true);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "sig", null, request);

        assertEquals(400, response.getStatusCode().value());
        verify(webhookService, never()).processIncoming(any());
    }

    @Test
    void receiveWebhook_validApikey_returns200_whenHmacNotUsed() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        // Evolution API v2 default auth: apikey header, no signature
        when(hmacVerificationService.verify(rawBody, null, "evolution-key")).thenReturn(true);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, null, "evolution-key", request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_missingBothAuthHeaders_returns403() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, null, null)).thenReturn(false);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, null, null, request);

        assertEquals(403, response.getStatusCode().value());
    }
}
