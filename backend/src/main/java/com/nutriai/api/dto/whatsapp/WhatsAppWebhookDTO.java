package com.nutriai.api.dto.whatsapp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO for incoming Evolution API webhook payloads.
 * Uses ignoreUnknown for resilience against field changes.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class WhatsAppWebhookDTO {
    private String instanceId;
    private String instance;
    private String event;
    private MessageData data;

    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
    /** Evolution API v2 sends "instance" (the instance name) rather than "instanceId". */
    public String getInstance() { return instance; }
    public void setInstance(String instance) { this.instance = instance; }
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public MessageData getData() { return data; }
    public void setData(MessageData data) { this.data = data; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessageData {
        private MessageKey key;
        private MessageContent message;
        private String pushName;

        public MessageKey getKey() { return key; }
        public void setKey(MessageKey key) { this.key = key; }
        public MessageContent getMessage() { return message; }
        public void setMessage(MessageContent message) { this.message = message; }
        public String getPushName() { return pushName; }
        public void setPushName(String pushName) { this.pushName = pushName; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessageKey {
        private String remoteJid;
        private String id;

        public String getRemoteJid() { return remoteJid; }
        public void setRemoteJid(String remoteJid) { this.remoteJid = remoteJid; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessageContent {
        private String conversation;
        private ImageMessage imageMessage;
        private AudioMessage audioMessage;

        public String getConversation() { return conversation; }
        public void setConversation(String conversation) { this.conversation = conversation; }
        public ImageMessage getImageMessage() { return imageMessage; }
        public void setImageMessage(ImageMessage imageMessage) { this.imageMessage = imageMessage; }
        public AudioMessage getAudioMessage() { return audioMessage; }
        public void setAudioMessage(AudioMessage audioMessage) { this.audioMessage = audioMessage; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImageMessage {
        private String caption;
        private String url;

        public String getCaption() { return caption; }
        public void setCaption(String caption) { this.caption = caption; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AudioMessage {
        private String url;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }
}
