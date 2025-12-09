package com.captainpro.aiassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Chat Message Entity
 * 
 * Represents messages in AI chat conversations, including user messages,
 * AI responses, system messages, and conversation metadata.
 */
@Entity
@Table(name = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "conversation_id", nullable = false)
    private String conversationId;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "message_id")
    private String messageId;

    @Column(name = "parent_message_id")
    private String parentMessageId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private MessageRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private MessageType type = MessageType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private MessageStatus status = MessageStatus.SENT;

    @Column(name = "context", columnDefinition = "TEXT")
    private String context; // JSON context data

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON metadata

    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments; // JSON array of attachments

    @Column(name = "actions", columnDefinition = "TEXT")
    private String actions; // JSON array of suggested actions

    @Column(name = "intent")
    private String intent;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "sentiment")
    private String sentiment;

    @Column(name = "sentiment_score")
    private Double sentimentScore;

    @Column(name = "language")
    private String language = "en";

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "max_tokens")
    private Integer maxTokens;

    @Column(name = "is_edited")
    private Boolean isEdited = false;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "is_pinned")
    private Boolean isPinned = false;

    @Column(name = "is_flagged")
    private Boolean isFlagged = false;

    @Column(name = "flag_reason")
    private String flagReason;

    @Column(name = "rating")
    private Integer rating; // 1-5 star rating

    @Column(name = "feedback")
    private String feedback;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum MessageRole {
        USER, ASSISTANT, SYSTEM, FUNCTION
    }

    public enum MessageType {
        TEXT, IMAGE, FILE, AUDIO, VIDEO, CODE, CHART, TABLE, 
        ACTION_RESULT, INSIGHT, RECOMMENDATION, ERROR
    }

    public enum MessageStatus {
        DRAFT, SENDING, SENT, DELIVERED, READ, FAILED, CANCELLED
    }

    // Helper methods
    public boolean isUserMessage() {
        return role == MessageRole.USER;
    }

    public boolean isAssistantMessage() {
        return role == MessageRole.ASSISTANT;
    }

    public boolean isSystemMessage() {
        return role == MessageRole.SYSTEM;
    }

    public boolean isFunctionMessage() {
        return role == MessageRole.FUNCTION;
    }

    public boolean isTextMessage() {
        return type == MessageType.TEXT;
    }

    public boolean hasAttachments() {
        return attachments != null && !attachments.trim().isEmpty();
    }

    public boolean hasActions() {
        return actions != null && !actions.trim().isEmpty();
    }

    public boolean isSuccessful() {
        return status == MessageStatus.SENT || status == MessageStatus.DELIVERED || status == MessageStatus.READ;
    }

    public boolean isFailed() {
        return status == MessageStatus.FAILED;
    }

    public boolean isRead() {
        return status == MessageStatus.READ || readAt != null;
    }

    public boolean isRecent() {
        return createdAt != null && createdAt.isAfter(LocalDateTime.now().minusHours(1));
    }

    public boolean isHighConfidence() {
        return confidenceScore != null && confidenceScore > 0.8;
    }

    public boolean isLowConfidence() {
        return confidenceScore != null && confidenceScore < 0.5;
    }

    public boolean hasPositiveSentiment() {
        return "positive".equalsIgnoreCase(sentiment) || 
               (sentimentScore != null && sentimentScore > 0.1);
    }

    public boolean hasNegativeSentiment() {
        return "negative".equalsIgnoreCase(sentiment) || 
               (sentimentScore != null && sentimentScore < -0.1);
    }

    public boolean isLongMessage() {
        return content != null && content.length() > 500;
    }

    public boolean isShortMessage() {
        return content != null && content.length() < 50;
    }

    public boolean hasHighTokenUsage() {
        return tokensUsed != null && tokensUsed > 1000;
    }

    public boolean isSlowProcessing() {
        return processingTimeMs != null && processingTimeMs > 5000; // 5 seconds
    }

    public boolean isFastProcessing() {
        return processingTimeMs != null && processingTimeMs < 1000; // 1 second
    }

    public boolean hasRating() {
        return rating != null && rating >= 1 && rating <= 5;
    }

    public boolean isHighRated() {
        return rating != null && rating >= 4;
    }

    public boolean isLowRated() {
        return rating != null && rating <= 2;
    }

    public boolean hasFeedback() {
        return feedback != null && !feedback.trim().isEmpty();
    }

    public boolean needsAttention() {
        return isFlagged || isLowRated() || isFailed() || isLowConfidence();
    }

    public String getMessageSummary() {
        String preview = content != null && content.length() > 100 ? 
                        content.substring(0, 100) + "..." : content;
        return String.format("%s: %s", role.name(), preview);
    }

    public String getPerformanceGrade() {
        if (processingTimeMs == null) {
            return "N/A";
        }
        if (processingTimeMs < 500) return "A";
        if (processingTimeMs < 1000) return "B";
        if (processingTimeMs < 2000) return "C";
        if (processingTimeMs < 5000) return "D";
        return "F";
    }

    public String getConfidenceLevel() {
        if (confidenceScore == null) {
            return "Unknown";
        }
        if (confidenceScore > 0.9) return "Very High";
        if (confidenceScore > 0.7) return "High";
        if (confidenceScore > 0.5) return "Medium";
        if (confidenceScore > 0.3) return "Low";
        return "Very Low";
    }

    public String getSentimentDescription() {
        if (sentiment != null) {
            return sentiment.substring(0, 1).toUpperCase() + sentiment.substring(1).toLowerCase();
        }
        if (sentimentScore != null) {
            if (sentimentScore > 0.1) return "Positive";
            if (sentimentScore < -0.1) return "Negative";
            return "Neutral";
        }
        return "Unknown";
    }

    public int getWordCount() {
        if (content == null || content.trim().isEmpty()) {
            return 0;
        }
        return content.trim().split("\\s+").length;
    }

    public int getCharacterCount() {
        return content != null ? content.length() : 0;
    }

    public void markAsRead() {
        this.status = MessageStatus.READ;
        this.readAt = LocalDateTime.now();
    }

    public void markAsFailed(String errorMessage) {
        this.status = MessageStatus.FAILED;
        this.errorMessage = errorMessage;
        this.retryCount++;
    }

    public void markAsEdited() {
        this.isEdited = true;
        this.editedAt = LocalDateTime.now();
    }

    public void markAsDeleted() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    public void pin() {
        this.isPinned = true;
    }

    public void unpin() {
        this.isPinned = false;
    }

    public void flag(String reason) {
        this.isFlagged = true;
        this.flagReason = reason;
    }

    public void unflag() {
        this.isFlagged = false;
        this.flagReason = null;
    }

    public void rate(int rating, String feedback) {
        if (rating >= 1 && rating <= 5) {
            this.rating = rating;
        }
        if (feedback != null && !feedback.trim().isEmpty()) {
            this.feedback = feedback;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (messageId == null) {
            messageId = "msg_" + System.currentTimeMillis() + "_" + 
                       (int)(Math.random() * 1000);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}