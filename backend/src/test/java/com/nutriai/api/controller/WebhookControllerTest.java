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
        when(hmacVerificationService.verify(rawBody, "valid-sig")).thenReturn(true);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "valid-sig", request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_invalidSignature_returns403() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "bad-sig")).thenReturn(false);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "bad-sig", request);

        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_dedupMessage_returns200AndSkips() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{\"event\":\"MESSAGES_UPSERT\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "sig")).thenReturn(true);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.empty());

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "sig", request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_invalidPayload_returns400() {
        WebhookController controller = new WebhookController(webhookService, hmacVerificationService, objectMapper);
        String rawBody = "{invalid-json";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(hmacVerificationService.verify(rawBody, "sig")).thenReturn(true);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, "sig", request);

        assertEquals(400, response.getStatusCode().value());
        verify(webhookService, never()).processIncoming(any());
    }
}
