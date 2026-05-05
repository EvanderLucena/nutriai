package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.HmacVerificationService;
import com.nutriai.api.service.WebhookService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import jakarta.servlet.http.HttpServletRequest;

import java.io.BufferedReader;
import java.io.StringReader;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebhookControllerTest {

    @Mock WebhookService webhookService;
    @Mock HmacVerificationService hmacVerificationService;

    @InjectMocks
    WebhookController controller;

    @Test
    void receiveWebhook_validSignature_returns200() throws Exception {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setEvent("MESSAGES_UPSERT");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{}")));
        when(hmacVerificationService.verify("{}", "valid-sig")).thenReturn(true);
        when(webhookService.processIncoming(dto)).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(dto, "valid-sig", request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_invalidSignature_returns403() throws Exception {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{}")));
        when(hmacVerificationService.verify("{}", "bad-sig")).thenReturn(false);

        ResponseEntity<Void> response = controller.receiveWebhook(dto, "bad-sig", request);

        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_dedupMessage_returns200AndSkips() throws Exception {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{}")));
        when(hmacVerificationService.verify("{}", "sig")).thenReturn(true);
        when(webhookService.processIncoming(dto)).thenReturn(Optional.empty());

        ResponseEntity<Void> response = controller.receiveWebhook(dto, "sig", request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void receiveWebhook_missingSignature_devMode_returns200() throws Exception {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{}")));
        when(hmacVerificationService.verify("{}", null)).thenReturn(true);
        when(webhookService.processIncoming(dto)).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(dto, null, request);

        assertEquals(200, response.getStatusCode().value());
    }
}
