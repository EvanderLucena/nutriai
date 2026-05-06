package com.nutriai.api.service;

import com.nutriai.api.model.WhatsAppMessage;
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
class MessageProcessorWorkerTest {

    @Mock MessageQueueService messageQueueService;
    @Mock ConversationService conversationService;
    @Mock WhatsAppMessageRepository whatsAppMessageRepository;

    @InjectMocks
    MessageProcessorWorker worker;

    private UUID messageId;
    private WhatsAppMessage message;

    @BeforeEach
    void setup() {
        messageId = UUID.randomUUID();
        message = WhatsAppMessage.builder()
                .id(messageId)
                .messageId("msg-" + messageId)
                .retryCount(0)
                .build();
    }

    @Test
    void processNextMessage_dequeuesAndDelegates() {
        when(messageQueueService.dequeue()).thenReturn(Optional.of(messageId));
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(message));

        worker.processNextMessage();

        verify(messageQueueService).dequeue();
        verify(conversationService).processMessage(messageId);
    }

    @Test
    void processNextMessage_emptyQueue_doesNothing() {
        when(messageQueueService.dequeue()).thenReturn(Optional.empty());

        worker.processNextMessage();

        verify(messageQueueService).dequeue();
        verify(conversationService, never()).processMessage(any());
    }

    @Test
    void processNextMessage_processingError_logsAndContinues() {
        when(messageQueueService.dequeue()).thenReturn(Optional.of(messageId));
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(message));
        doThrow(new RuntimeException("Processing failed")).when(conversationService).processMessage(messageId);

        // Should not throw even though processing failed
        assertDoesNotThrow(() -> worker.processNextMessage());

        verify(messageQueueService).dequeue();
        verify(conversationService).processMessage(messageId);
        verify(whatsAppMessageRepository).save(argThat(m -> m.getRetryCount() == 1));
    }
}
