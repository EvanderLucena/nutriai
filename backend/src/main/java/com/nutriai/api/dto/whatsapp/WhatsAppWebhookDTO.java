package com.nutriai.api.dto.whatsapp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for incoming Evolution API (Go) webhook payloads.
 * Schema matches the Evolution Go webhook format:
 * {"event": "Message", "data": {...}, "instanceId": "...", "instanceToken": "..."}
 *
 * Uses ignoreUnknown for resilience against field changes.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class WhatsAppWebhookDTO {

    private String event;
    private MessageData data;
    private String instanceId;

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public MessageData getData() { return data; }
    public void setData(MessageData data) { this.data = data; }
    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessageData {
        private WhatsAppInfo info;
        private MessageContent message;

        public WhatsAppInfo getInfo() { return info; }
        public void setInfo(WhatsAppInfo info) { this.info = info; }
        public MessageContent getMessage() { return message; }
        public void setMessage(MessageContent message) { this.message = message; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WhatsAppInfo {
        private String chat;
        private String sender;
        private boolean isFromMe;
        private boolean isGroup;
        private String id;
        private String type;
        private String pushName;
        private String timestamp;
        private String mediaType;

        @JsonProperty("isFromMe")
        public boolean isFromMe() { return isFromMe; }
        public void setFromMe(boolean fromMe) { isFromMe = fromMe; }

        @JsonProperty("isGroup")
        public boolean isGroup() { return isGroup; }
        public void setGroup(boolean group) { isGroup = group; }

        public String getChat() { return chat; }
        public void setChat(String chat) { this.chat = chat; }
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getPushName() { return pushName; }
        public void setPushName(String pushName) { this.pushName = pushName; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getMediaType() { return mediaType; }
        public void setMediaType(String mediaType) { this.mediaType = mediaType; }
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
