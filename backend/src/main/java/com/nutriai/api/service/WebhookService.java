package com.nutriai.api.service;

import com.nutriai.api.dto.whatsapp.WebhookMessageDTO;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.WhatsAppMessage;
import com.nutriai.api.repository.PatientRepository;
import com.nutriai.api.repository.WhatsAppMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Core service that processes incoming WhatsApp webhook payloads.
 * Persists messages, resolves patients by phone, and enqueues for async processing.
 */
@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final PatientRepository patientRepository;
    private final PhoneNormalizationService phoneNormalizationService;
    private final MessageQueueService messageQueueService;

    public WebhookService(
            WhatsAppMessageRepository whatsAppMessageRepository,
            PatientRepository patientRepository,
            PhoneNormalizationService phoneNormalizationService,
            MessageQueueService messageQueueService) {
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.patientRepository = patientRepository;
        this.phoneNormalizationService = phoneNormalizationService;
        this.messageQueueService = messageQueueService;
    }

    /**
     * Process an incoming webhook payload.
     * Returns the persisted message ID, or empty if dedup.
     */
    @Transactional
    public Optional<WebhookMessageDTO> processIncoming(WhatsAppWebhookDTO payload) {
        if (payload == null || payload.getData() == null || payload.getData().getKey() == null) {
            log.warn("Received invalid webhook payload");
            return Optional.empty();
        }

        String rawPhone = extractPhoneFromJid(payload.getData().getKey().getRemoteJid());
        String evolutionMessageId = payload.getData().getKey().getId();
        String instanceId = payload.getInstanceId();

        if (evolutionMessageId == null || rawPhone == null) {
            log.warn("Webhook missing messageId or sender phone");
            return Optional.empty();
        }

        // Deduplication: check if this message ID already exists
        Optional<WhatsAppMessage> existing = whatsAppMessageRepository.findByMessageId(evolutionMessageId);
        if (existing.isPresent()) {
            log.info("Duplicate messageId {}, skipping", evolutionMessageId);
            return Optional.empty();
        }

        // Normalize phone and resolve patient
        Optional<String> normalizedOpt = phoneNormalizationService.normalize(rawPhone);
        if (normalizedOpt.isEmpty()) {
            log.warn("Could not normalize phone: {}", rawPhone);
            return Optional.empty();
        }
        String normalizedPhone = normalizedOpt.get();

        Optional<Patient> patientOpt = patientRepository.findByWhatsapp(normalizedPhone);

        // Determine message type and content
        String messageType = determineMessageType(payload);
        String messageContent = extractContent(payload);
        String mediaUrl = extractMediaUrl(payload);

        WhatsAppMessage message = WhatsAppMessage.builder()
                .messageId(evolutionMessageId)
                .instanceId(instanceId != null ? instanceId : "default")
                .senderPhone(rawPhone)
                .senderPhoneNormalized(normalizedPhone)
                .patientId(patientOpt.map(Patient::getId).orElse(null))
                .nutritionistId(patientOpt.map(Patient::getNutritionistId).orElse(null))
                .messageType(messageType)
                .messageContent(messageContent)
                .mediaUrl(mediaUrl)
                .processed(false)
                .build();

        WhatsAppMessage saved = whatsAppMessageRepository.save(message);
        log.info("Saved WhatsAppMessage id={}, patientId={}, type={}", saved.getId(), saved.getPatientId(), messageType);

        // Unknown number: mark processed, no enqueue per D-16
        if (patientOpt.isEmpty()) {
            saved.setProcessed(true);
            saved.setProcessedAt(java.time.LocalDateTime.now());
            whatsAppMessageRepository.save(saved);
            log.info("Unknown phone {}, marked processed without enqueue", normalizedPhone);
            return Optional.of(new WebhookMessageDTO(
                    saved.getId(), normalizedPhone, null, null, messageContent, messageType));
        }

        // Enqueue for async AI processing
        messageQueueService.enqueue(saved.getId());
        log.info("Enqueued message {} for async processing", saved.getId());

        return Optional.of(new WebhookMessageDTO(
                saved.getId(), normalizedPhone, saved.getPatientId(), saved.getNutritionistId(),
                messageContent, messageType));
    }

    private String extractPhoneFromJid(String jid) {
        if (jid == null) return null;
        int atIndex = jid.indexOf('@');
        if (atIndex > 0) {
            return jid.substring(0, atIndex);
        }
        return jid;
    }

    private String determineMessageType(WhatsAppWebhookDTO payload) {
        if (payload.getData().getMessage() == null) return "text";
        if (payload.getData().getMessage().getAudioMessage() != null) return "audio";
        if (payload.getData().getMessage().getImageMessage() != null) return "image";
        return "text";
    }

    private String extractContent(WhatsAppWebhookDTO payload) {
        if (payload.getData().getMessage() == null) return null;
        if (payload.getData().getMessage().getConversation() != null) {
            return payload.getData().getMessage().getConversation();
        }
        if (payload.getData().getMessage().getImageMessage() != null
                && payload.getData().getMessage().getImageMessage().getCaption() != null) {
            return payload.getData().getMessage().getImageMessage().getCaption();
        }
        return null;
    }

    private String extractMediaUrl(WhatsAppWebhookDTO payload) {
        if (payload.getData().getMessage() == null) return null;
        if (payload.getData().getMessage().getImageMessage() != null) {
            return payload.getData().getMessage().getImageMessage().getUrl();
        }
        if (payload.getData().getMessage().getAudioMessage() != null) {
            return payload.getData().getMessage().getAudioMessage().getUrl();
        }
        return null;
    }
}
