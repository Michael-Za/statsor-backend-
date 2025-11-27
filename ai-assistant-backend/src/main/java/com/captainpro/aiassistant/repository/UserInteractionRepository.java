package com.captainpro.aiassistant.repository;

import com.captainpro.aiassistant.entity.User;
import com.captainpro.aiassistant.entity.UserInteraction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User Interaction Repository Interface
 * 
 * Provides data access operations for UserInteraction entities
 * supporting analytics, behavior tracking, and performance monitoring.
 */
@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {

    // Basic queries
    List<UserInteraction> findByUser(User user);
    List<UserInteraction> findByUserId(Long userId);
    List<UserInteraction> findBySessionId(String sessionId);
    
    // Interaction type queries
    List<UserInteraction> findByInteractionType(String interactionType);
    List<UserInteraction> findByAction(String action);
    List<UserInteraction> findByCategory(String category);
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.user = :user AND ui.interactionType = :type")
    List<UserInteraction> findByUserAndInteractionType(@Param("user") User user, 
                                                      @Param("type") String interactionType);
    
    // Time-based queries
    List<UserInteraction> findByTimestampAfter(LocalDateTime timestamp);
    List<UserInteraction> findByTimestampBefore(LocalDateTime timestamp);
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.timestamp BETWEEN :startDate AND :endDate")
    List<UserInteraction> findByTimestampBetween(@Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.user = :user " +
           "AND ui.timestamp BETWEEN :startDate AND :endDate")
    List<UserInteraction> findByUserAndTimestampBetween(@Param("user") User user,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);
    
    // Status and success queries
    List<UserInteraction> findByIsSuccessful(Boolean isSuccessful);
    List<UserInteraction> findByStatus(UserInteraction.Status status);
    List<UserInteraction> findByPriority(UserInteraction.Priority priority);
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.user = :user AND ui.isSuccessful = :successful")
    List<UserInteraction> findByUserAndSuccess(@Param("user") User user, 
                                              @Param("successful") Boolean successful);
    
    // Performance queries
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.responseTimeMs > :threshold")
    List<UserInteraction> findSlowInteractions(@Param("threshold") Long threshold);
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.duration > :threshold")
    List<UserInteraction> findLongDurationInteractions(@Param("threshold") Long threshold);
    
    // Error tracking
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.errorMessage IS NOT NULL")
    List<UserInteraction> findInteractionsWithErrors();
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.user = :user AND ui.errorMessage IS NOT NULL")
    List<UserInteraction> findUserInteractionsWithErrors(@Param("user") User user);
    
    // Analytics queries
    @Query("SELECT COUNT(ui) FROM UserInteraction ui WHERE ui.user = :user")
    Long countByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(ui) FROM UserInteraction ui WHERE ui.interactionType = :type")
    Long countByInteractionType(@Param("type") String interactionType);
    
    @Query("SELECT COUNT(ui) FROM UserInteraction ui WHERE ui.timestamp >= :date")
    Long countInteractionsAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(ui) FROM UserInteraction ui WHERE ui.user = :user " +
           "AND ui.timestamp >= :date")
    Long countUserInteractionsAfter(@Param("user") User user, @Param("date") LocalDateTime date);
    
    // Aggregation queries
    @Query("SELECT ui.interactionType, COUNT(ui) FROM UserInteraction ui " +
           "GROUP BY ui.interactionType ORDER BY COUNT(ui) DESC")
    List<Object[]> getInteractionTypeStatistics();
    
    @Query("SELECT ui.action, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.action IS NOT NULL GROUP BY ui.action ORDER BY COUNT(ui) DESC")
    List<Object[]> getActionStatistics();
    
    @Query("SELECT ui.category, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.category IS NOT NULL GROUP BY ui.category ORDER BY COUNT(ui) DESC")
    List<Object[]> getCategoryStatistics();
    
    // User behavior patterns
    @Query("SELECT ui.user, COUNT(ui), AVG(ui.responseTimeMs), AVG(ui.duration) " +
           "FROM UserInteraction ui GROUP BY ui.user")
    List<Object[]> getUserBehaviorStatistics();
    
    @Query("SELECT ui.user, ui.interactionType, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.user = :user GROUP BY ui.user, ui.interactionType")
    List<Object[]> getUserInteractionPatterns(@Param("user") User user);
    
    // Time-based analytics
    @Query("SELECT DATE(ui.timestamp), COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.timestamp >= :startDate GROUP BY DATE(ui.timestamp) " +
           "ORDER BY DATE(ui.timestamp)")
    List<Object[]> getDailyInteractionCounts(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT HOUR(ui.timestamp), COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.timestamp >= :startDate GROUP BY HOUR(ui.timestamp) " +
           "ORDER BY HOUR(ui.timestamp)")
    List<Object[]> getHourlyInteractionCounts(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DAYOFWEEK(ui.timestamp), COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.timestamp >= :startDate GROUP BY DAYOFWEEK(ui.timestamp) " +
           "ORDER BY DAYOFWEEK(ui.timestamp)")
    List<Object[]> getWeeklyInteractionPatterns(@Param("startDate") LocalDateTime startDate);
    
    // Performance analytics
    @Query("SELECT AVG(ui.responseTimeMs) FROM UserInteraction ui " +
           "WHERE ui.responseTimeMs IS NOT NULL")
    Double getAverageResponseTime();
    
    @Query("SELECT AVG(ui.duration) FROM UserInteraction ui " +
           "WHERE ui.duration IS NOT NULL")
    Double getAverageDuration();
    
    @Query("SELECT MIN(ui.responseTimeMs), MAX(ui.responseTimeMs), AVG(ui.responseTimeMs) " +
           "FROM UserInteraction ui WHERE ui.responseTimeMs IS NOT NULL")
    Object[] getResponseTimeStatistics();
    
    @Query("SELECT ui.interactionType, AVG(ui.responseTimeMs) FROM UserInteraction ui " +
           "WHERE ui.responseTimeMs IS NOT NULL GROUP BY ui.interactionType")
    List<Object[]> getAverageResponseTimeByType();
    
    // Success rate analytics
    @Query("SELECT COUNT(ui) * 100.0 / (SELECT COUNT(ui2) FROM UserInteraction ui2) " +
           "FROM UserInteraction ui WHERE ui.isSuccessful = true")
    Double getOverallSuccessRate();
    
    @Query("SELECT ui.interactionType, " +
           "COUNT(CASE WHEN ui.isSuccessful = true THEN 1 END) * 100.0 / COUNT(ui) " +
           "FROM UserInteraction ui GROUP BY ui.interactionType")
    List<Object[]> getSuccessRateByType();
    
    @Query("SELECT ui.user, " +
           "COUNT(CASE WHEN ui.isSuccessful = true THEN 1 END) * 100.0 / COUNT(ui) " +
           "FROM UserInteraction ui WHERE ui.user = :user GROUP BY ui.user")
    Double getUserSuccessRate(@Param("user") User user);
    
    // Error analytics
    @Query("SELECT ui.errorMessage, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.errorMessage IS NOT NULL GROUP BY ui.errorMessage " +
           "ORDER BY COUNT(ui) DESC")
    List<Object[]> getErrorStatistics();
    
    @Query("SELECT COUNT(ui) * 100.0 / (SELECT COUNT(ui2) FROM UserInteraction ui2) " +
           "FROM UserInteraction ui WHERE ui.errorMessage IS NOT NULL")
    Double getErrorRate();
    
    // Device and location analytics
    @Query("SELECT ui.deviceInfo, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.deviceInfo IS NOT NULL GROUP BY ui.deviceInfo " +
           "ORDER BY COUNT(ui) DESC")
    List<Object[]> getDeviceStatistics();
    
    @Query("SELECT ui.location, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.location IS NOT NULL GROUP BY ui.location " +
           "ORDER BY COUNT(ui) DESC")
    List<Object[]> getLocationStatistics();
    
    @Query("SELECT ui.timezone, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.timezone IS NOT NULL GROUP BY ui.timezone " +
           "ORDER BY COUNT(ui) DESC")
    List<Object[]> getTimezoneStatistics();
    
    // Recent interactions
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.user = :user " +
           "ORDER BY ui.timestamp DESC")
    Page<UserInteraction> findRecentUserInteractions(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT ui FROM UserInteraction ui ORDER BY ui.timestamp DESC")
    Page<UserInteraction> findRecentInteractions(Pageable pageable);
    
    // Most active users
    @Query("SELECT ui.user, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.timestamp >= :startDate GROUP BY ui.user " +
           "ORDER BY COUNT(ui) DESC")
    Page<Object[]> findMostActiveUsers(@Param("startDate") LocalDateTime startDate, Pageable pageable);
    
    // Search functionality
    @Query("SELECT ui FROM UserInteraction ui WHERE " +
           "LOWER(ui.interactionType) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.action) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.target) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<UserInteraction> searchInteractions(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Advanced filtering
    @Query("SELECT ui FROM UserInteraction ui WHERE " +
           "(:userId IS NULL OR ui.user.id = :userId) AND " +
           "(:interactionType IS NULL OR ui.interactionType = :interactionType) AND " +
           "(:action IS NULL OR ui.action = :action) AND " +
           "(:category IS NULL OR ui.category = :category) AND " +
           "(:isSuccessful IS NULL OR ui.isSuccessful = :isSuccessful) AND " +
           "(:startDate IS NULL OR ui.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR ui.timestamp <= :endDate)")
    Page<UserInteraction> findInteractionsWithFilters(
        @Param("userId") Long userId,
        @Param("interactionType") String interactionType,
        @Param("action") String action,
        @Param("category") String category,
        @Param("isSuccessful") Boolean isSuccessful,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    // Session analytics
    @Query("SELECT ui.sessionId, COUNT(ui), AVG(ui.duration), MIN(ui.timestamp), MAX(ui.timestamp) " +
           "FROM UserInteraction ui WHERE ui.sessionId IS NOT NULL " +
           "GROUP BY ui.sessionId")
    List<Object[]> getSessionStatistics();
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.sessionId = :sessionId " +
           "ORDER BY ui.timestamp ASC")
    List<UserInteraction> findSessionInteractions(@Param("sessionId") String sessionId);
    
    // Cleanup operations
    @Query("DELETE FROM UserInteraction ui WHERE ui.timestamp < :cutoffDate")
    int deleteOldInteractions(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    @Query("SELECT COUNT(ui) FROM UserInteraction ui WHERE ui.timestamp < :cutoffDate")
    Long countOldInteractions(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Real-time analytics
    @Query("SELECT COUNT(ui) FROM UserInteraction ui WHERE ui.timestamp >= :timestamp")
    Long countRecentInteractions(@Param("timestamp") LocalDateTime timestamp);
    
    @Query("SELECT ui.interactionType, COUNT(ui) FROM UserInteraction ui " +
           "WHERE ui.timestamp >= :timestamp GROUP BY ui.interactionType")
    List<Object[]> getRecentInteractionsByType(@Param("timestamp") LocalDateTime timestamp);
    
    // User journey analysis
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.user = :user " +
           "AND ui.timestamp BETWEEN :startDate AND :endDate " +
           "ORDER BY ui.timestamp ASC")
    List<UserInteraction> getUserJourney(@Param("user") User user,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);
    
    // Conversion funnel analysis
    @Query("SELECT ui.action, COUNT(DISTINCT ui.user) FROM UserInteraction ui " +
           "WHERE ui.action IN :actions GROUP BY ui.action")
    List<Object[]> getFunnelAnalysis(@Param("actions") List<String> actions);
    
    // Custom metadata queries
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.metadata LIKE %:key% AND ui.metadata LIKE %:value%")
    List<UserInteraction> findByMetadata(@Param("key") String key, @Param("value") String value);
    
    @Query("SELECT ui FROM UserInteraction ui WHERE ui.contextData LIKE %:context%")
    List<UserInteraction> findByContext(@Param("context") String context);
}