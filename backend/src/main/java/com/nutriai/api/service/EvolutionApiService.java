package com.nutriai.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Sends WhatsApp messages via Evolution Go API.
 * Logs failures but doesn't throw — failures in sending should not crash the processing pipeline.
 */
public class EvolutionApiService {

    private static final Logger log = LoggerFactory.getLogger(EvolutionApiService.class);

    private final String apiUrl;
    private final String apiKey;
    private final String instanceName;
    private final HttpClient httpClient;

    public EvolutionApiService(String apiUrl, String apiKey, String instanceName) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.instanceName = instanceName;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Send a text message via Evolution Go API.
     *
     * @param phone the recipient phone number (normalized, with country code e.g. 5511999999999)
     * @param text  the message text to send
     * @return true if the message was sent successfully, false otherwise
     */
    public boolean sendMessage(String phone, String text) {
        try {
            String endpoint = apiUrl + "/message/sendText/" + instanceName;
            // Evolution Go payload uses nested textMessage object
            String payload = String.format(
                    "{\"number\":\"%s\",\"textMessage\":{\"text\":\"%s\"}}",
                    escapeJson(phone),
                    escapeJson(text)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Message sent via Evolution API: instance={}, phone={}, status={}",
                        instanceName, maskPhone(phone), response.statusCode());
                return true;
            }

            // Retry once on server error or timeout
            if (response.statusCode() >= 500) {
                log.warn("Evolution API server error ({}), retrying...", response.statusCode());
                Thread.sleep(500);

                HttpResponse<String> retryResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (retryResponse.statusCode() >= 200 && retryResponse.statusCode() < 300) {
                    log.info("Message sent on retry: instance={}, phone={}", instanceName, maskPhone(phone));
                    return true;
                }
                log.error("Evolution API retry failed: status={}", retryResponse.statusCode());
                return false;
            }

            log.error("Evolution API client error: status={}, body={}", response.statusCode(),
                    truncate(response.body(), 200));
            return false;

        } catch (java.net.http.HttpTimeoutException e) {
            log.error("Evolution API timeout sending message to {}", maskPhone(phone));
            return retrySendOnce(phone, text);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Evolution API send interrupted: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Evolution API send failed: {}", e.getMessage(), e);
            return retrySendOnce(phone, text);
        }
    }

    private boolean retrySendOnce(String phone, String text) {
        try {
            String endpoint = apiUrl + "/message/sendText/" + instanceName;
            String payload = String.format(
                    "{\"number\":\"%s\",\"textMessage\":{\"text\":\"%s\"}}",
                    escapeJson(phone),
                    escapeJson(text)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            boolean success = response.statusCode() >= 200 && response.statusCode() < 300;
            if (!success) {
                log.error("Evolution API retry also failed: status={}", response.statusCode());
            }
            return success;
        } catch (Exception e) {
            log.error("Evolution API retry failed: {}", e.getMessage());
            return false;
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder escaped = new StringBuilder(s.length());
        for (char ch : s.toCharArray()) {
            switch (ch) {
                case '\\' -> escaped.append("\\\\");
                case '"' -> escaped.append("\\\"");
                case '\b' -> escaped.append("\\b");
                case '\f' -> escaped.append("\\f");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (ch <= 0x1F) {
                        escaped.append(String.format("\\u%04x", (int) ch));
                    } else {
                        escaped.append(ch);
                    }
                }
            }
        }
        return escaped.toString();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, 2) + "***" + phone.substring(phone.length() - 2);
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "null";
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
