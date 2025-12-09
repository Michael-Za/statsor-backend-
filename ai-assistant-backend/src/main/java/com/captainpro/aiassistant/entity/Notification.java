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
import java.util.List;

/**
 * Notification Entity
 * 
 * Represents notifications sent to users through various channels
 * including email, push notifications, SMS, and in-app messaging.
 */
@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "sender_id")
    private String senderId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.PENDING;

    @Column(name = "channels", columnDefinition = "TEXT")
    private String channels; // JSON array of delivery channels

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON metadata

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "action_text")
    private String actionText;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "icon")
    private String icon;

    @Column(name = "category")
    private String category;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags; // JSON array of tags

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "clicked_at")
    private LocalDateTime clickedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "max_retries")
    private Integer maxRetries = 3;

    @Column(name = "delivery_attempts", columnDefinition = "TEXT")
    private String deliveryAttempts; // JSON array of delivery attempts

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "delivery_receipt")
    private String deliveryReceipt;

    @Column(name = "tracking_id")
    private String trackingId;

    @Column(name = "batch_id")
    private String batchId;

    @Column(name = "template_id")
    private String templateId;

    @Column(name = "personalization_data", columnDefinition = "TEXT")
    private String personalizationData; // JSON personalization data

    @Column(name = "a_b_test_variant")
    private String abTestVariant;

    @Column(name = "campaign_id")
    private String campaignId;

    @Column(name = "source")
    private String source;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "is_clicked")
    private Boolean isClicked = false;

    @Column(name = "is_archived")
    private Boolean isArchived = false;

    @Column(name = "is_starred")
    private Boolean isStarred = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Enums
    public enum NotificationType {
        INFO, SUCCESS, WARNING, ERROR, REMINDER, ALERT, 
        PERFORMANCE_INSIGHT, TRAINING_REMINDER, MATCH_ALERT, 
        INJURY_ALERT, RECOMMENDATION, SYSTEM_UPDATE, PROMOTIONAL
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT, CRITICAL
    }

    public enum Status {
        PENDING, SCHEDULED, SENT, DELIVERED, READ, CLICKED, 
        FAILED, EXPIRED, CANCELLED, BOUNCED
    }

    // Helper methods
    public boolean isDelivered() {
        return status == Status.DELIVERED || status == Status.READ || status == Status.CLICKED;
    }

    public boolean isFailed() {
        return status == Status.FAILED || status == Status.BOUNCED;
    }

    public boolean isExpired() {
        return status == Status.EXPIRED || 
               (expiresAt != null && LocalDateTime.now().isAfter(expiresAt));
    }

    public boolean isPending() {
        return status == Status.PENDING || status == Status.SCHEDULED;
    }

    public boolean canRetry() {
        return isFailed() && retryCount < maxRetries;
    }

    public boolean isHighPriority() {
        return priority == Priority.HIGH || priority == Priority.URGENT || priority == Priority.CRITICAL;
    }

    public boolean isCritical() {
        return priority == Priority.CRITICAL;
    }

    public boolean isUrgent() {
        return priority == Priority.URGENT || priority == Priority.CRITICAL;
    }

    public boolean isScheduled() {
        return scheduledAt != null && LocalDateTime.now().isBefore(scheduledAt);
    }

    public boolean isOverdue() {
        return scheduledAt != null && LocalDateTime.now().isAfter(scheduledAt) && isPending();
    }

    public boolean isRecent() {
        return createdAt != null && createdAt.isAfter(LocalDateTime.now().minusHours(24));
    }

    public boolean hasAction() {
        return actionUrl != null && !actionUrl.trim().isEmpty();
    }

    public boolean hasImage() {
        return imageUrl != null && !imageUrl.trim().isEmpty();
    }

    public long getDeliveryTimeMs() {
        if (createdAt == null || deliveredAt == null) {
            return 0;
        }
        return java.time.Duration.between(createdAt, deliveredAt).toMillis();
    }

    public long getReadTimeMs() {
        if (deliveredAt == null || readAt == null) {
            return 0;
        }
        return java.time.Duration.between(deliveredAt, readAt).toMillis();
    }

    public long getClickTimeMs() {
        if (readAt == null || clickedAt == null) {
            return 0;
        }
        return java.time.Duration.between(readAt, clickedAt).toMillis();
    }

    public String getStatusDescription() {
        return switch (status) {
            case PENDING -> "Waiting to be sent";
            case SCHEDULED -> "Scheduled for delivery";
            case SENT -> "Sent successfully";
            case DELIVERED -> "Delivered to recipient";
            case READ -> "Read by recipient";
            case CLICKED -> "Clicked by recipient";
            case FAILED -> "Delivery failed";
            case EXPIRED -> "Notification expired";
            case CANCELLED -> "Delivery cancelled";
            case BOUNCED -> "Delivery bounced";
        };
    }

    public String getPriorityDescription() {
        return switch (priority) {
            case LOW -> "Low priority";
            case MEDIUM -> "Medium priority";
            case HIGH -> "High priority";
            case URGENT -> "Urgent";
            case CRITICAL -> "Critical";
        };
    }

    public String getTypeDescription() {
        return switch (type) {
            case INFO -> "Information";
            case SUCCESS -> "Success";
            case WARNING -> "Warning";
            case ERROR -> "Error";
            case REMINDER -> "Reminder";
            case ALERT -> "Alert";
            case PERFORMANCE_INSIGHT -> "Performance Insight";
            case TRAINING_REMINDER -> "Training Reminder";
            case MATCH_ALERT -> "Match Alert";
            case INJURY_ALERT -> "Injury Alert";
            case RECOMMENDATION -> "Recommendation";
            case SYSTEM_UPDATE -> "System Update";
            case PROMOTIONAL -> "Promotional";
        };
    }

    public void markAsSent() {
        this.status = Status.SENT;
        this.sentAt = LocalDateTime.now();
    }

    public void markAsDelivered() {
        this.status = Status.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }

    public void markAsRead() {
        this.status = Status.READ;
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public void markAsClicked() {
        this.status = Status.CLICKED;
        this.isClicked = true;
        this.clickedAt = LocalDateTime.now();
        if (!isRead) {
            markAsRead();
        }
    }

    public void markAsFailed(String errorMessage) {
        this.status = Status.FAILED;
        this.errorMessage = errorMessage;
        this.retryCount++;
    }

    public void markAsExpired() {
        this.status = Status.EXPIRED;
    }

    public void markAsCancelled() {
        this.status = Status.CANCELLED;
    }

    public void archive() {
        this.isArchived = true;
    }

    public void unarchive() {
        this.isArchived = false;
    }

    public void star() {
        this.isStarred = true;
    }

    public void unstar() {
        this.isStarred = false;
    }

    public void incrementRetryCount() {
        this.retryCount++;
    }

    public boolean isActionable() {
        return hasAction() && !isExpired() && (status == Status.DELIVERED || status == Status.READ);
    }

    public boolean requiresAttention() {
        return isHighPriority() && !isRead && !isExpired();
    }

    public String getSummary() {
        return String.format("%s: %s (%s)", getTypeDescription(), title, getPriorityDescription());
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (trackingId == null) {
            trackingId = "notif_" + System.currentTimeMillis() + "_" + 
                        (int)(Math.random() * 1000);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}