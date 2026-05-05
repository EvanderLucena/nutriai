package com.nutriai.api.service;

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

    @InjectMocks
    MessageProcessorWorker worker;

    private UUID messageId;

    @BeforeEach
    void setup() {
        messageId = UUID.randomUUID();
    }

    @Test
    void processNextMessage_dequeuesAndDelegates() {
        when(messageQueueService.dequeue()).thenReturn(Optional.of(messageId));

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
        doThrow(new RuntimeException("Processing failed")).when(conversationService).processMessage(messageId);

        // Should not throw even though processing failed
        assertDoesNotThrow(() -> worker.processNextMessage());

        verify(messageQueueService).dequeue();
        verify(conversationService).processMessage(messageId);
    }
}