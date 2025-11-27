package com.captainpro.aiassistant.controller;

import com.captainpro.aiassistant.service.ActionService;
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
 * Actions Controller
 * 
 * REST API endpoints for action-oriented functionality including:
 * - Task execution
 * - Report generation
 * - Data processing
 * - Team management
 * - Automated recommendations
 */
@RestController
@RequestMapping("/api/v1/actions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ActionsController {

    private final ActionService actionService;
    private final AnalyticsService analyticsService;

    /**
     * Execute a single action
     */
    @PostMapping("/execute")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> executeAction(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String actionType = (String) request.get("actionType");
            Map<String, Object> parameters = (Map<String, Object>) request.getOrDefault("parameters", Map.of());
            
            log.info("Executing action for user: {} - Type: {}", userId, actionType);
            
            // Track action execution
            analyticsService.trackUserInteraction(userId, "action_execute", actionType, parameters);
            
            CompletableFuture<Map<String, Object>> result = actionService.executeAction(userId, actionType, parameters);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to execute action", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to execute action: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Execute multiple actions in batch
     */
    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> executeBatchActions(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            List<Map<String, Object>> actions = (List<Map<String, Object>>) request.get("actions");
            
            log.info("Executing batch actions for user: {} - Count: {}", userId, actions.size());
            
            // Track batch execution
            analyticsService.trackUserInteraction(userId, "batch_execute", "multiple", 
                Map.of("actionCount", actions.size()));
            
            CompletableFuture<Map<String, Object>> result = actionService.executeBatchActions(userId, actions);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to execute batch actions", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to execute batch actions: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get available actions for user
     */
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getAvailableActions(
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            List<String> userRoles = authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .toList();
            
            log.info("Getting available actions for user: {} - Roles: {}", userId, userRoles);
            
            List<Map<String, Object>> actions = actionService.getAvailableActions(userRoles);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", actions,
                "userRoles", userRoles
            ));
            
        } catch (Exception e) {
            log.error("Failed to get available actions", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get available actions: " + e.getMessage()
            ));
        }
    }

    /**
     * Generate team report
     */
    @PostMapping("/reports/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> generateTeamReport(
            @PathVariable String teamId,
            @RequestBody Map<String, Object> reportConfig,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Generating team report for team: {} by user: {}", teamId, userId);
            
            Map<String, Object> parameters = Map.of(
                "teamId", teamId,
                "reportType", reportConfig.getOrDefault("type", "comprehensive"),
                "period", reportConfig.getOrDefault("period", "monthly"),
                "includeAnalytics", reportConfig.getOrDefault("includeAnalytics", true)
            );
            
            CompletableFuture<Map<String, Object>> result = actionService.executeAction(userId, "generate_report", parameters);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to generate team report", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to generate team report: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Analyze player performance
     */
    @PostMapping("/analysis/player/{playerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> analyzePlayerPerformance(
            @PathVariable String playerId,
            @RequestBody Map<String, Object> analysisConfig,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Analyzing player performance for player: {} by user: {}", playerId, userId);
            
            Map<String, Object> parameters = Map.of(
                "playerId", playerId,
                "analysisType", analysisConfig.getOrDefault("type", "comprehensive"),
                "metrics", analysisConfig.getOrDefault("metrics", List.of("speed", "accuracy", "endurance")),
                "period", analysisConfig.getOrDefault("period", "last_30_days")
            );
            
            CompletableFuture<Map<String, Object>> result = actionService.executeAction(userId, "analyze_player_performance", parameters);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to analyze player performance", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to analyze player performance: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Create training plan
     */
    @PostMapping("/training/plan")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> createTrainingPlan(
            @RequestBody Map<String, Object> planConfig,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Creating training plan by user: {}", userId);
            
            Map<String, Object> parameters = Map.of(
                "targetGroup", planConfig.getOrDefault("targetGroup", "team"),
                "duration", planConfig.getOrDefault("duration", "4_weeks"),
                "focus", planConfig.getOrDefault("focus", "general_fitness"),
                "intensity", planConfig.getOrDefault("intensity", "medium"),
                "objectives", planConfig.getOrDefault("objectives", List.of("improve_endurance", "build_strength"))
            );
            
            CompletableFuture<Map<String, Object>> result = actionService.executeAction(userId, "create_training_plan", parameters);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to create training plan", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to create training plan: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Optimize team formation
     */
    @PostMapping("/formation/optimize/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> optimizeFormation(
            @PathVariable String teamId,
            @RequestBody Map<String, Object> optimizationConfig,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Optimizing formation for team: {} by user: {}", teamId, userId);
            
            Map<String, Object> parameters = Map.of(
                "teamId", teamId,
                "strategy", optimizationConfig.getOrDefault("strategy", "balanced"),
                "opponent", optimizationConfig.getOrDefault("opponent", "unknown"),
                "conditions", optimizationConfig.getOrDefault("conditions", Map.of()),
                "priorities", optimizationConfig.getOrDefault("priorities", List.of("defense", "attack"))
            );
            
            CompletableFuture<Map<String, Object>> result = actionService.executeAction(userId, "optimize_formation", parameters);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to optimize formation", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to optimize formation: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Schedule match analysis
     */
    @PostMapping("/analysis/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> scheduleMatchAnalysis(
            @RequestBody Map<String, Object> scheduleConfig,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Scheduling match analysis by user: {}", userId);
            
            Map<String, Object> parameters = Map.of(
                "matchId", scheduleConfig.get("matchId"),
                "analysisType", scheduleConfig.getOrDefault("analysisType", "post_match"),
                "scheduledTime", scheduleConfig.get("scheduledTime"),
                "notifications", scheduleConfig.getOrDefault("notifications", true)
            );
            
            // In a real implementation, this would schedule the analysis
            String analysisId = "analysis_" + System.currentTimeMillis();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "analysisId", analysisId,
                    "status", "scheduled",
                    "scheduledTime", parameters.get("scheduledTime"),
                    "matchId", parameters.get("matchId")
                ),
                "message", "Match analysis scheduled successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to schedule match analysis", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to schedule match analysis: " + e.getMessage()
            ));
        }
    }

    /**
     * Export data
     */
    @PostMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> exportData(
            @RequestBody Map<String, Object> exportConfig,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Exporting data by user: {}", userId);
            
            Map<String, Object> parameters = Map.of(
                "dataType", exportConfig.getOrDefault("dataType", "all"),
                "format", exportConfig.getOrDefault("format", "json"),
                "period", exportConfig.getOrDefault("period", "last_30_days"),
                "includeAnalytics", exportConfig.getOrDefault("includeAnalytics", true)
            );
            
            CompletableFuture<Map<String, Object>> result = actionService.executeAction(userId, "export_data", parameters);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to export data", e);
            return ResponseEntity.badRequest().body(
                CompletableFuture.completedFuture(Map.of(
                    "success", false,
                    "error", "Failed to export data: " + e.getMessage()
                ))
            );
        }
    }

    /**
     * Get action execution history
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getActionHistory(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) String actionType,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting action history for user: {} (limit: {}, offset: {}, type: {})", 
                    userId, limit, offset, actionType);
            
            // In a real implementation, this would fetch from database
            List<Map<String, Object>> history = List.of(
                Map.of(
                    "id", "action_1",
                    "type", "generate_report",
                    "status", "completed",
                    "executedAt", System.currentTimeMillis() - 3600000,
                    "duration", 2.5,
                    "result", "Report generated successfully"
                ),
                Map.of(
                    "id", "action_2",
                    "type", "analyze_player_performance",
                    "status", "completed",
                    "executedAt", System.currentTimeMillis() - 7200000,
                    "duration", 1.8,
                    "result", "Analysis completed"
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", history,
                "pagination", Map.of(
                    "limit", limit,
                    "offset", offset,
                    "total", history.size()
                )
            ));
            
        } catch (Exception e) {
            log.error("Failed to get action history", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get action history: " + e.getMessage()
            ));
        }
    }

    /**
     * Cancel running action
     */
    @PostMapping("/cancel/{actionId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> cancelAction(
            @PathVariable String actionId,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Cancelling action: {} by user: {}", actionId, userId);
            
            // In a real implementation, this would cancel the running action
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Action cancelled successfully",
                "actionId", actionId
            ));
            
        } catch (Exception e) {
            log.error("Failed to cancel action", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to cancel action: " + e.getMessage()
            ));
        }
    }
}