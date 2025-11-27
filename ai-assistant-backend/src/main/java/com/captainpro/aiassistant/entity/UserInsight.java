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
 * User Insight Entity
 * 
 * Stores generated insights for users including performance analysis,
 * predictive analytics, recommendations, and comparative analysis.
 */
@Entity
@Table(name = "user_insights")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "insight_id", unique = true)
    private String insightId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private InsightType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private InsightCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.ACTIVE;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content; // JSON content with detailed insight data

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "key_findings", columnDefinition = "TEXT")
    private String keyFindings; // JSON array of key findings

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations; // JSON array of recommendations

    @Column(name = "metrics", columnDefinition = "TEXT")
    private String metrics; // JSON object with relevant metrics

    @Column(name = "trends", columnDefinition = "TEXT")
    private String trends; // JSON object with trend data

    @Column(name = "comparisons", columnDefinition = "TEXT")
    private String comparisons; // JSON object with comparison data

    @Column(name = "predictions", columnDefinition = "TEXT")
    private String predictions; // JSON object with predictive data

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "accuracy_score")
    private Double accuracyScore;

    @Column(name = "relevance_score")
    private Double relevanceScore;

    @Column(name = "impact_score")
    private Double impact_score;

    @Column(name = "data_sources", columnDefinition = "TEXT")
    private String dataSources; // JSON array of data sources used

    @Column(name = "analysis_period_start")
    private LocalDateTime analysisPeriodStart;

    @Column(name = "analysis_period_end")
    private LocalDateTime analysisPeriodEnd;

    @Column(name = "generated_by")
    private String generatedBy; // AI model or system that generated the insight

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "data_points_analyzed")
    private Integer dataPointsAnalyzed;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags; // JSON array of tags

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON metadata

    @Column(name = "visualization_data", columnDefinition = "TEXT")
    private String visualizationData; // JSON data for charts/graphs

    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems; // JSON array of actionable items

    @Column(name = "related_insights", columnDefinition = "TEXT")
    private String relatedInsights; // JSON array of related insight IDs

    @Column(name = "is_shared")
    private Boolean isShared = false;

    @Column(name = "is_bookmarked")
    private Boolean isBookmarked = false;

    @Column(name = "is_archived")
    private Boolean isArchived = false;

    @Column(name = "is_automated")
    private Boolean isAutomated = true;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "share_count")
    private Integer shareCount = 0;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "feedback_count")
    private Integer feedbackCount = 0;

    @Column(name = "last_viewed_at")
    private LocalDateTime lastViewedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    // Enums
    public enum InsightType {
        PERFORMANCE, PREDICTIVE, COMPARATIVE, TREND, RECOMMENDATION, 
        ANOMALY, PATTERN, FORECAST, SUMMARY, DIAGNOSTIC
    }

    public enum InsightCategory {
        INDIVIDUAL_PERFORMANCE, TEAM_PERFORMANCE, TRAINING, HEALTH, 
        TACTICAL, TECHNICAL, PHYSICAL, MENTAL, INJURY_PREVENTION, 
        MATCH_ANALYSIS, SEASON_ANALYSIS, CAREER_DEVELOPMENT
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT, CRITICAL
    }

    public enum Status {
        ACTIVE, EXPIRED, ARCHIVED, SUPERSEDED, INVALID
    }

    // Helper methods
    public boolean isActive() {
        return status == Status.ACTIVE && !isExpired();
    }

    public boolean isExpired() {
        return status == Status.EXPIRED || 
               (expiresAt != null && LocalDateTime.now().isAfter(expiresAt));
    }

    public boolean isHighPriority() {
        return priority == Priority.HIGH || priority == Priority.URGENT || priority == Priority.CRITICAL;
    }

    public boolean isCritical() {
        return priority == Priority.CRITICAL;
    }

    public boolean isHighConfidence() {
        return confidenceScore != null && confidenceScore > 0.8;
    }

    public boolean isLowConfidence() {
        return confidenceScore != null && confidenceScore < 0.5;
    }

    public boolean isHighAccuracy() {
        return accuracyScore != null && accuracyScore > 0.8;
    }

    public boolean isHighRelevance() {
        return relevanceScore != null && relevanceScore > 0.8;
    }

    public boolean isHighImpact() {
        return impact_score != null && impact_score > 0.8;
    }

    public boolean isRecent() {
        return createdAt != null && createdAt.isAfter(LocalDateTime.now().minusDays(7));
    }

    public boolean isPopular() {
        return viewCount != null && viewCount > 10;
    }

    public boolean isWellRated() {
        return rating != null && rating > 4.0;
    }

    public boolean isPoorlyRated() {
        return rating != null && rating < 2.0;
    }

    public boolean hasVisualization() {
        return visualizationData != null && !visualizationData.trim().isEmpty();
    }

    public boolean hasActionItems() {
        return actionItems != null && !actionItems.trim().isEmpty();
    }

    public boolean hasRecommendations() {
        return recommendations != null && !recommendations.trim().isEmpty();
    }

    public boolean isPerformanceInsight() {
        return type == InsightType.PERFORMANCE;
    }

    public boolean isPredictiveInsight() {
        return type == InsightType.PREDICTIVE || type == InsightType.FORECAST;
    }

    public boolean isComparativeInsight() {
        return type == InsightType.COMPARATIVE;
    }

    public boolean isTrendInsight() {
        return type == InsightType.TREND;
    }

    public boolean isRecommendationInsight() {
        return type == InsightType.RECOMMENDATION;
    }

    public boolean needsAttention() {
        return isHighPriority() && isActive() && !isArchived;
    }

    public boolean isStale() {
        return createdAt != null && createdAt.isBefore(LocalDateTime.now().minusDays(30));
    }

    public long getAgeInDays() {
        if (createdAt == null) {
            return 0;
        }
        return java.time.Duration.between(createdAt, LocalDateTime.now()).toDays();
    }

    public long getDaysUntilExpiry() {
        if (expiresAt == null) {
            return -1;
        }
        return java.time.Duration.between(LocalDateTime.now(), expiresAt).toDays();
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

    public String getAccuracyLevel() {
        if (accuracyScore == null) {
            return "Unknown";
        }
        if (accuracyScore > 0.9) return "Excellent";
        if (accuracyScore > 0.8) return "Very Good";
        if (accuracyScore > 0.7) return "Good";
        if (accuracyScore > 0.6) return "Fair";
        return "Poor";
    }

    public String getRelevanceLevel() {
        if (relevanceScore == null) {
            return "Unknown";
        }
        if (relevanceScore > 0.8) return "Highly Relevant";
        if (relevanceScore > 0.6) return "Relevant";
        if (relevanceScore > 0.4) return "Somewhat Relevant";
        return "Not Relevant";
    }

    public String getImpactLevel() {
        if (impact_score == null) {
            return "Unknown";
        }
        if (impact_score > 0.8) return "High Impact";
        if (impact_score > 0.6) return "Medium Impact";
        if (impact_score > 0.4) return "Low Impact";
        return "Minimal Impact";
    }

    public String getInsightSummary() {
        return String.format("%s - %s (%s priority)", 
            type.name(), title, priority.name().toLowerCase());
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null) ? 1 : this.viewCount + 1;
        this.lastViewedAt = LocalDateTime.now();
    }

    public void incrementShareCount() {
        this.shareCount = (this.shareCount == null) ? 1 : this.shareCount + 1;
    }

    public void bookmark() {
        this.isBookmarked = true;
    }

    public void unbookmark() {
        this.isBookmarked = false;
    }

    public void archive() {
        this.isArchived = true;
        this.status = Status.ARCHIVED;
        this.archivedAt = LocalDateTime.now();
    }

    public void unarchive() {
        this.isArchived = false;
        this.status = Status.ACTIVE;
        this.archivedAt = null;
    }

    public void share() {
        this.isShared = true;
        incrementShareCount();
    }

    public void markAsExpired() {
        this.status = Status.EXPIRED;
    }

    public void markAsSuperseded() {
        this.status = Status.SUPERSEDED;
    }

    public void markAsInvalid() {
        this.status = Status.INVALID;
    }

    public void rate(double rating) {
        if (rating >= 1.0 && rating <= 5.0) {
            this.rating = rating;
        }
    }

    public void incrementFeedbackCount() {
        this.feedbackCount = (this.feedbackCount == null) ? 1 : this.feedbackCount + 1;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (insightId == null) {
            insightId = "insight_" + System.currentTimeMillis() + "_" + 
                       (int)(Math.random() * 1000);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}