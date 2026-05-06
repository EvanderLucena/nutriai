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

import java.util.List;
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
     * Returns the persisted message ID, or empty if dedup or non-processable event.
     */
    @Transactional
    public Optional<WebhookMessageDTO> processIncoming(WhatsAppWebhookDTO payload) {
        if (payload == null || payload.getData() == null || payload.getData().getInfo() == null) {
            log.warn("Received invalid webhook payload");
            return Optional.empty();
        }

        // Only process incoming messages
        if (!"Message".equals(payload.getEvent())) {
            log.debug("Ignoring non-Message event: {}", payload.getEvent());
            return Optional.empty();
        }

        // Ignore messages sent by our own instance (AI responses)
        if (payload.getData().getInfo().isFromMe()) {
            log.debug("Ignoring message sent by our own instance");
            return Optional.empty();
        }

        String rawPhone = extractPhoneFromJid(payload.getData().getInfo().getSender());
        String evolutionMessageId = payload.getData().getInfo().getId();
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
            log.warn("Could not normalize sender phone for messageId={}", evolutionMessageId);
            return Optional.empty();
        }
        String normalizedPhone = normalizedOpt.get();

        List<UUID> matchedNutritionistIds = patientRepository.findDistinctNutritionistIdsByWhatsapp(normalizedPhone);
        Optional<Patient> patientOpt;
        if (matchedNutritionistIds.size() > 1) {
            log.warn("Ambiguous patient resolution for messageId={} and phone ending {}", evolutionMessageId,
                    maskedSuffix(normalizedPhone));
            patientOpt = Optional.empty();
        } else if (matchedNutritionistIds.size() == 1) {
            patientOpt = patientRepository.findByWhatsappAndNutritionistId(
                    normalizedPhone, matchedNutritionistIds.get(0));
        } else {
            patientOpt = Optional.empty();
        }

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

    private String extractPhoneFromJid(String sender) {
        if (sender == null) return null;
        int atIndex = sender.indexOf('@');
        if (atIndex > 0) {
            return sender.substring(0, atIndex);
        }
        return sender;
    }

    private String determineMessageType(WhatsAppWebhookDTO payload) {
        if (payload.getData() == null || payload.getData().getInfo() == null) return "text";
        String mediaType = payload.getData().getInfo().getMediaType();
        if ("audio".equalsIgnoreCase(mediaType)) return "audio";
        if ("image".equalsIgnoreCase(mediaType)) return "image";
        if ("video".equalsIgnoreCase(mediaType)) return "video";
        if ("document".equalsIgnoreCase(mediaType)) return "document";
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

    private String maskedSuffix(String normalizedPhone) {
        if (normalizedPhone == null || normalizedPhone.length() < 4) {
            return "***";
        }
        return "***" + normalizedPhone.substring(normalizedPhone.length() - 4);
    }
}
