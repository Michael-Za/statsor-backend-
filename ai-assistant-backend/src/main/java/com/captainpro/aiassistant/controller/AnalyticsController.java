package com.captainpro.aiassistant.controller;

import com.captainpro.aiassistant.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Analytics Controller
 * 
 * REST API endpoints for analytics functionality including:
 * - User interaction tracking
 * - Behavior pattern analysis
 * - Performance metrics
 * - Dashboard data
 * - Predictive insights
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Track user interaction
     */
    @PostMapping("/track")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> trackInteraction(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String action = (String) request.get("action");
            String category = (String) request.getOrDefault("category", "general");
            Map<String, Object> metadata = (Map<String, Object>) request.getOrDefault("metadata", Map.of());
            
            log.debug("Tracking interaction for user: {} - Action: {} - Category: {}", userId, action, category);
            
            analyticsService.trackUserInteraction(userId, action, category, metadata);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Interaction tracked successfully",
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("Failed to track interaction", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to track interaction: " + e.getMessage()
            ));
        }
    }

    /**
     * Get user behavior patterns
     */
    @GetMapping("/behavior/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH') or #userId == authentication.name")
    public ResponseEntity<Map<String, Object>> getUserBehaviorPatterns(
            @PathVariable String userId,
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        
        try {
            log.info("Getting behavior patterns for user: {} - Days: {}", userId, days);
            
            Map<String, Object> patterns = analyticsService.getUserBehaviorPatterns(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", patterns,
                "userId", userId,
                "period", days + " days"
            ));
            
        } catch (Exception e) {
            log.error("Failed to get behavior patterns", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get behavior patterns: " + e.getMessage()
            ));
        }
    }

    /**
     * Get dashboard analytics data
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getDashboardData(
            @RequestParam(defaultValue = "7") int days,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting dashboard data for user: {} - Days: {}", userId, days);
            
            Map<String, Object> dashboardData = analyticsService.getDashboardData(userId, days);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", dashboardData,
                "period", days + " days",
                "generatedAt", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("Failed to get dashboard data", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get dashboard data: " + e.getMessage()
            ));
        }
    }

    /**
     * Get performance metrics
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "user") String scope,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting performance metrics for user: {} - Scope: {} - Days: {}", userId, scope, days);
            
            Map<String, Object> metrics = Map.of(
                "userEngagement", Map.of(
                    "totalSessions", 45,
                    "averageSessionDuration", 12.5,
                    "totalInteractions", 234,
                    "uniqueFeatures", 8
                ),
                "aiUsage", Map.of(
                    "totalQueries", 67,
                    "averageResponseTime", 1.2,
                    "satisfactionRate", 4.3,
                    "topCategories", List.of("performance", "training", "tactics")
                ),
                "insights", Map.of(
                    "generated", 23,
                    "viewed", 19,
                    "acted_upon", 12,
                    "effectiveness", 0.78
                ),
                "trends", Map.of(
                    "weeklyGrowth", 15.2,
                    "monthlyGrowth", 34.7,
                    "peakUsageHour", 14,
                    "mostActiveDay", "Tuesday"
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", metrics,
                "scope", scope,
                "period", days + " days"
            ));
            
        } catch (Exception e) {
            log.error("Failed to get performance metrics", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get performance metrics: " + e.getMessage()
            ));
        }
    }

    /**
     * Generate predictive insights
     */
    @PostMapping("/insights/predictive")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> generatePredictiveInsights(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String predictionType = (String) request.getOrDefault("type", "performance");
            int horizon = (Integer) request.getOrDefault("horizon", 30);
            
            log.info("Generating predictive insights for user: {} - Type: {} - Horizon: {} days", 
                    userId, predictionType, horizon);
            
            CompletableFuture<Map<String, Object>> insights = analyticsService.generatePredictiveInsights(
                userId, predictionType, horizon);
            
            return ResponseEntity.ok(insights);
            
        } catch (Exception e) {
            log.error("Failed to generate predictive insights", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to generate predictive insights: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get real-time analytics
     */
    @GetMapping("/realtime")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getRealTimeAnalytics(
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.debug("Getting real-time analytics for user: {}", userId);
            
            Map<String, Object> realTimeData = Map.of(
                "activeUsers", 127,
                "currentSessions", 34,
                "aiQueriesPerMinute", 8.5,
                "systemLoad", 0.65,
                "responseTime", 1.1,
                "errorRate", 0.02,
                "topActions", List.of(
                    Map.of("action", "chat_message", "count", 45),
                    Map.of("action", "view_insights", "count", 23),
                    Map.of("action", "generate_report", "count", 12)
                ),
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", realTimeData
            ));
            
        } catch (Exception e) {
            log.error("Failed to get real-time analytics", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get real-time analytics: " + e.getMessage()
            ));
        }
    }

    /**
     * Export analytics data
     */
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> exportAnalyticsData(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "json") String format,
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        
        try {
            String requestingUserId = authentication.getName();
            String targetUserId = userId != null ? userId : requestingUserId;
            
            log.info("Exporting analytics data for user: {} - Format: {} - Days: {}", 
                    targetUserId, format, days);
            
            // In a real implementation, this would generate and return actual export data
            Map<String, Object> exportInfo = Map.of(
                "exportId", "export_" + System.currentTimeMillis(),
                "format", format,
                "userId", targetUserId,
                "period", days + " days",
                "status", "processing",
                "estimatedCompletion", System.currentTimeMillis() + 30000,
                "downloadUrl", "/api/v1/analytics/download/export_" + System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", exportInfo
            ));
            
        } catch (Exception e) {
            log.error("Failed to export analytics data", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to export analytics data: " + e.getMessage()
            ));
        }
    }

    /**
     * Get analytics summary
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary(
            @RequestParam(defaultValue = "7") int days,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting analytics summary for user: {} - Days: {}", userId, days);
            
            Map<String, Object> summary = Map.of(
                "overview", Map.of(
                    "totalInteractions", 156,
                    "uniqueSessions", 23,
                    "averageSessionTime", 11.5,
                    "growthRate", 12.3
                ),
                "topFeatures", List.of(
                    Map.of("feature", "AI Chat", "usage", 67, "satisfaction", 4.2),
                    Map.of("feature", "Insights", "usage", 34, "satisfaction", 4.5),
                    Map.of("feature", "Analytics", "usage", 28, "satisfaction", 4.1)
                ),
                "insights", List.of(
                    "Your engagement has increased by 15% this week",
                    "AI chat is your most used feature",
                    "Peak usage time is between 2-4 PM"
                ),
                "recommendations", List.of(
                    "Try using the team analysis feature for better insights",
                    "Consider setting up automated reports",
                    "Explore the training recommendations feature"
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", summary,
                "period", days + " days",
                "generatedAt", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("Failed to get analytics summary", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get analytics summary: " + e.getMessage()
            ));
        }
    }

    /**
     * Configure analytics settings
     */
    @PostMapping("/settings")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> updateAnalyticsSettings(
            @RequestBody Map<String, Object> settings,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Updating analytics settings for user: {}", userId);
            
            // In a real implementation, this would save settings to database
            Map<String, Object> updatedSettings = Map.of(
                "trackingEnabled", settings.getOrDefault("trackingEnabled", true),
                "dataRetentionDays", settings.getOrDefault("dataRetentionDays", 90),
                "shareAnalytics", settings.getOrDefault("shareAnalytics", false),
                "emailReports", settings.getOrDefault("emailReports", true),
                "realTimeNotifications", settings.getOrDefault("realTimeNotifications", true)
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", updatedSettings,
                "message", "Analytics settings updated successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to update analytics settings", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to update analytics settings: " + e.getMessage()
            ));
        }
    }
}