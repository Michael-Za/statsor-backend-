package com.captainpro.aiassistant.repository;

import com.captainpro.aiassistant.entity.User;
import com.captainpro.aiassistant.entity.UserInsight;
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
 * User Insight Repository Interface
 * 
 * Provides data access operations for UserInsight entities
 * supporting insights generation, analytics, and recommendations.
 */
@Repository
public interface UserInsightRepository extends JpaRepository<UserInsight, Long> {

    // Basic queries
    List<UserInsight> findByUser(User user);
    List<UserInsight> findByUserId(Long userId);
    Optional<UserInsight> findByInsightId(String insightId);
    
    // Type and category queries
    List<UserInsight> findByType(UserInsight.InsightType type);
    List<UserInsight> findByCategory(UserInsight.InsightCategory category);
    
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user AND ui.type = :type")
    List<UserInsight> findByUserAndType(@Param("user") User user, 
                                       @Param("type") UserInsight.InsightType type);
    
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user AND ui.category = :category")
    List<UserInsight> findByUserAndCategory(@Param("user") User user, 
                                           @Param("category") UserInsight.InsightCategory category);
    
    // Status and priority queries
    List<UserInsight> findByStatus(UserInsight.Status status);
    List<UserInsight> findByPriority(UserInsight.Priority priority);
    
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user AND ui.status = :status")
    List<UserInsight> findByUserAndStatus(@Param("user") User user, 
                                         @Param("status") UserInsight.Status status);
    
    // Active insights
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user AND ui.status = 'ACTIVE' " +
           "AND (ui.expiresAt IS NULL OR ui.expiresAt > :now)")
    List<UserInsight> findActiveUserInsights(@Param("user") User user, 
                                            @Param("now") LocalDateTime now);
    
    // High priority insights
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user " +
           "AND ui.priority IN ('HIGH', 'URGENT', 'CRITICAL') AND ui.status = 'ACTIVE' " +
           "ORDER BY ui.priority DESC, ui.createdAt DESC")
    List<UserInsight> findHighPriorityInsights(@Param("user") User user);
    
    // Recent insights
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user " +
           "ORDER BY ui.createdAt DESC")
    Page<UserInsight> findRecentUserInsights(@Param("user") User user, Pageable pageable);
    
    // Time-based queries
    List<UserInsight> findByCreatedAtAfter(LocalDateTime dateTime);
    List<UserInsight> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user " +
           "AND ui.createdAt BETWEEN :startDate AND :endDate")
    List<UserInsight> findByUserAndCreatedAtBetween(@Param("user") User user,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
    
    // Bookmarked and starred insights
    List<UserInsight> findByUserAndIsBookmarked(User user, Boolean isBookmarked);
    List<UserInsight> findByUserAndIsStarred(User user, Boolean isStarred);
    
    // Analytics queries
    @Query("SELECT COUNT(ui) FROM UserInsight ui WHERE ui.user = :user")
    Long countByUser(@Param("user") User user);
    
    @Query("SELECT ui.type, COUNT(ui) FROM UserInsight ui GROUP BY ui.type")
    List<Object[]> getInsightTypeStatistics();
    
    @Query("SELECT ui.category, COUNT(ui) FROM UserInsight ui GROUP BY ui.category")
    List<Object[]> getInsightCategoryStatistics();
    
    @Query("SELECT ui.priority, COUNT(ui) FROM UserInsight ui GROUP BY ui.priority")
    List<Object[]> getInsightPriorityStatistics();
    
    // Performance insights
    @Query("SELECT ui FROM UserInsight ui WHERE ui.confidenceScore >= :minConfidence " +
           "ORDER BY ui.confidenceScore DESC")
    List<UserInsight> findHighConfidenceInsights(@Param("minConfidence") Double minConfidence);
    
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user " +
           "AND ui.confidenceScore >= :minConfidence ORDER BY ui.confidenceScore DESC")
    List<UserInsight> findUserHighConfidenceInsights(@Param("user") User user, 
                                                     @Param("minConfidence") Double minConfidence);
    
    // Search functionality
    @Query("SELECT ui FROM UserInsight ui WHERE " +
           "LOWER(ui.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.summary) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<UserInsight> searchInsights(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT ui FROM UserInsight ui WHERE ui.user = :user AND (" +
           "LOWER(ui.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(ui.summary) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<UserInsight> searchUserInsights(@Param("user") User user, 
                                        @Param("searchTerm") String searchTerm, 
                                        Pageable pageable);
    
    // Expiration handling
    @Query("SELECT ui FROM UserInsight ui WHERE ui.expiresAt <= :now AND ui.status != 'EXPIRED'")
    List<UserInsight> findExpiredInsights(@Param("now") LocalDateTime now);
    
    // Popular insights
    @Query("SELECT ui FROM UserInsight ui WHERE ui.viewCount >= :minViews " +
           "ORDER BY ui.viewCount DESC")
    List<UserInsight> findPopularInsights(@Param("minViews") Integer minViews);
    
    // Well-rated insights
    @Query("SELECT ui FROM UserInsight ui WHERE ui.rating >= :minRating " +
           "ORDER BY ui.rating DESC")
    List<UserInsight> findWellRatedInsights(@Param("minRating") Double minRating);
}