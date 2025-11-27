package com.captainpro.aiassistant.controller;

import com.captainpro.aiassistant.service.InsightsService;
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
 * Insights Controller
 * 
 * REST API endpoints for data insights generation including:
 * - Performance insights
 * - Predictive analytics
 * - Personalized recommendations
 * - Comparative analysis
 * - Trend analysis
 */
@RestController
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class InsightsController {

    private final InsightsService insightsService;
    private final AnalyticsService analyticsService;

    /**
     * Generate comprehensive user insights
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> generateInsights(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String insightType = (String) request.getOrDefault("type", "comprehensive");
            Map<String, Object> parameters = (Map<String, Object>) request.getOrDefault("parameters", Map.of());
            
            log.info("Generating insights for user: {} - Type: {}", userId, insightType);
            
            // Track insight generation
            analyticsService.trackUserInteraction(userId, "generate_insights", insightType, parameters);
            
            CompletableFuture<Map<String, Object>> insights = insightsService.generateUserInsights(userId, insightType, parameters);
            
            return ResponseEntity.ok(insights);
            
        } catch (Exception e) {
            log.error("Failed to generate insights", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to generate insights: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get performance insights
     */
    @GetMapping("/performance")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getPerformanceInsights(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "individual") String scope,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting performance insights for user: {} - Days: {} - Scope: {}", userId, days, scope);
            
            Map<String, Object> insights = Map.of(
                "overview", Map.of(
                    "overallScore", 78.5,
                    "trend", "improving",
                    "trendPercentage", 12.3,
                    "rank", 15,
                    "totalParticipants", 120
                ),
                "keyMetrics", List.of(
                    Map.of(
                        "name", "Speed",
                        "value", 85.2,
                        "change", "+5.3%",
                        "status", "excellent"
                    ),
                    Map.of(
                        "name", "Accuracy",
                        "value", 72.8,
                        "change", "+2.1%",
                        "status", "good"
                    ),
                    Map.of(
                        "name", "Endurance",
                        "value", 68.4,
                        "change", "-1.2%",
                        "status", "needs_improvement"
                    )
                ),
                "strengths", List.of(
                    "Exceptional speed and agility",
                    "Consistent performance under pressure",
                    "Strong tactical awareness"
                ),
                "improvements", List.of(
                    "Focus on endurance training",
                    "Work on accuracy in high-pressure situations",
                    "Develop better recovery techniques"
                ),
                "predictions", Map.of(
                    "nextWeekScore", 81.2,
                    "confidence", 0.87,
                    "factors", List.of("training_intensity", "rest_quality", "nutrition")
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", insights,
                "period", days + " days",
                "scope", scope
            ));
            
        } catch (Exception e) {
            log.error("Failed to get performance insights", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get performance insights: " + e.getMessage()
            ));
        }
    }

    /**
     * Get team insights
     */
    @GetMapping("/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getTeamInsights(
            @PathVariable String teamId,
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        
        try {
            log.info("Getting team insights for team: {} - Days: {}", teamId, days);
            
            Map<String, Object> insights = Map.of(
                "teamOverview", Map.of(
                    "teamScore", 82.3,
                    "cohesionIndex", 0.78,
                    "performanceTrend", "stable",
                    "totalPlayers", 25,
                    "activePlayers", 22
                ),
                "topPerformers", List.of(
                    Map.of("playerId", "player_1", "name", "John Doe", "score", 92.1),
                    Map.of("playerId", "player_2", "name", "Jane Smith", "score", 89.7),
                    Map.of("playerId", "player_3", "name", "Mike Johnson", "score", 87.3)
                ),
                "areasOfConcern", List.of(
                    Map.of(
                        "area", "Defense",
                        "score", 65.2,
                        "trend", "declining",
                        "recommendation", "Increase defensive drills and coordination exercises"
                    ),
                    Map.of(
                        "area", "Fitness",
                        "score", 71.8,
                        "trend", "stable",
                        "recommendation", "Implement more cardio and strength training"
                    )
                ),
                "formations", Map.of(
                    "mostEffective", "4-3-3",
                    "effectiveness", 0.84,
                    "alternatives", List.of(
                        Map.of("formation", "4-4-2", "effectiveness", 0.79),
                        Map.of("formation", "3-5-2", "effectiveness", 0.76)
                    )
                ),
                "recommendations", List.of(
                    "Focus on defensive coordination in next training sessions",
                    "Consider rotating key players to prevent fatigue",
                    "Implement specialized fitness program for underperforming players"
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", insights,
                "teamId", teamId,
                "period", days + " days"
            ));
            
        } catch (Exception e) {
            log.error("Failed to get team insights", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get team insights: " + e.getMessage()
            ));
        }
    }

    /**
     * Get predictive insights
     */
    @PostMapping("/predictive")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> getPredictiveInsights(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String predictionType = (String) request.getOrDefault("type", "performance");
            int horizon = (Integer) request.getOrDefault("horizon", 30);
            Map<String, Object> context = (Map<String, Object>) request.getOrDefault("context", Map.of());
            
            log.info("Getting predictive insights for user: {} - Type: {} - Horizon: {} days", 
                    userId, predictionType, horizon);
            
            CompletableFuture<Map<String, Object>> predictions = CompletableFuture.supplyAsync(() -> {
                // Simulate prediction generation
                try {
                    Thread.sleep(2000); // Simulate processing time
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                
                return Map.of(
                    "success", true,
                    "data", Map.of(
                        "predictions", List.of(
                            Map.of(
                                "metric", "Performance Score",
                                "currentValue", 78.5,
                                "predictedValue", 82.3,
                                "confidence", 0.85,
                                "factors", List.of("training_consistency", "rest_quality", "nutrition")
                            ),
                            Map.of(
                                "metric", "Injury Risk",
                                "currentValue", 0.15,
                                "predictedValue", 0.12,
                                "confidence", 0.78,
                                "factors", List.of("workload", "recovery_time", "previous_injuries")
                            )
                        ),
                        "recommendations", List.of(
                            "Maintain current training intensity to achieve predicted improvements",
                            "Focus on recovery techniques to reduce injury risk",
                            "Consider adjusting nutrition plan for optimal performance"
                        ),
                        "confidence", 0.82,
                        "horizon", horizon + " days"
                    ),
                    "type", predictionType,
                    "generatedAt", System.currentTimeMillis()
                );
            });
            
            return ResponseEntity.ok(predictions);
            
        } catch (Exception e) {
            log.error("Failed to get predictive insights", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to get predictive insights: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get comparative insights
     */
    @PostMapping("/comparative")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getComparativeInsights(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String compareWith = (String) request.getOrDefault("compareWith", "peers");
            List<String> metrics = (List<String>) request.getOrDefault("metrics", List.of("performance", "consistency"));
            
            log.info("Getting comparative insights for user: {} - Compare with: {} - Metrics: {}", 
                    userId, compareWith, metrics);
            
            Map<String, Object> insights = Map.of(
                "comparison", Map.of(
                    "baseline", compareWith,
                    "userRank", 15,
                    "totalParticipants", 120,
                    "percentile", 87.5
                ),
                "metrics", List.of(
                    Map.of(
                        "name", "Performance",
                        "userValue", 78.5,
                        "averageValue", 72.3,
                        "difference", "+6.2",
                        "status", "above_average"
                    ),
                    Map.of(
                        "name", "Consistency",
                        "userValue", 0.82,
                        "averageValue", 0.75,
                        "difference", "+0.07",
                        "status", "above_average"
                    ),
                    Map.of(
                        "name", "Improvement Rate",
                        "userValue", 12.3,
                        "averageValue", 8.7,
                        "difference", "+3.6",
                        "status", "excellent"
                    )
                ),
                "strengths", List.of(
                    "Performance significantly above peer average",
                    "Excellent improvement trajectory",
                    "High consistency in performance"
                ),
                "opportunities", List.of(
                    "Focus on areas where top performers excel",
                    "Learn from best practices of top 10% performers",
                    "Consider advanced training techniques"
                ),
                "benchmarks", Map.of(
                    "topPerformer", Map.of("score", 95.2, "gap", 16.7),
                    "teamAverage", Map.of("score", 74.1, "gap", -4.4),
                    "industryStandard", Map.of("score", 80.0, "gap", 1.5)
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", insights,
                "compareWith", compareWith,
                "metrics", metrics
            ));
            
        } catch (Exception e) {
            log.error("Failed to get comparative insights", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get comparative insights: " + e.getMessage()
            ));
        }
    }

    /**
     * Get trend analysis
     */
    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getTrendAnalysis(
            @RequestParam(defaultValue = "90") int days,
            @RequestParam(defaultValue = "performance") String metric,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting trend analysis for user: {} - Metric: {} - Days: {}", userId, metric, days);
            
            Map<String, Object> trends = Map.of(
                "overview", Map.of(
                    "metric", metric,
                    "period", days + " days",
                    "overallTrend", "improving",
                    "trendStrength", 0.73,
                    "volatility", 0.15
                ),
                "dataPoints", List.of(
                    Map.of("date", "2024-01-01", "value", 72.1),
                    Map.of("date", "2024-01-08", "value", 74.3),
                    Map.of("date", "2024-01-15", "value", 76.8),
                    Map.of("date", "2024-01-22", "value", 78.5)
                ),
                "patterns", List.of(
                    Map.of(
                        "type", "weekly_cycle",
                        "description", "Performance typically peaks mid-week",
                        "strength", 0.68
                    ),
                    Map.of(
                        "type", "improvement_trend",
                        "description", "Consistent upward trajectory over the period",
                        "strength", 0.85
                    )
                ),
                "forecasts", Map.of(
                    "nextWeek", 80.2,
                    "nextMonth", 83.7,
                    "confidence", 0.79
                ),
                "insights", List.of(
                    "Strong positive trend indicates effective training program",
                    "Weekly performance cycles suggest optimal training schedule",
                    "Low volatility indicates consistent improvement"
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", trends,
                "metric", metric,
                "period", days + " days"
            ));
            
        } catch (Exception e) {
            log.error("Failed to get trend analysis", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get trend analysis: " + e.getMessage()
            ));
        }
    }

    /**
     * Get insight recommendations
     */
    @GetMapping("/recommendations")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getInsightRecommendations(
            @RequestParam(defaultValue = "general") String category,
            @RequestParam(defaultValue = "5") int limit,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting insight recommendations for user: {} - Category: {} - Limit: {}", 
                    userId, category, limit);
            
            List<Map<String, Object>> recommendations = List.of(
                Map.of(
                    "id", "rec_1",
                    "title", "Optimize Training Schedule",
                    "description", "Based on your performance patterns, consider shifting intense training to mid-week",
                    "category", "training",
                    "priority", "high",
                    "impact", "15% performance improvement",
                    "effort", "medium",
                    "timeline", "2-3 weeks"
                ),
                Map.of(
                    "id", "rec_2",
                    "title", "Focus on Recovery",
                    "description", "Your recovery metrics suggest implementing better rest protocols",
                    "category", "recovery",
                    "priority", "medium",
                    "impact", "Reduced injury risk by 20%",
                    "effort", "low",
                    "timeline", "1 week"
                ),
                Map.of(
                    "id", "rec_3",
                    "title", "Nutrition Optimization",
                    "description", "Adjust pre-training nutrition for better energy levels",
                    "category", "nutrition",
                    "priority", "medium",
                    "impact", "10% energy improvement",
                    "effort", "low",
                    "timeline", "immediate"
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", recommendations.stream().limit(limit).toList(),
                "category", category,
                "total", recommendations.size()
            ));
            
        } catch (Exception e) {
            log.error("Failed to get insight recommendations", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get insight recommendations: " + e.getMessage()
            ));
        }
    }

    /**
     * Save insight for later reference
     */
    @PostMapping("/save")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> saveInsight(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String insightId = (String) request.get("insightId");
            String title = (String) request.get("title");
            String notes = (String) request.getOrDefault("notes", "");
            
            log.info("Saving insight for user: {} - Insight ID: {}", userId, insightId);
            
            // In a real implementation, this would save to database
            String savedInsightId = "saved_" + System.currentTimeMillis();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "savedInsightId", savedInsightId,
                    "originalInsightId", insightId,
                    "title", title,
                    "notes", notes,
                    "savedAt", System.currentTimeMillis()
                ),
                "message", "Insight saved successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to save insight", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to save insight: " + e.getMessage()
            ));
        }
    }

    /**
     * Get saved insights
     */
    @GetMapping("/saved")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getSavedInsights(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting saved insights for user: {} (limit: {}, offset: {})", userId, limit, offset);
            
            // In a real implementation, this would fetch from database
            List<Map<String, Object>> savedInsights = List.of(
                Map.of(
                    "id", "saved_1",
                    "title", "Performance Optimization Strategy",
                    "type", "performance",
                    "notes", "Focus on mid-week training intensity",
                    "savedAt", System.currentTimeMillis() - 86400000
                ),
                Map.of(
                    "id", "saved_2",
                    "title", "Team Formation Analysis",
                    "type", "team",
                    "notes", "4-3-3 formation shows best results",
                    "savedAt", System.currentTimeMillis() - 172800000
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", savedInsights,
                "pagination", Map.of(
                    "limit", limit,
                    "offset", offset,
                    "total", savedInsights.size()
                )
            ));
            
        } catch (Exception e) {
            log.error("Failed to get saved insights", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get saved insights: " + e.getMessage()
            ));
        }
    }
}