package com.aiassistant.service;

import com.aiassistant.entity.User;
import com.aiassistant.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service class for managing User entities and related business logic.
 * Provides comprehensive user management functionality including authentication,
 * profile management, role-based operations, and analytics.
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==================== Authentication Methods ====================

    /**
     * Find user by username for authentication
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Find user by email for authentication
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Authenticate user with username/email and password
     */
    public Optional<User> authenticateUser(String usernameOrEmail, String password) {
        Optional<User> user = userRepository.findByUsername(usernameOrEmail);
        if (user.isEmpty()) {
            user = userRepository.findByEmail(usernameOrEmail);
        }
        
        if (user.isPresent() && passwordEncoder.matches(password, user.get().getPassword())) {
            updateLastLogin(user.get().getId());
            return user;
        }
        return Optional.empty();
    }

    /**
     * Check if username exists
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Check if email exists
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // ==================== User Management Methods ====================

    /**
     * Create a new user
     */
    public User createUser(User user) {
        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    /**
     * Update user profile
     */
    public User updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    /**
     * Update user password
     */
    public void updatePassword(Long userId, String newPassword) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * Update last login timestamp
     */
    public void updateLastLogin(Long userId) {
        userRepository.updateLastLogin(userId, LocalDateTime.now());
    }

    /**
     * Get user by ID
     */
    @Transactional(readOnly = true)
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Get all users with pagination
     */
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    /**
     * Delete user (soft delete by updating status)
     */
    public void deleteUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus("DELETED");
            user.setDeletedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    // ==================== Status and Role Management ====================

    /**
     * Update user status
     */
    public void updateUserStatus(Long userId, String status) {
        userRepository.updateUserStatus(userId, status);
    }

    /**
     * Get users by status
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByStatus(String status) {
        return userRepository.findByStatus(status);
    }

    /**
     * Get users by role
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(String role) {
        return userRepository.findByRolesContaining(role);
    }

    /**
     * Add role to user
     */
    public void addRoleToUser(Long userId, String role) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.getRoles().contains(role)) {
                user.getRoles().add(role);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
            }
        }
    }

    /**
     * Remove role from user
     */
    public void removeRoleFromUser(Long userId, String role) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.getRoles().remove(role);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    // ==================== Search and Filter Methods ====================

    /**
     * Search users by name or email
     */
    @Transactional(readOnly = true)
    public List<User> searchUsers(String searchTerm) {
        return userRepository.searchByNameOrEmail(searchTerm);
    }

    /**
     * Get users by team
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByTeam(String team) {
        return userRepository.findByTeam(team);
    }

    /**
     * Get users by organization
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByOrganization(String organization) {
        return userRepository.findByOrganization(organization);
    }

    /**
     * Get users by position
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByPosition(String position) {
        return userRepository.findByPosition(position);
    }

    // ==================== Analytics and Statistics ====================

    /**
     * Get total user count
     */
    @Transactional(readOnly = true)
    public long getTotalUserCount() {
        return userRepository.count();
    }

    /**
     * Get user count by status
     */
    @Transactional(readOnly = true)
    public long getUserCountByStatus(String status) {
        return userRepository.countByStatus(status);
    }

    /**
     * Get user count by role
     */
    @Transactional(readOnly = true)
    public long getUserCountByRole(String role) {
        return userRepository.countByRolesContaining(role);
    }

    /**
     * Get active users count
     */
    @Transactional(readOnly = true)
    public long getActiveUsersCount() {
        return userRepository.countActiveUsers(LocalDateTime.now().minusDays(30));
    }

    /**
     * Get recently registered users
     */
    @Transactional(readOnly = true)
    public List<User> getRecentUsers(int limit) {
        return userRepository.findRecentUsers(Pageable.ofSize(limit));
    }

    /**
     * Get top performers by score
     */
    @Transactional(readOnly = true)
    public List<User> getTopPerformers(int limit) {
        return userRepository.findTopPerformers(Pageable.ofSize(limit));
    }

    /**
     * Get user statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStatistics() {
        return Map.of(
            "totalUsers", userRepository.count(),
            "activeUsers", userRepository.countByStatus("ACTIVE"),
            "inactiveUsers", userRepository.countByStatus("INACTIVE"),
            "deletedUsers", userRepository.countByStatus("DELETED"),
            "recentRegistrations", userRepository.countUsersCreatedAfter(LocalDateTime.now().minusDays(7)),
            "averagePerformanceScore", userRepository.getAveragePerformanceScore()
        );
    }

    // ==================== Performance and Insights ====================

    /**
     * Update user performance score
     */
    public void updatePerformanceScore(Long userId, Double score) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPerformanceScore(score);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * Get users with low performance
     */
    @Transactional(readOnly = true)
    public List<User> getLowPerformers(Double threshold) {
        return userRepository.findByPerformanceScoreLessThan(threshold);
    }

    /**
     * Get users with high performance
     */
    @Transactional(readOnly = true)
    public List<User> getHighPerformers(Double threshold) {
        return userRepository.findByPerformanceScoreGreaterThan(threshold);
    }

    // ==================== Utility Methods ====================

    /**
     * Check if user is active
     */
    @Transactional(readOnly = true)
    public boolean isUserActive(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        return user.isPresent() && "ACTIVE".equals(user.get().getStatus());
    }

    /**
     * Get user preferences
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserPreferences(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        return user.map(User::getPreferences).orElse(Map.of());
    }

    /**
     * Update user preferences
     */
    public void updateUserPreferences(Long userId, Map<String, Object> preferences) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPreferences(preferences);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * Cleanup inactive users
     */
    public void cleanupInactiveUsers(int daysInactive) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysInactive);
        userRepository.deleteInactiveUsers(cutoffDate);
    }
}