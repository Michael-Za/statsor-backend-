package com.captainpro.aiassistant.repository;

import com.captainpro.aiassistant.entity.User;
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
 * User Repository Interface
 * 
 * Provides data access operations for User entities including
 * authentication, user management, and analytics queries.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Authentication queries
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    // Status and role queries
    List<User> findByStatus(User.UserStatus status);
    List<User> findByRolesContaining(String role);
    
    @Query("SELECT u FROM User u WHERE u.status = :status AND :role MEMBER OF u.roles")
    List<User> findByStatusAndRole(@Param("status") User.UserStatus status, @Param("role") String role);
    
    // Activity queries
    List<User> findByLastLoginAfter(LocalDateTime dateTime);
    List<User> findByLastLoginBefore(LocalDateTime dateTime);
    
    @Query("SELECT u FROM User u WHERE u.lastLogin BETWEEN :startDate AND :endDate")
    List<User> findByLastLoginBetween(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    // Profile queries
    List<User> findByFirstNameContainingIgnoreCase(String firstName);
    List<User> findByLastNameContainingIgnoreCase(String lastName);
    
    @Query("SELECT u FROM User u WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :name, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<User> findByNameContaining(@Param("name") String name);
    
    // Team and organization queries
    List<User> findByTeam(String team);
    List<User> findByOrganization(String organization);
    List<User> findByPosition(String position);
    
    // Performance queries
    @Query("SELECT u FROM User u WHERE u.performanceScore >= :minScore")
    List<User> findByPerformanceScoreGreaterThanEqual(@Param("minScore") Double minScore);
    
    @Query("SELECT u FROM User u WHERE u.performanceScore BETWEEN :minScore AND :maxScore")
    List<User> findByPerformanceScoreBetween(@Param("minScore") Double minScore, 
                                           @Param("maxScore") Double maxScore);
    
    // Analytics queries
    @Query("SELECT COUNT(u) FROM User u WHERE u.status = :status")
    Long countByStatus(@Param("status") User.UserStatus status);
    
    @Query("SELECT COUNT(u) FROM User u WHERE :role MEMBER OF u.roles")
    Long countByRole(@Param("role") String role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :date")
    Long countUsersCreatedAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLogin >= :date")
    Long countActiveUsersAfter(@Param("date") LocalDateTime date);
    
    // Top performers
    @Query("SELECT u FROM User u WHERE u.performanceScore IS NOT NULL " +
           "ORDER BY u.performanceScore DESC")
    Page<User> findTopPerformers(Pageable pageable);
    
    // Recent users
    @Query("SELECT u FROM User u ORDER BY u.createdAt DESC")
    Page<User> findRecentUsers(Pageable pageable);
    
    // Active users
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' ORDER BY u.lastLogin DESC")
    Page<User> findActiveUsers(Pageable pageable);
    
    // Team statistics
    @Query("SELECT u.team, COUNT(u), AVG(u.performanceScore) FROM User u " +
           "WHERE u.team IS NOT NULL GROUP BY u.team")
    List<Object[]> getTeamStatistics();
    
    // Organization statistics
    @Query("SELECT u.organization, COUNT(u), AVG(u.performanceScore) FROM User u " +
           "WHERE u.organization IS NOT NULL GROUP BY u.organization")
    List<Object[]> getOrganizationStatistics();
    
    // Position statistics
    @Query("SELECT u.position, COUNT(u), AVG(u.performanceScore) FROM User u " +
           "WHERE u.position IS NOT NULL GROUP BY u.position")
    List<Object[]> getPositionStatistics();
    
    // User activity trends
    @Query("SELECT DATE(u.createdAt), COUNT(u) FROM User u " +
           "WHERE u.createdAt >= :startDate GROUP BY DATE(u.createdAt) " +
           "ORDER BY DATE(u.createdAt)")
    List<Object[]> getUserRegistrationTrends(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DATE(u.lastLogin), COUNT(u) FROM User u " +
           "WHERE u.lastLogin >= :startDate GROUP BY DATE(u.lastLogin) " +
           "ORDER BY DATE(u.lastLogin)")
    List<Object[]> getUserActivityTrends(@Param("startDate") LocalDateTime startDate);
    
    // Search functionality
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.team) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.organization) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.position) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Advanced filtering
    @Query("SELECT u FROM User u WHERE " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:team IS NULL OR u.team = :team) AND " +
           "(:organization IS NULL OR u.organization = :organization) AND " +
           "(:position IS NULL OR u.position = :position) AND " +
           "(:minScore IS NULL OR u.performanceScore >= :minScore) AND " +
           "(:maxScore IS NULL OR u.performanceScore <= :maxScore)")
    Page<User> findUsersWithFilters(
        @Param("status") User.UserStatus status,
        @Param("team") String team,
        @Param("organization") String organization,
        @Param("position") String position,
        @Param("minScore") Double minScore,
        @Param("maxScore") Double maxScore,
        Pageable pageable
    );
    
    // Bulk operations
    @Query("UPDATE User u SET u.status = :status WHERE u.id IN :userIds")
    int updateUserStatus(@Param("userIds") List<Long> userIds, @Param("status") User.UserStatus status);
    
    @Query("UPDATE User u SET u.team = :team WHERE u.id IN :userIds")
    int updateUserTeam(@Param("userIds") List<Long> userIds, @Param("team") String team);
    
    // Cleanup operations
    @Query("SELECT u FROM User u WHERE u.status = 'INACTIVE' AND u.lastLogin < :cutoffDate")
    List<User> findInactiveUsersForCleanup(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    @Query("DELETE FROM User u WHERE u.status = 'DELETED' AND u.updatedAt < :cutoffDate")
    int deleteOldDeletedUsers(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Performance insights
    @Query("SELECT AVG(u.performanceScore) FROM User u WHERE u.performanceScore IS NOT NULL")
    Double getAveragePerformanceScore();
    
    @Query("SELECT MIN(u.performanceScore), MAX(u.performanceScore) FROM User u " +
           "WHERE u.performanceScore IS NOT NULL")
    Object[] getPerformanceScoreRange();
    
    @Query("SELECT u FROM User u WHERE u.performanceScore IS NOT NULL " +
           "ORDER BY u.performanceScore ASC")
    Page<User> findLowestPerformers(Pageable pageable);
    
    // User engagement metrics
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLogin >= :date AND u.status = 'ACTIVE'")
    Long countEngagedUsers(@Param("date") LocalDateTime date);
    
    @Query("SELECT u FROM User u WHERE u.loginCount >= :minLogins ORDER BY u.loginCount DESC")
    List<User> findMostActiveUsers(@Param("minLogins") Integer minLogins);
    
    // Custom queries for specific business logic
    @Query("SELECT u FROM User u WHERE u.preferences LIKE %:preference%")
    List<User> findByPreference(@Param("preference") String preference);
    
    @Query("SELECT u FROM User u WHERE u.metadata LIKE %:key% AND u.metadata LIKE %:value%")
    List<User> findByMetadata(@Param("key") String key, @Param("value") String value);
    
    // Notification preferences
    @Query("SELECT u FROM User u WHERE u.notificationPreferences LIKE %:notificationType%")
    List<User> findUsersWithNotificationPreference(@Param("notificationType") String notificationType);
    
    // Time zone queries
    List<User> findByTimezone(String timezone);
    
    @Query("SELECT u.timezone, COUNT(u) FROM User u WHERE u.timezone IS NOT NULL " +
           "GROUP BY u.timezone ORDER BY COUNT(u) DESC")
    List<Object[]> getTimezoneDistribution();
    
    // Language preferences
    List<User> findByLanguage(String language);
    
    @Query("SELECT u.language, COUNT(u) FROM User u WHERE u.language IS NOT NULL " +
           "GROUP BY u.language ORDER BY COUNT(u) DESC")
    List<Object[]> getLanguageDistribution();
}