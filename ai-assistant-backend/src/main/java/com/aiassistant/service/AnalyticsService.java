package com.aiassistant.service;

import com.aiassistant.entity.UserInteraction;
import com.aiassistant.repository.UserInteractionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service class for managing analytics and user interaction tracking.
 * Provides comprehensive analytics functionality including behavior tracking,
 * performance monitoring, and data insights generation.
 */
@Service
@Transactional
public class AnalyticsService {

    @Autowired
    private UserInteractionRepository userInteractionRepository;

    // ==================== Interaction Tracking Methods ====================

    /**
     * Track a user interaction
     */
    public UserInteraction trackInteraction(UserInteraction interaction) {
        interaction.setCreatedAt(LocalDateTime.now());
        return userInteractionRepository.save(interaction);
    }

    /**
     * Track a simple user action
     */
    public UserInteraction trackUserAction(Long userId, String sessionId, String action, 
                                         String category, String target) {
        UserInteraction interaction = new UserInteraction();
        interaction.setUserId(userId);
        interaction.setSessionId(sessionId);
        interaction.setAction(action);
        interaction.setCategory(category);
        interaction.setTarget(target);
        interaction.setInteractionType("ACTION");
        interaction.setSuccess(true);
        interaction.setCreatedAt(LocalDateTime.now());
        
        return userInteractionRepository.save(interaction);
    }

    /**
     * Track page view
     */
    public UserInteraction trackPageView(Long userId, String sessionId, String url, 
                                       String userAgent, String ipAddress) {
        UserInteraction interaction = new UserInteraction();
        interaction.setUserId(userId);
        interaction.setSessionId(sessionId);
        interaction.setAction("PAGE_VIEW");
        interaction.setCategory("NAVIGATION");
        interaction.setUrl(url);
        interaction.setUserAgent(userAgent);
        interaction.setIpAddress(ipAddress);
        interaction.setInteractionType("VIEW");
        interaction.setSuccess(true);
        interaction.setCreatedAt(LocalDateTime.now());
        
        return userInteractionRepository.save(interaction);
    }

    /**
     * Track click event
     */
    public UserInteraction trackClick(Long userId, String sessionId, String target, 
                                    String category, Map<String, Object> metadata) {
        UserInteraction interaction = new UserInteraction();
        interaction.setUserId(userId);
        interaction.setSessionId(sessionId);
        interaction.setAction("CLICK");
        interaction.setCategory(category);
        interaction.setTarget(target);
        interaction.setInteractionType("CLICK");
        interaction.setMetadata(metadata);
        interaction.setSuccess(true);
        interaction.setCreatedAt(LocalDateTime.now());
        
        return userInteractionRepository.save(interaction);
    }

    // ==================== Query Methods ====================

    /**
     * Get interactions by user
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsByUser(Long userId) {
        return userInteractionRepository.findByUserId(userId);
    }

    /**
     * Get interactions by session
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsBySession(String sessionId) {
        return userInteractionRepository.findBySessionId(sessionId);
    }

    /**
     * Get interactions by type
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsByType(String interactionType) {
        return userInteractionRepository.findByInteractionType(interactionType);
    }

    /**
     * Get interactions by action
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsByAction(String action) {
        return userInteractionRepository.findByAction(action);
    }

    /**
     * Get interactions by category
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsByCategory(String category) {
        return userInteractionRepository.findByCategory(category);
    }

    // ==================== Time-based Analytics ====================

    /**
     * Get interactions within date range
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return userInteractionRepository.findByCreatedAtBetween(startDate, endDate);
    }

    /**
     * Get interactions from last N days
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getRecentInteractions(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return userInteractionRepository.findByCreatedAtAfter(startDate);
    }

    /**
     * Get today's interactions
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getTodayInteractions() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return userInteractionRepository.findByCreatedAtAfter(startOfDay);
    }

    // ==================== Performance Analytics ====================

    /**
     * Get slow interactions (above threshold)
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getSlowInteractions(Long responseTimeThreshold) {
        return userInteractionRepository.findByResponseTimeGreaterThan(responseTimeThreshold);
    }

    /**
     * Get long duration interactions
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getLongDurationInteractions(Long durationThreshold) {
        return userInteractionRepository.findByDurationGreaterThan(durationThreshold);
    }

    /**
     * Get failed interactions
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getFailedInteractions() {
        return userInteractionRepository.findBySuccess(false);
    }

    /**
     * Get interactions with errors
     */
    @Transactional(readOnly = true)
    public List<UserInteraction> getInteractionsWithErrors() {
        return userInteractionRepository.findByErrorMessageIsNotNull();
    }

    // ==================== Statistical Analytics ====================

    /**
     * Get total interaction count
     */
    @Transactional(readOnly = true)
    public long getTotalInteractionCount() {
        return userInteractionRepository.count();
    }

    /**
     * Get interaction count by type
     */
    @Transactional(readOnly = true)
    public long getInteractionCountByType(String interactionType) {
        return userInteractionRepository.countByInteractionType(interactionType);
    }

    /**
     * Get interaction count by action
     */
    @Transactional(readOnly = true)
    public long getInteractionCountByAction(String action) {
        return userInteractionRepository.countByAction(action);
    }

    /**
     * Get interaction count by category
     */
    @Transactional(readOnly = true)
    public long getInteractionCountByCategory(String category) {
        return userInteractionRepository.countByCategory(category);
    }

    /**
     * Get success rate for interactions
     */
    @Transactional(readOnly = true)
    public double getSuccessRate() {
        long totalCount = userInteractionRepository.count();
        if (totalCount == 0) return 0.0;
        
        long successCount = userInteractionRepository.countBySuccess(true);
        return (double) successCount / totalCount * 100.0;
    }

    /**
     * Get average response time
     */
    @Transactional(readOnly = true)
    public Double getAverageResponseTime() {
        return userInteractionRepository.getAverageResponseTime();
    }

    // ==================== User Behavior Analytics ====================

    /**
     * Get most active users
     */
    @Transactional(readOnly = true)
    public List<Object[]> getMostActiveUsers(int limit) {
        return userInteractionRepository.findMostActiveUsers(Pageable.ofSize(limit));
    }

    /**
     * Get user interaction patterns
     */
    @Transactional(readOnly = true)
    public List<Object[]> getUserInteractionPatterns(Long userId) {
        return userInteractionRepository.getUserInteractionPatterns(userId);
    }

    /**
     * Get popular actions
     */
    @Transactional(readOnly = true)
    public List<Object[]> getPopularActions(int limit) {
        return userInteractionRepository.getPopularActions(Pageable.ofSize(limit));
    }

    /**
     * Get popular categories
     */
    @Transactional(readOnly = true)
    public List<Object[]> getPopularCategories(int limit) {
        return userInteractionRepository.getPopularCategories(Pageable.ofSize(limit));
    }

    // ==================== Time-based Statistics ====================

    /**
     * Get hourly interaction statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getHourlyInteractionStats() {
        return userInteractionRepository.getHourlyInteractionStats();
    }

    /**
     * Get daily interaction statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getDailyInteractionStats(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return userInteractionRepository.getDailyInteractionStats(startDate);
    }

    /**
     * Get weekly interaction statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getWeeklyInteractionStats(int weeks) {
        LocalDateTime startDate = LocalDateTime.now().minusWeeks(weeks);
        return userInteractionRepository.getWeeklyInteractionStats(startDate);
    }

    // ==================== Device and Location Analytics ====================

    /**
     * Get device statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getDeviceStats() {
        return userInteractionRepository.getDeviceStats();
    }

    /**
     * Get location statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getLocationStats() {
        return userInteractionRepository.getLocationStats();
    }

    /**
     * Get browser statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getBrowserStats() {
        return userInteractionRepository.getBrowserStats();
    }

    // ==================== Session Analytics ====================

    /**
     * Get session statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSessionStats(String sessionId) {
        List<UserInteraction> interactions = userInteractionRepository.findBySessionId(sessionId);
        
        if (interactions.isEmpty()) {
            return Map.of();
        }
        
        long totalInteractions = interactions.size();
        long successfulInteractions = interactions.stream()
            .mapToLong(i -> i.getSuccess() ? 1 : 0)
            .sum();
        
        double avgResponseTime = interactions.stream()
            .filter(i -> i.getResponseTime() != null)
            .mapToLong(UserInteraction::getResponseTime)
            .average()
            .orElse(0.0);
        
        LocalDateTime sessionStart = interactions.stream()
            .map(UserInteraction::getCreatedAt)
            .min(LocalDateTime::compareTo)
            .orElse(null);
        
        LocalDateTime sessionEnd = interactions.stream()
            .map(UserInteraction::getCreatedAt)
            .max(LocalDateTime::compareTo)
            .orElse(null);
        
        return Map.of(
            "sessionId", sessionId,
            "totalInteractions", totalInteractions,
            "successfulInteractions", successfulInteractions,
            "successRate", totalInteractions > 0 ? (double) successfulInteractions / totalInteractions * 100 : 0,
            "averageResponseTime", avgResponseTime,
            "sessionStart", sessionStart,
            "sessionEnd", sessionEnd,
            "sessionDuration", sessionStart != null && sessionEnd != null ? 
                java.time.Duration.between(sessionStart, sessionEnd).toMinutes() : 0
        );
    }

    /**
     * Get average session duration
     */
    @Transactional(readOnly = true)
    public Double getAverageSessionDuration() {
        return userInteractionRepository.getAverageSessionDuration();
    }

    // ==================== Dashboard Analytics ====================

    /**
     * Get comprehensive analytics dashboard data
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardAnalytics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime weekStart = now.minusDays(7);
        LocalDateTime monthStart = now.minusDays(30);
        
        return Map.of(
            "totalInteractions", userInteractionRepository.count(),
            "todayInteractions", userInteractionRepository.countByCreatedAtAfter(todayStart),
            "weekInteractions", userInteractionRepository.countByCreatedAtAfter(weekStart),
            "monthInteractions", userInteractionRepository.countByCreatedAtAfter(monthStart),
            "successRate", getSuccessRate(),
            "averageResponseTime", getAverageResponseTime(),
            "mostActiveUsers", getMostActiveUsers(5),
            "popularActions", getPopularActions(10),
            "hourlyStats", getHourlyInteractionStats(),
            "deviceStats", getDeviceStats(),
            "errorCount", userInteractionRepository.countBySuccess(false)
        );
    }

    // ==================== Cleanup and Maintenance ====================

    /**
     * Clean up old interactions
     */
    public void cleanupOldInteractions(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        userInteractionRepository.deleteByCreatedAtBefore(cutoffDate);
    }

    /**
     * Archive old interactions
     */
    public void archiveOldInteractions(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        List<UserInteraction> oldInteractions = userInteractionRepository.findByCreatedAtBefore(cutoffDate);
        
        // Here you could implement archiving logic (e.g., move to archive table or export to file)
        // For now, we'll just mark them as archived in metadata
        for (UserInteraction interaction : oldInteractions) {
            if (interaction.getMetadata() == null) {
                interaction.setMetadata(Map.of("archived", true, "archivedAt", LocalDateTime.now()));
            } else {
                interaction.getMetadata().put("archived", true);
                interaction.getMetadata().put("archivedAt", LocalDateTime.now());
            }
            userInteractionRepository.save(interaction);
        }
    }

    // ==================== Real-time Analytics ====================

    /**
     * Get real-time interaction count (last 5 minutes)
     */
    @Transactional(readOnly = true)
    public long getRealTimeInteractionCount() {
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        return userInteractionRepository.countByCreatedAtAfter(fiveMinutesAgo);
    }

    /**
     * Get current active sessions count
     */
    @Transactional(readOnly = true)
    public long getActiveSessionsCount() {
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
        return userInteractionRepository.countDistinctSessionsByCreatedAtAfter(thirtyMinutesAgo);
    }

    /**
     * Get real-time error rate
     */
    @Transactional(readOnly = true)
    public double getRealTimeErrorRate() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long totalRecent = userInteractionRepository.countByCreatedAtAfter(oneHourAgo);
        if (totalRecent == 0) return 0.0;
        
        long errorRecent = userInteractionRepository.countByCreatedAtAfterAndSuccess(oneHourAgo, false);
        return (double) errorRecent / totalRecent * 100.0;
    }
}