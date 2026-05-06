package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void receiveWebhook_validPayload_returns200() {
        WebhookController controller = new WebhookController(webhookService, objectMapper);
        String rawBody = "{\"event\":\"Message\",\"data\":{\"info\":{\"sender\":\"5511999999999@s.whatsapp.net\",\"id\":\"msg-123\"}},\"instanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(200, response.getStatusCode().value());
        verify(webhookService).processIncoming(any());
    }

    @Test
    void receiveWebhook_invalidPayload_returns400() {
        WebhookController controller = new WebhookController(webhookService, objectMapper);
        String rawBody = "{invalid-json";
        HttpServletRequest request = mock(HttpServletRequest.class);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(400, response.getStatusCode().value());
        verify(webhookService, never()).processIncoming(any());
    }
}
