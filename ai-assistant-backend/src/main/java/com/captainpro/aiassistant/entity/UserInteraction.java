package com.captainpro.aiassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * User Interaction Entity
 * 
 * Tracks user interactions within the AI Assistant system for analytics,
 * behavior analysis, and performance monitoring.
 */
@Entity
@Table(name = "user_interactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "interaction_type", nullable = false)
    private String interactionType;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "category")
    private String category;

    @Column(name = "target_id")
    private String targetId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "page_url")
    private String pageUrl;

    @Column(name = "referrer_url")
    private String referrerUrl;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "browser")
    private String browser;

    @Column(name = "operating_system")
    private String operatingSystem;

    @Column(name = "screen_resolution")
    private String screenResolution;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "success")
    private Boolean success = true;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "context_data", columnDefinition = "TEXT")
    private String contextData;

    @Column(name = "performance_metrics", columnDefinition = "TEXT")
    private String performanceMetrics;

    @Column(name = "location_country")
    private String locationCountry;

    @Column(name = "location_city")
    private String locationCity;

    @Column(name = "timezone")
    private String timezone;

    @Column(name = "language")
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.COMPLETED;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Enums
    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Status {
        STARTED, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
    }

    // Helper methods
    public boolean isSuccessful() {
        return success != null && success && status == Status.COMPLETED;
    }

    public boolean isFailed() {
        return (success != null && !success) || status == Status.FAILED;
    }

    public boolean isCompleted() {
        return status == Status.COMPLETED || status == Status.FAILED || status == Status.CANCELLED;
    }

    public boolean isInProgress() {
        return status == Status.IN_PROGRESS || status == Status.STARTED;
    }

    public long getExecutionTimeMs() {
        if (createdAt == null || completedAt == null) {
            return 0;
        }
        return java.time.Duration.between(createdAt, completedAt).toMillis();
    }

    public String getInteractionSummary() {
        return String.format("%s - %s (%s)", interactionType, action, 
            category != null ? category : "general");
    }

    public boolean isHighPriority() {
        return priority == Priority.HIGH || priority == Priority.CRITICAL;
    }

    public boolean isCritical() {
        return priority == Priority.CRITICAL;
    }

    public boolean isRecentInteraction() {
        if (createdAt == null) {
            return false;
        }
        return createdAt.isAfter(LocalDateTime.now().minusHours(1));
    }

    public boolean isLongRunning() {
        return durationMs != null && durationMs > 30000; // 30 seconds
    }

    public boolean isSlowResponse() {
        return responseTimeMs != null && responseTimeMs > 5000; // 5 seconds
    }

    public String getDeviceInfo() {
        StringBuilder info = new StringBuilder();
        if (deviceType != null) {
            info.append(deviceType);
        }
        if (browser != null) {
            if (info.length() > 0) info.append(" - ");
            info.append(browser);
        }
        if (operatingSystem != null) {
            if (info.length() > 0) info.append(" - ");
            info.append(operatingSystem);
        }
        return info.toString();
    }

    public String getLocationInfo() {
        StringBuilder location = new StringBuilder();
        if (locationCity != null) {
            location.append(locationCity);
        }
        if (locationCountry != null) {
            if (location.length() > 0) location.append(", ");
            location.append(locationCountry);
        }
        return location.toString();
    }

    public boolean isMobileDevice() {
        return "mobile".equalsIgnoreCase(deviceType) || 
               "tablet".equalsIgnoreCase(deviceType);
    }

    public boolean isDesktopDevice() {
        return "desktop".equalsIgnoreCase(deviceType);
    }

    public boolean hasError() {
        return errorMessage != null && !errorMessage.trim().isEmpty();
    }

    public String getPerformanceGrade() {
        if (responseTimeMs == null) {
            return "N/A";
        }
        if (responseTimeMs < 500) return "A";
        if (responseTimeMs < 1000) return "B";
        if (responseTimeMs < 2000) return "C";
        if (responseTimeMs < 5000) return "D";
        return "F";
    }

    public boolean isAIInteraction() {
        return "ai_chat".equals(interactionType) || 
               "ai_insights".equals(interactionType) ||
               "ai_recommendation".equals(interactionType);
    }

    public boolean isAnalyticsInteraction() {
        return "analytics".equals(interactionType) ||
               "dashboard_view".equals(interactionType) ||
               "report_generation".equals(interactionType);
    }

    public boolean isActionInteraction() {
        return "action_execution".equals(interactionType) ||
               "task_completion".equals(interactionType) ||
               "workflow_trigger".equals(interactionType);
    }

    public boolean isInsightInteraction() {
        return "insight_generation".equals(interactionType) ||
               "data_analysis".equals(interactionType) ||
               "trend_analysis".equals(interactionType);
    }

    public void markAsCompleted() {
        this.status = Status.COMPLETED;
        this.completedAt = LocalDateTime.now();
        if (this.success == null) {
            this.success = true;
        }
    }

    public void markAsFailed(String errorMessage) {
        this.status = Status.FAILED;
        this.success = false;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
    }

    public void markAsInProgress() {
        this.status = Status.IN_PROGRESS;
    }

    public void markAsCancelled() {
        this.status = Status.CANCELLED;
        this.completedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = Status.STARTED;
        }
        if (priority == null) {
            priority = Priority.MEDIUM;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (isCompleted() && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}