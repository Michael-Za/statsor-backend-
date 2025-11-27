package com.captainpro.aiassistant.service;

import com.captainpro.aiassistant.model.ActionRequest;
import com.captainpro.aiassistant.model.ActionResult;
import com.captainpro.aiassistant.model.ActionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Action-Oriented Service
 * 
 * Enables the AI assistant to perform specific tasks including:
 * - Team management actions
 * - Data processing tasks
 * - Report generation
 * - Automated recommendations
 * - System integrations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActionService {

    private final AnalyticsService analyticsService;
    private final InsightsService insightsService;
    private final DataProcessingService dataProcessingService;
    private final NotificationService notificationService;

    /**
     * Execute an action based on the request
     */
    @Transactional
    public ActionResult executeAction(ActionRequest request) {
        log.info("Executing action: {} for user: {}", request.getActionType(), request.getUserId());
        
        try {
            // Track the action execution
            analyticsService.trackUserInteraction(
                request.getUserId(),
                "action_execution",
                request.getActionType().toString(),
                Map.of("parameters", request.getParameters())
            );

            ActionResult result = switch (request.getActionType()) {
                case GENERATE_TEAM_REPORT -> generateTeamReport(request);
                case ANALYZE_PLAYER_PERFORMANCE -> analyzePlayerPerformance(request);
                case CREATE_TRAINING_PLAN -> createTrainingPlan(request);
                case OPTIMIZE_FORMATION -> optimizeFormation(request);
                case SCHEDULE_MATCH_ANALYSIS -> scheduleMatchAnalysis(request);
                case EXPORT_DATA -> exportData(request);
                case SEND_NOTIFICATION -> sendNotification(request);
                case GENERATE_INSIGHTS -> generateInsights(request);
                case UPDATE_PLAYER_STATUS -> updatePlayerStatus(request);
                case CREATE_TACTICAL_BOARD -> createTacticalBoard(request);
                default -> ActionResult.error("Unknown action type: " + request.getActionType());
            };

            // Log successful execution
            if (result.isSuccess()) {
                log.info("Action executed successfully: {} for user: {}", 
                        request.getActionType(), request.getUserId());
            } else {
                log.warn("Action execution failed: {} for user: {} - Error: {}", 
                        request.getActionType(), request.getUserId(), result.getErrorMessage());
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to execute action: {} for user: {}", 
                    request.getActionType(), request.getUserId(), e);
            return ActionResult.error("Action execution failed: " + e.getMessage());
        }
    }

    /**
     * Execute multiple actions asynchronously
     */
    public CompletableFuture<List<ActionResult>> executeActionsAsync(List<ActionRequest> requests) {
        return CompletableFuture.supplyAsync(() -> {
            List<ActionResult> results = new ArrayList<>();
            
            for (ActionRequest request : requests) {
                try {
                    ActionResult result = executeAction(request);
                    results.add(result);
                } catch (Exception e) {
                    results.add(ActionResult.error("Failed to execute action: " + e.getMessage()));
                }
            }
            
            return results;
        });
    }

    /**
     * Get available actions for a user
     */
    public List<ActionType> getAvailableActions(String userId, String userRole) {
        List<ActionType> actions = new ArrayList<>();
        
        // Basic actions available to all users
        actions.addAll(List.of(
            ActionType.GENERATE_TEAM_REPORT,
            ActionType.ANALYZE_PLAYER_PERFORMANCE,
            ActionType.EXPORT_DATA,
            ActionType.GENERATE_INSIGHTS
        ));
        
        // Premium actions
        if ("PREMIUM".equals(userRole) || "COACH".equals(userRole)) {
            actions.addAll(List.of(
                ActionType.CREATE_TRAINING_PLAN,
                ActionType.OPTIMIZE_FORMATION,
                ActionType.SCHEDULE_MATCH_ANALYSIS,
                ActionType.CREATE_TACTICAL_BOARD
            ));
        }
        
        // Admin actions
        if ("ADMIN".equals(userRole)) {
            actions.addAll(List.of(
                ActionType.SEND_NOTIFICATION,
                ActionType.UPDATE_PLAYER_STATUS
            ));
        }
        
        return actions;
    }

    // Action implementations
    
    private ActionResult generateTeamReport(ActionRequest request) {
        try {
            String teamId = (String) request.getParameters().get("teamId");
            String reportType = (String) request.getParameters().getOrDefault("reportType", "comprehensive");
            
            Map<String, Object> reportData = dataProcessingService.generateTeamReport(teamId, reportType);
            
            return ActionResult.success(
                "Team report generated successfully",
                Map.of(
                    "reportId", UUID.randomUUID().toString(),
                    "reportData", reportData,
                    "generatedAt", LocalDateTime.now(),
                    "downloadUrl", "/api/reports/" + teamId + "/latest"
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to generate team report: " + e.getMessage());
        }
    }

    private ActionResult analyzePlayerPerformance(ActionRequest request) {
        try {
            String playerId = (String) request.getParameters().get("playerId");
            String timeRange = (String) request.getParameters().getOrDefault("timeRange", "month");
            
            Map<String, Object> analysis = dataProcessingService.analyzePlayerPerformance(playerId, timeRange);
            
            return ActionResult.success(
                "Player performance analysis completed",
                Map.of(
                    "playerId", playerId,
                    "analysis", analysis,
                    "recommendations", generatePlayerRecommendations(analysis),
                    "analyzedAt", LocalDateTime.now()
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to analyze player performance: " + e.getMessage());
        }
    }

    private ActionResult createTrainingPlan(ActionRequest request) {
        try {
            String teamId = (String) request.getParameters().get("teamId");
            String focusArea = (String) request.getParameters().getOrDefault("focusArea", "general");
            Integer duration = (Integer) request.getParameters().getOrDefault("duration", 4); // weeks
            
            Map<String, Object> trainingPlan = dataProcessingService.createTrainingPlan(teamId, focusArea, duration);
            
            return ActionResult.success(
                "Training plan created successfully",
                Map.of(
                    "planId", UUID.randomUUID().toString(),
                    "trainingPlan", trainingPlan,
                    "createdAt", LocalDateTime.now(),
                    "duration", duration + " weeks"
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to create training plan: " + e.getMessage());
        }
    }

    private ActionResult optimizeFormation(ActionRequest request) {
        try {
            String teamId = (String) request.getParameters().get("teamId");
            String opponentStyle = (String) request.getParameters().getOrDefault("opponentStyle", "balanced");
            
            Map<String, Object> optimization = dataProcessingService.optimizeFormation(teamId, opponentStyle);
            
            return ActionResult.success(
                "Formation optimization completed",
                Map.of(
                    "recommendedFormation", optimization.get("formation"),
                    "reasoning", optimization.get("reasoning"),
                    "playerPositions", optimization.get("positions"),
                    "confidence", optimization.get("confidence"),
                    "optimizedAt", LocalDateTime.now()
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to optimize formation: " + e.getMessage());
        }
    }

    private ActionResult scheduleMatchAnalysis(ActionRequest request) {
        try {
            String matchId = (String) request.getParameters().get("matchId");
            LocalDateTime scheduledTime = LocalDateTime.parse((String) request.getParameters().get("scheduledTime"));
            
            // Schedule the analysis task
            String taskId = dataProcessingService.scheduleMatchAnalysis(matchId, scheduledTime);
            
            return ActionResult.success(
                "Match analysis scheduled successfully",
                Map.of(
                    "taskId", taskId,
                    "matchId", matchId,
                    "scheduledTime", scheduledTime,
                    "status", "scheduled"
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to schedule match analysis: " + e.getMessage());
        }
    }

    private ActionResult exportData(ActionRequest request) {
        try {
            String dataType = (String) request.getParameters().get("dataType");
            String format = (String) request.getParameters().getOrDefault("format", "json");
            String userId = request.getUserId();
            
            String exportUrl = dataProcessingService.exportUserData(userId, dataType, format);
            
            return ActionResult.success(
                "Data export initiated",
                Map.of(
                    "exportId", UUID.randomUUID().toString(),
                    "downloadUrl", exportUrl,
                    "format", format,
                    "expiresAt", LocalDateTime.now().plusHours(24)
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to export data: " + e.getMessage());
        }
    }

    private ActionResult sendNotification(ActionRequest request) {
        try {
            String recipientId = (String) request.getParameters().get("recipientId");
            String message = (String) request.getParameters().get("message");
            String type = (String) request.getParameters().getOrDefault("type", "info");
            
            String notificationId = notificationService.sendNotification(recipientId, message, type);
            
            return ActionResult.success(
                "Notification sent successfully",
                Map.of(
                    "notificationId", notificationId,
                    "recipientId", recipientId,
                    "sentAt", LocalDateTime.now()
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to send notification: " + e.getMessage());
        }
    }

    private ActionResult generateInsights(ActionRequest request) {
        try {
            String userId = request.getUserId();
            String insightType = (String) request.getParameters().getOrDefault("insightType", "comprehensive");
            
            Map<String, Object> insights = insightsService.generateUserInsights(userId, insightType);
            
            return ActionResult.success(
                "Insights generated successfully",
                Map.of(
                    "insights", insights,
                    "generatedAt", LocalDateTime.now(),
                    "insightType", insightType
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to generate insights: " + e.getMessage());
        }
    }

    private ActionResult updatePlayerStatus(ActionRequest request) {
        try {
            String playerId = (String) request.getParameters().get("playerId");
            String status = (String) request.getParameters().get("status");
            String reason = (String) request.getParameters().getOrDefault("reason", "");
            
            dataProcessingService.updatePlayerStatus(playerId, status, reason);
            
            return ActionResult.success(
                "Player status updated successfully",
                Map.of(
                    "playerId", playerId,
                    "newStatus", status,
                    "reason", reason,
                    "updatedAt", LocalDateTime.now()
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to update player status: " + e.getMessage());
        }
    }

    private ActionResult createTacticalBoard(ActionRequest request) {
        try {
            String teamId = (String) request.getParameters().get("teamId");
            String formation = (String) request.getParameters().get("formation");
            Map<String, Object> tactics = (Map<String, Object>) request.getParameters().get("tactics");
            
            Map<String, Object> tacticalBoard = dataProcessingService.createTacticalBoard(teamId, formation, tactics);
            
            return ActionResult.success(
                "Tactical board created successfully",
                Map.of(
                    "boardId", UUID.randomUUID().toString(),
                    "tacticalBoard", tacticalBoard,
                    "createdAt", LocalDateTime.now(),
                    "shareUrl", "/tactical-board/" + teamId + "/latest"
                )
            );
        } catch (Exception e) {
            return ActionResult.error("Failed to create tactical board: " + e.getMessage());
        }
    }

    // Helper methods
    
    private List<String> generatePlayerRecommendations(Map<String, Object> analysis) {
        List<String> recommendations = new ArrayList<>();
        
        // Example recommendation logic
        Double performanceScore = (Double) analysis.get("performanceScore");
        if (performanceScore != null && performanceScore < 7.0) {
            recommendations.add("Focus on improving technical skills through targeted training");
        }
        
        Integer goalsScored = (Integer) analysis.get("goalsScored");
        if (goalsScored != null && goalsScored < 5) {
            recommendations.add("Work on finishing and positioning in the final third");
        }
        
        return recommendations;
    }
}