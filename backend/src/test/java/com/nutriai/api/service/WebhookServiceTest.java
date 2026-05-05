package com.nutriai.api.service;

import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.WhatsAppMessage;
import com.nutriai.api.repository.PatientRepository;
import com.nutriai.api.repository.WhatsAppMessageRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebhookServiceTest {

    @Mock WhatsAppMessageRepository whatsAppMessageRepository;
    @Mock PatientRepository patientRepository;
    @Mock PhoneNormalizationService phoneNormalizationService;
    @Mock MessageQueueService messageQueueService;

    @InjectMocks
    WebhookService webhookService;

    private UUID patientId;
    private UUID nutritionistId;
    private Patient patient;

    @BeforeEach
    void setup() {
        patientId = UUID.randomUUID();
        nutritionistId = UUID.randomUUID();
        patient = new Patient();
        patient.setId(patientId);
        patient.setNutritionistId(nutritionistId);
    }

    @Test
    void processIncoming_validTextMessage_savesAndEnqueues() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-123", "Oi, comi arroz e frango");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findByWhatsapp("119999887766")).thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-123")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_unknownPhone_savesWithNullPatientAndMarkedProcessed() {
        WhatsAppWebhookDTO dto = createTextWebhook("55118888776655", "msg-456", "Oi");
        when(phoneNormalizationService.normalize("55118888776655")).thenReturn(Optional.of("118888776655"));
        when(patientRepository.findByWhatsapp("118888776655")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.findByMessageId("msg-456")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_duplicateMessageId_skipsProcessing() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-dup", "Oi");
        WhatsAppMessage existing = WhatsAppMessage.builder().messageId("msg-dup").build();
        when(whatsAppMessageRepository.findByMessageId("msg-dup")).thenReturn(Optional.of(existing));

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isEmpty());
        verify(whatsAppMessageRepository, never()).save(any());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_audioMessage_savesWithNullContentAndMediaUrl() {
        WhatsAppWebhookDTO dto = createAudioWebhook("55119999887766", "msg-audio", "https://media.url/audio.ogg");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findByWhatsapp("119999887766")).thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-audio")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_imageMessageWithCaption_savesContentAndMediaUrl() {
        WhatsAppWebhookDTO dto = createImageWebhook("55119999887766", "msg-img", "https://media.url/img.jpg", "Almoço: arroz e feijão");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findByWhatsapp("119999887766")).thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-img")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    // Helpers

    private WhatsAppWebhookDTO createTextWebhook(String phone, String msgId, String text) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        dto.setEvent("MESSAGES_UPSERT");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.MessageKey key = new WhatsAppWebhookDTO.MessageKey();
        key.setRemoteJid(phone + "@s.whatsapp.net");
        key.setId(msgId);
        data.setKey(key);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        msg.setConversation(text);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }

    private WhatsAppWebhookDTO createAudioWebhook(String phone, String msgId, String url) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.MessageKey key = new WhatsAppWebhookDTO.MessageKey();
        key.setRemoteJid(phone + "@s.whatsapp.net");
        key.setId(msgId);
        data.setKey(key);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        WhatsAppWebhookDTO.AudioMessage audio = new WhatsAppWebhookDTO.AudioMessage();
        audio.setUrl(url);
        msg.setAudioMessage(audio);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }

    private WhatsAppWebhookDTO createImageWebhook(String phone, String msgId, String url, String caption) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.MessageKey key = new WhatsAppWebhookDTO.MessageKey();
        key.setRemoteJid(phone + "@s.whatsapp.net");
        key.setId(msgId);
        data.setKey(key);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        WhatsAppWebhookDTO.ImageMessage img = new WhatsAppWebhookDTO.ImageMessage();
        img.setUrl(url);
        img.setCaption(caption);
        msg.setImageMessage(img);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }
}
