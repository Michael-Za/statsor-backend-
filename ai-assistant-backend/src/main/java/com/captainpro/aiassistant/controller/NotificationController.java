package com.captainpro.aiassistant.controller;

import com.captainpro.aiassistant.service.NotificationService;
import com.captainpro.aiassistant.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Notification Controller
 * 
 * REST API endpoints for notification functionality including:
 * - Real-time notifications
 * - Email notifications
 * - Push notifications
 * - SMS notifications
 * - In-app messaging
 * - Notification preferences
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class NotificationController {

    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    /**
     * Send a notification
     */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> sendNotification(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String senderId = authentication.getName();
            String recipientId = (String) request.get("recipientId");
            String type = (String) request.getOrDefault("type", "info");
            String title = (String) request.get("title");
            String message = (String) request.get("message");
            List<String> channels = (List<String>) request.getOrDefault("channels", List.of("in_app"));
            Map<String, Object> metadata = (Map<String, Object>) request.getOrDefault("metadata", Map.of());
            
            log.info("Sending notification from: {} to: {} - Type: {} - Channels: {}", 
                    senderId, recipientId, type, channels);
            
            // Track notification sending
            analyticsService.trackUserInteraction(senderId, "send_notification", type, 
                Map.of("recipientId", recipientId, "channels", channels));
            
            CompletableFuture<Map<String, Object>> result = notificationService.sendNotification(
                recipientId, type, title, message, channels, metadata);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to send notification", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to send notification: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Send bulk notifications
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> sendBulkNotifications(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String senderId = authentication.getName();
            List<String> recipientIds = (List<String>) request.get("recipientIds");
            String type = (String) request.getOrDefault("type", "info");
            String title = (String) request.get("title");
            String message = (String) request.get("message");
            List<String> channels = (List<String>) request.getOrDefault("channels", List.of("in_app"));
            Map<String, Object> metadata = (Map<String, Object>) request.getOrDefault("metadata", Map.of());
            
            log.info("Sending bulk notifications from: {} to: {} recipients - Type: {}", 
                    senderId, recipientIds.size(), type);
            
            // Track bulk notification sending
            analyticsService.trackUserInteraction(senderId, "send_bulk_notification", type, 
                Map.of("recipientCount", recipientIds.size(), "channels", channels));
            
            CompletableFuture<Map<String, Object>> result = notificationService.sendBulkNotifications(
                recipientIds, type, title, message, channels, metadata);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to send bulk notifications", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to send bulk notifications: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get user notifications
     */
    @GetMapping("/inbox")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "all") String status,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting notifications for user: {} (limit: {}, offset: {}, status: {})", 
                    userId, limit, offset, status);
            
            // In a real implementation, this would fetch from database
            List<Map<String, Object>> notifications = List.of(
                Map.of(
                    "id", "notif_1",
                    "type", "performance_insight",
                    "title", "New Performance Insights Available",
                    "message", "Your weekly performance analysis is ready for review",
                    "status", "unread",
                    "priority", "medium",
                    "createdAt", System.currentTimeMillis() - 3600000,
                    "metadata", Map.of("insightId", "insight_123")
                ),
                Map.of(
                    "id", "notif_2",
                    "type", "training_reminder",
                    "title", "Training Session Reminder",
                    "message", "Don't forget your training session at 3 PM today",
                    "status", "read",
                    "priority", "high",
                    "createdAt", System.currentTimeMillis() - 7200000,
                    "metadata", Map.of("sessionId", "session_456")
                ),
                Map.of(
                    "id", "notif_3",
                    "type", "match_alert",
                    "title", "Upcoming Match",
                    "message", "Match against Team Alpha scheduled for tomorrow at 7 PM",
                    "status", "read",
                    "priority", "high",
                    "createdAt", System.currentTimeMillis() - 86400000,
                    "metadata", Map.of("matchId", "match_789")
                )
            );
            
            List<Map<String, Object>> filteredNotifications = notifications.stream()
                .filter(notif -> status.equals("all") || notif.get("status").equals(status))
                .skip(offset)
                .limit(limit)
                .toList();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", filteredNotifications,
                "pagination", Map.of(
                    "limit", limit,
                    "offset", offset,
                    "total", notifications.size(),
                    "unreadCount", notifications.stream()
                        .mapToInt(notif -> "unread".equals(notif.get("status")) ? 1 : 0)
                        .sum()
                )
            ));
            
        } catch (Exception e) {
            log.error("Failed to get user notifications", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get user notifications: " + e.getMessage()
            ));
        }
    }

    /**
     * Mark notification as read
     */
    @PostMapping("/{notificationId}/read")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable String notificationId,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Marking notification as read: {} for user: {}", notificationId, userId);
            
            // Track notification interaction
            analyticsService.trackUserInteraction(userId, "notification_read", "mark_read", 
                Map.of("notificationId", notificationId));
            
            // In a real implementation, this would update the database
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notification marked as read",
                "notificationId", notificationId
            ));
            
        } catch (Exception e) {
            log.error("Failed to mark notification as read", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to mark notification as read: " + e.getMessage()
            ));
        }
    }

    /**
     * Mark all notifications as read
     */
    @PostMapping("/read-all")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Marking all notifications as read for user: {}", userId);
            
            // Track bulk notification interaction
            analyticsService.trackUserInteraction(userId, "notification_read", "mark_all_read", Map.of());
            
            // In a real implementation, this would update the database
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All notifications marked as read",
                "markedCount", 5 // Mock count
            ));
            
        } catch (Exception e) {
            log.error("Failed to mark all notifications as read", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to mark all notifications as read: " + e.getMessage()
            ));
        }
    }

    /**
     * Delete notification
     */
    @DeleteMapping("/{notificationId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable String notificationId,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Deleting notification: {} for user: {}", notificationId, userId);
            
            // Track notification deletion
            analyticsService.trackUserInteraction(userId, "notification_delete", "delete", 
                Map.of("notificationId", notificationId));
            
            // In a real implementation, this would delete from database
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notification deleted successfully",
                "notificationId", notificationId
            ));
            
        } catch (Exception e) {
            log.error("Failed to delete notification", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to delete notification: " + e.getMessage()
            ));
        }
    }

    /**
     * Get notification preferences
     */
    @GetMapping("/preferences")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getNotificationPreferences(
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting notification preferences for user: {}", userId);
            
            // In a real implementation, this would fetch from database
            Map<String, Object> preferences = Map.of(
                "channels", Map.of(
                    "email", true,
                    "push", true,
                    "sms", false,
                    "in_app", true
                ),
                "types", Map.of(
                    "performance_insights", true,
                    "training_reminders", true,
                    "match_alerts", true,
                    "injury_alerts", true,
                    "system_updates", false,
                    "promotional", false
                ),
                "schedule", Map.of(
                    "quietHours", Map.of(
                        "enabled", true,
                        "start", "22:00",
                        "end", "08:00"
                    ),
                    "weekends", Map.of(
                        "enabled", true,
                        "reducedFrequency", true
                    )
                ),
                "frequency", Map.of(
                    "immediate", List.of("injury_alerts", "match_alerts"),
                    "daily", List.of("performance_insights"),
                    "weekly", List.of("training_reminders")
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", preferences
            ));
            
        } catch (Exception e) {
            log.error("Failed to get notification preferences", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get notification preferences: " + e.getMessage()
            ));
        }
    }

    /**
     * Update notification preferences
     */
    @PostMapping("/preferences")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> updateNotificationPreferences(
            @RequestBody Map<String, Object> preferences,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Updating notification preferences for user: {}", userId);
            
            // Track preference update
            analyticsService.trackUserInteraction(userId, "notification_preferences", "update", preferences);
            
            // In a real implementation, this would save to database
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notification preferences updated successfully",
                "data", preferences
            ));
            
        } catch (Exception e) {
            log.error("Failed to update notification preferences", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to update notification preferences: " + e.getMessage()
            ));
        }
    }

    /**
     * Send recommendation notification
     */
    @PostMapping("/recommendations")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> sendRecommendationNotification(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String senderId = authentication.getName();
            String recipientId = (String) request.get("recipientId");
            String recommendationType = (String) request.get("recommendationType");
            Map<String, Object> recommendationData = (Map<String, Object>) request.get("recommendationData");
            
            log.info("Sending recommendation notification from: {} to: {} - Type: {}", 
                    senderId, recipientId, recommendationType);
            
            CompletableFuture<Map<String, Object>> result = notificationService.sendRecommendationNotification(
                recipientId, recommendationType, recommendationData);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to send recommendation notification", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to send recommendation notification: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Send match alert
     */
    @PostMapping("/match-alert")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> sendMatchAlert(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String senderId = authentication.getName();
            List<String> recipientIds = (List<String>) request.get("recipientIds");
            Map<String, Object> matchDetails = (Map<String, Object>) request.get("matchDetails");
            
            log.info("Sending match alert from: {} to: {} recipients", senderId, recipientIds.size());
            
            CompletableFuture<Map<String, Object>> result = notificationService.sendMatchAlert(
                recipientIds, matchDetails);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to send match alert", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to send match alert: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Send performance insights notification
     */
    @PostMapping("/performance-insights")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> sendPerformanceInsightsNotification(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String senderId = authentication.getName();
            String recipientId = (String) request.get("recipientId");
            Map<String, Object> insights = (Map<String, Object>) request.get("insights");
            
            log.info("Sending performance insights notification from: {} to: {}", senderId, recipientId);
            
            CompletableFuture<Map<String, Object>> result = notificationService.sendPerformanceInsightsNotification(
                recipientId, insights);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to send performance insights notification", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to send performance insights notification: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get notification statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getNotificationStatistics(
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        
        try {
            log.info("Getting notification statistics for {} days", days);
            
            Map<String, Object> stats = Map.of(
                "overview", Map.of(
                    "totalSent", 1247,
                    "totalDelivered", 1198,
                    "totalRead", 892,
                    "deliveryRate", 0.961,
                    "readRate", 0.745
                ),
                "byType", List.of(
                    Map.of("type", "performance_insights", "sent", 345, "read", 267),
                    Map.of("type", "training_reminders", "sent", 289, "read", 234),
                    Map.of("type", "match_alerts", "sent", 156, "read", 142),
                    Map.of("type", "injury_alerts", "sent", 23, "read", 21)
                ),
                "byChannel", List.of(
                    Map.of("channel", "in_app", "sent", 1247, "delivered", 1247, "read", 892),
                    Map.of("channel", "email", "sent", 834, "delivered", 798, "read", 456),
                    Map.of("channel", "push", "sent", 567, "delivered", 523, "read", 234)
                ),
                "trends", Map.of(
                    "dailyAverage", 41.6,
                    "peakDay", "Tuesday",
                    "peakHour", 14,
                    "growthRate", 8.3
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats,
                "period", days + " days"
            ));
            
        } catch (Exception e) {
            log.error("Failed to get notification statistics", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get notification statistics: " + e.getMessage()
            ));
        }
    }
}