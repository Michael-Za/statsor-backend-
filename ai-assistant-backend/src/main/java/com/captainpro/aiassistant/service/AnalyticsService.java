package com.captainpro.aiassistant.service;

import com.captainpro.aiassistant.model.UserInteraction;
import com.captainpro.aiassistant.model.AnalyticsEvent;
import com.captainpro.aiassistant.model.UserBehaviorPattern;
import com.captainpro.aiassistant.repository.UserInteractionRepository;
import com.captainpro.aiassistant.repository.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Comprehensive Analytics Service
 * 
 * Provides advanced analytics functionality including:
 * - User interaction tracking
 * - Behavior pattern analysis
 * - Performance metrics
 * - Predictive analytics
 * - Real-time insights
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final UserInteractionRepository userInteractionRepository;
    private final AnalyticsEventRepository analyticsEventRepository;
    private final InsightsService insightsService;

    /**
     * Track user interaction asynchronously
     */
    @Async
    @Transactional
    public void trackUserInteraction(String userId, String action, String context, Map<String, Object> metadata) {
        try {
            UserInteraction interaction = UserInteraction.builder()
                    .userId(userId)
                    .action(action)
                    .context(context)
                    .metadata(metadata)
                    .timestamp(LocalDateTime.now())
                    .sessionId(generateSessionId(userId))
                    .build();

            userInteractionRepository.save(interaction);
            
            // Create analytics event
            AnalyticsEvent event = AnalyticsEvent.builder()
                    .userId(userId)
                    .eventType("USER_INTERACTION")
                    .eventData(Map.of(
                            "action", action,
                            "context", context,
                            "metadata", metadata
                    ))
                    .timestamp(LocalDateTime.now())
                    .build();
            
            analyticsEventRepository.save(event);
            
            log.info("Tracked user interaction: userId={}, action={}, context={}", userId, action, context);
            
            // Trigger real-time analysis
            analyzeInteractionInRealTime(interaction);
            
        } catch (Exception e) {
            log.error("Failed to track user interaction for userId: {}", userId, e);
        }
    }

    /**
     * Get user behavior patterns with caching
     */
    @Cacheable(value = "userBehaviorPatterns", key = "#userId")
    @Transactional(readOnly = true)
    public UserBehaviorPattern getUserBehaviorPattern(String userId) {
        List<UserInteraction> interactions = userInteractionRepository
                .findByUserIdAndTimestampAfter(userId, LocalDateTime.now().minus(30, ChronoUnit.DAYS));

        return analyzeUserBehavior(interactions);
    }

    /**
     * Get comprehensive analytics dashboard data
     */
    @Cacheable(value = "analyticsDashboard", key = "#userId + '_' + #timeRange")
    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsDashboard(String userId, String timeRange) {
        LocalDateTime startDate = getStartDateForTimeRange(timeRange);
        
        List<UserInteraction> interactions = userInteractionRepository
                .findByUserIdAndTimestampAfter(userId, startDate);
        
        Map<String, Object> dashboard = new HashMap<>();
        
        // Basic metrics
        dashboard.put("totalInteractions", interactions.size());
        dashboard.put("uniqueActions", interactions.stream()
                .map(UserInteraction::getAction)
                .distinct()
                .count());
        
        // Activity timeline
        Map<String, Long> activityTimeline = interactions.stream()
                .collect(Collectors.groupingBy(
                        interaction -> interaction.getTimestamp().toLocalDate().toString(),
                        Collectors.counting()
                ));
        dashboard.put("activityTimeline", activityTimeline);
        
        // Most used features
        Map<String, Long> featureUsage = interactions.stream()
                .collect(Collectors.groupingBy(
                        UserInteraction::getAction,
                        Collectors.counting()
                ));
        dashboard.put("featureUsage", featureUsage);
        
        // Performance metrics
        dashboard.put("averageSessionDuration", calculateAverageSessionDuration(interactions));
        dashboard.put("peakUsageHours", getPeakUsageHours(interactions));
        
        // User engagement score
        dashboard.put("engagementScore", calculateEngagementScore(interactions));
        
        return dashboard;
    }

    /**
     * Generate predictive insights based on user behavior
     */
    @Async
    public void generatePredictiveInsights(String userId) {
        try {
            UserBehaviorPattern pattern = getUserBehaviorPattern(userId);
            List<String> predictions = new ArrayList<>();
            
            // Predict next likely actions
            if (pattern.getMostFrequentAction().equals("tactical_analysis")) {
                predictions.add("User likely to request formation recommendations");
            }
            
            if (pattern.getAverageSessionDuration() > 30) {
                predictions.add("User shows high engagement - good candidate for premium features");
            }
            
            // Store insights
            insightsService.storePredictiveInsights(userId, predictions);
            
        } catch (Exception e) {
            log.error("Failed to generate predictive insights for userId: {}", userId, e);
        }
    }

    /**
     * Real-time interaction analysis
     */
    private void analyzeInteractionInRealTime(UserInteraction interaction) {
        // Detect anomalies
        if (isAnomalousInteraction(interaction)) {
            log.warn("Anomalous interaction detected: {}", interaction);
            // Trigger security check or alert
        }
        
        // Update real-time metrics
        updateRealTimeMetrics(interaction);
        
        // Check for immediate insights
        checkForImmediateInsights(interaction);
    }

    /**
     * Analyze user behavior patterns
     */
    private UserBehaviorPattern analyzeUserBehavior(List<UserInteraction> interactions) {
        if (interactions.isEmpty()) {
            return UserBehaviorPattern.builder()
                    .userId("unknown")
                    .totalInteractions(0)
                    .averageSessionDuration(0.0)
                    .mostFrequentAction("none")
                    .preferredTimeOfDay("unknown")
                    .engagementLevel("low")
                    .build();
        }
        
        String userId = interactions.get(0).getUserId();
        
        // Calculate metrics
        String mostFrequentAction = interactions.stream()
                .collect(Collectors.groupingBy(UserInteraction::getAction, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("unknown");
        
        double averageSessionDuration = calculateAverageSessionDuration(interactions);
        String preferredTimeOfDay = getPreferredTimeOfDay(interactions);
        String engagementLevel = calculateEngagementLevel(interactions);
        
        return UserBehaviorPattern.builder()
                .userId(userId)
                .totalInteractions(interactions.size())
                .averageSessionDuration(averageSessionDuration)
                .mostFrequentAction(mostFrequentAction)
                .preferredTimeOfDay(preferredTimeOfDay)
                .engagementLevel(engagementLevel)
                .lastAnalyzed(LocalDateTime.now())
                .build();
    }

    // Helper methods
    private String generateSessionId(String userId) {
        return userId + "_" + System.currentTimeMillis();
    }

    private LocalDateTime getStartDateForTimeRange(String timeRange) {
        return switch (timeRange.toLowerCase()) {
            case "day" -> LocalDateTime.now().minus(1, ChronoUnit.DAYS);
            case "week" -> LocalDateTime.now().minus(7, ChronoUnit.DAYS);
            case "month" -> LocalDateTime.now().minus(30, ChronoUnit.DAYS);
            case "year" -> LocalDateTime.now().minus(365, ChronoUnit.DAYS);
            default -> LocalDateTime.now().minus(7, ChronoUnit.DAYS);
        };
    }

    private double calculateAverageSessionDuration(List<UserInteraction> interactions) {
        // Implementation for session duration calculation
        return interactions.stream()
                .collect(Collectors.groupingBy(UserInteraction::getSessionId))
                .values().stream()
                .mapToDouble(this::calculateSessionDuration)
                .average()
                .orElse(0.0);
    }

    private double calculateSessionDuration(List<UserInteraction> sessionInteractions) {
        if (sessionInteractions.size() < 2) return 0.0;
        
        LocalDateTime start = sessionInteractions.stream()
                .map(UserInteraction::getTimestamp)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());
        
        LocalDateTime end = sessionInteractions.stream()
                .map(UserInteraction::getTimestamp)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());
        
        return ChronoUnit.MINUTES.between(start, end);
    }

    private List<Integer> getPeakUsageHours(List<UserInteraction> interactions) {
        return interactions.stream()
                .collect(Collectors.groupingBy(
                        interaction -> interaction.getTimestamp().getHour(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private double calculateEngagementScore(List<UserInteraction> interactions) {
        // Complex engagement calculation based on various factors
        double baseScore = Math.min(interactions.size() / 10.0, 10.0); // Max 10 points for volume
        double diversityScore = interactions.stream()
                .map(UserInteraction::getAction)
                .distinct()
                .count() * 2.0; // 2 points per unique action
        double recencyScore = interactions.stream()
                .mapToLong(interaction -> ChronoUnit.HOURS.between(interaction.getTimestamp(), LocalDateTime.now()))
                .average()
                .map(avg -> Math.max(0, 10 - (avg / 24.0))) // Decay over days
                .orElse(0.0);
        
        return Math.min((baseScore + diversityScore + recencyScore) / 3.0, 10.0);
    }

    private String getPreferredTimeOfDay(List<UserInteraction> interactions) {
        Map<String, Long> timeSlots = interactions.stream()
                .collect(Collectors.groupingBy(
                        interaction -> {
                            int hour = interaction.getTimestamp().getHour();
                            if (hour >= 6 && hour < 12) return "morning";
                            if (hour >= 12 && hour < 18) return "afternoon";
                            if (hour >= 18 && hour < 22) return "evening";
                            return "night";
                        },
                        Collectors.counting()
                ));
        
        return timeSlots.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("unknown");
    }

    private String calculateEngagementLevel(List<UserInteraction> interactions) {
        double score = calculateEngagementScore(interactions);
        if (score >= 8.0) return "high";
        if (score >= 5.0) return "medium";
        return "low";
    }

    private boolean isAnomalousInteraction(UserInteraction interaction) {
        // Simple anomaly detection - can be enhanced with ML models
        return interaction.getMetadata() != null && 
               interaction.getMetadata().containsKey("suspicious");
    }

    private void updateRealTimeMetrics(UserInteraction interaction) {
        // Update real-time dashboards, metrics, etc.
        log.debug("Updated real-time metrics for interaction: {}", interaction.getId());
    }

    private void checkForImmediateInsights(UserInteraction interaction) {
        // Check for patterns that require immediate action
        if ("error".equals(interaction.getAction())) {
            insightsService.recordErrorPattern(interaction.getUserId(), interaction.getContext());
        }
    }
}