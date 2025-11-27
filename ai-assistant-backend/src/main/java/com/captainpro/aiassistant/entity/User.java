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
import java.util.Set;

/**
 * User Entity
 * 
 * Represents a user in the AI Assistant system with authentication,
 * profile information, and role-based access control.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "login_count")
    private Integer loginCount = 0;

    @Column(name = "preferred_language")
    private String preferredLanguage = "en";

    @Column(name = "timezone")
    private String timezone = "UTC";

    @Column(name = "notification_preferences", columnDefinition = "TEXT")
    private String notificationPreferences;

    @Column(name = "ai_preferences", columnDefinition = "TEXT")
    private String aiPreferences;

    @Column(name = "team_id")
    private String teamId;

    @Column(name = "position")
    private String position;

    @Column(name = "jersey_number")
    private Integer jerseyNumber;

    @Column(name = "date_of_birth")
    private LocalDateTime dateOfBirth;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(name = "dominant_foot")
    private String dominantFoot;

    @Column(name = "contract_start")
    private LocalDateTime contractStart;

    @Column(name = "contract_end")
    private LocalDateTime contractEnd;

    @Column(name = "market_value")
    private Double marketValue;

    @Column(name = "performance_rating")
    private Double performanceRating;

    @Column(name = "injury_status")
    private String injuryStatus = "healthy";

    @Column(name = "training_load")
    private Double trainingLoad;

    @Column(name = "fitness_level")
    private Double fitnessLevel;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<UserInteraction> interactions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Notification> notifications;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<ChatMessage> chatMessages;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<UserInsight> insights;

    // Enums
    public enum UserRole {
        ADMIN, COACH, PLAYER, ANALYST, MEDICAL_STAFF, USER
    }

    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION, DELETED
    }

    // Helper methods
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return username;
    }

    public boolean isPlayer() {
        return role == UserRole.PLAYER;
    }

    public boolean isCoach() {
        return role == UserRole.COACH;
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean canAccessAnalytics() {
        return role == UserRole.ADMIN || role == UserRole.COACH || role == UserRole.ANALYST;
    }

    public boolean canPerformActions() {
        return role == UserRole.ADMIN || role == UserRole.COACH;
    }

    public boolean canViewInsights() {
        return isActive && (role != UserRole.USER || isVerified);
    }

    public void incrementLoginCount() {
        this.loginCount = (this.loginCount == null) ? 1 : this.loginCount + 1;
        this.lastLogin = LocalDateTime.now();
    }

    public boolean isHealthy() {
        return "healthy".equalsIgnoreCase(injuryStatus);
    }

    public boolean isInjured() {
        return !isHealthy();
    }

    public int getAge() {
        if (dateOfBirth == null) {
            return 0;
        }
        return LocalDateTime.now().getYear() - dateOfBirth.getYear();
    }

    public double getBMI() {
        if (heightCm == null || weightKg == null || heightCm == 0) {
            return 0.0;
        }
        double heightM = heightCm / 100.0;
        return weightKg / (heightM * heightM);
    }

    public boolean isContractActive() {
        if (contractStart == null || contractEnd == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(contractStart) && now.isBefore(contractEnd);
    }

    public long getDaysUntilContractExpiry() {
        if (contractEnd == null) {
            return -1;
        }
        return java.time.Duration.between(LocalDateTime.now(), contractEnd).toDays();
    }

    public String getPerformanceGrade() {
        if (performanceRating == null) {
            return "N/A";
        }
        if (performanceRating >= 90) return "A+";
        if (performanceRating >= 80) return "A";
        if (performanceRating >= 70) return "B";
        if (performanceRating >= 60) return "C";
        if (performanceRating >= 50) return "D";
        return "F";
    }

    public String getFitnessLevel() {
        if (fitnessLevel == null) {
            return "Unknown";
        }
        if (fitnessLevel >= 90) return "Excellent";
        if (fitnessLevel >= 75) return "Good";
        if (fitnessLevel >= 60) return "Average";
        if (fitnessLevel >= 45) return "Below Average";
        return "Poor";
    }

    public boolean needsAttention() {
        return isInjured() || 
               (performanceRating != null && performanceRating < 60) ||
               (fitnessLevel != null && fitnessLevel < 60) ||
               (trainingLoad != null && trainingLoad > 85);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}