package com.nutriai.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Async queue worker that processes enqueued messages.
 * Polls Redis every 2 seconds and delegates to ConversationService.
 * Intentionally simple for v1 (D-09 — Redis as queue, no dead-letter).
 */
@Component
public class MessageProcessorWorker {

    private static final Logger log = LoggerFactory.getLogger(MessageProcessorWorker.class);

    private final MessageQueueService messageQueueService;
    private final ConversationService conversationService;

    public MessageProcessorWorker(
            MessageQueueService messageQueueService,
            ConversationService conversationService) {
        this.messageQueueService = messageQueueService;
        this.conversationService = conversationService;
    }

    /**
     * Poll Redis and process the next message.
     * Runs every 2 seconds via Spring @Scheduled.
     */
    @Scheduled(fixedDelay = 2000)
    public void processNextMessage() {
        Optional<UUID> messageIdOpt = messageQueueService.dequeue();
        if (messageIdOpt.isEmpty()) {
            return;
        }

        UUID messageId = messageIdOpt.get();
        try {
            conversationService.processMessage(messageId);
        } catch (Exception e) {
            // Log error, don't crash the worker
            // Message stays marked as unprocessed (processed=false)
            // Can be retried manually or via a dead-letter mechanism (v2)
            log.error("Error processing message {}: {}", messageId, e.getMessage(), e);
        }
    }
}