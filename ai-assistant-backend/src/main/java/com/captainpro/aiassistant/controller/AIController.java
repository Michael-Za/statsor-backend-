package com.captainpro.aiassistant.controller;

import com.captainpro.aiassistant.service.AIService;
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
 * AI Controller
 * 
 * REST API endpoints for AI assistant functionality including:
 * - Chat processing
 * - Insights generation
 * - Personalized recommendations
 * - Team analysis
 * - Training recommendations
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AIController {

    private final AIService aiService;
    private final AnalyticsService analyticsService;

    /**
     * Process chat message with AI
     */
    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> processChat(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String message = (String) request.get("message");
            Map<String, Object> context = (Map<String, Object>) request.getOrDefault("context", Map.of());
            
            log.info("Processing AI chat for user: {}", userId);
            
            Map<String, Object> response = aiService.processChat(userId, message, context);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response
            ));
            
        } catch (Exception e) {
            log.error("Failed to process chat", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to process chat: " + e.getMessage()
            ));
        }
    }

    /**
     * Generate AI-powered insights
     */
    @PostMapping("/insights")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<CompletableFuture<Map<String, Object>>> generateInsights(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String dataType = (String) request.getOrDefault("dataType", "comprehensive");
            
            log.info("Generating AI insights for user: {} - Type: {}", userId, dataType);
            
            CompletableFuture<Map<String, Object>> insights = aiService.generateAIInsights(userId, dataType);
            
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
     * Get personalized recommendations
     */
    @GetMapping("/recommendations")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestParam(defaultValue = "general") String category,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting recommendations for user: {} - Category: {}", userId, category);
            
            List<Map<String, Object>> recommendations = aiService.generatePersonalizedRecommendations(userId, category);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", recommendations,
                "category", category
            ));
            
        } catch (Exception e) {
            log.error("Failed to get recommendations", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get recommendations: " + e.getMessage()
            ));
        }
    }

    /**
     * Analyze team performance
     */
    @PostMapping("/analyze/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> analyzeTeamPerformance(
            @PathVariable String teamId,
            @RequestBody Map<String, Object> performanceData,
            Authentication authentication) {
        
        try {
            log.info("Analyzing team performance for team: {}", teamId);
            
            Map<String, Object> analysis = aiService.analyzeTeamPerformance(teamId, performanceData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", analysis
            ));
            
        } catch (Exception e) {
            log.error("Failed to analyze team performance", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to analyze team performance: " + e.getMessage()
            ));
        }
    }

    /**
     * Generate training recommendations
     */
    @PostMapping("/training/recommendations/{playerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> generateTrainingRecommendations(
            @PathVariable String playerId,
            @RequestBody Map<String, Object> playerData,
            Authentication authentication) {
        
        try {
            log.info("Generating training recommendations for player: {}", playerId);
            
            Map<String, Object> recommendations = aiService.generateTrainingRecommendations(playerId, playerData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", recommendations
            ));
            
        } catch (Exception e) {
            log.error("Failed to generate training recommendations", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to generate training recommendations: " + e.getMessage()
            ));
        }
    }

    /**
     * Get AI assistant status and capabilities
     */
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getAIStatus(Authentication authentication) {
        try {
            String userId = authentication.getName();
            
            // Get user analytics summary
            Map<String, Object> userStats = analyticsService.getUserBehaviorPatterns(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "status", "active",
                    "capabilities", List.of(
                        "chat_processing",
                        "insights_generation",
                        "personalized_recommendations",
                        "team_analysis",
                        "training_recommendations"
                    ),
                    "userStats", userStats,
                    "lastUpdated", System.currentTimeMillis()
                )
            ));
            
        } catch (Exception e) {
            log.error("Failed to get AI status", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get AI status: " + e.getMessage()
            ));
        }
    }

    /**
     * Get conversation history
     */
    @GetMapping("/conversations")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getConversationHistory(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            
            log.info("Getting conversation history for user: {} (limit: {}, offset: {})", userId, limit, offset);
            
            // In a real implementation, this would fetch from database
            List<Map<String, Object>> conversations = List.of(
                Map.of(
                    "id", "conv_1",
                    "message", "How can I improve my performance?",
                    "response", "Based on your recent data, I recommend focusing on endurance training...",
                    "timestamp", System.currentTimeMillis() - 3600000
                ),
                Map.of(
                    "id", "conv_2",
                    "message", "What are my team's strengths?",
                    "response", "Your team excels in defensive coordination and set pieces...",
                    "timestamp", System.currentTimeMillis() - 7200000
                )
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", conversations,
                "pagination", Map.of(
                    "limit", limit,
                    "offset", offset,
                    "total", conversations.size()
                )
            ));
            
        } catch (Exception e) {
            log.error("Failed to get conversation history", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get conversation history: " + e.getMessage()
            ));
        }
    }

    /**
     * Provide feedback on AI response
     */
    @PostMapping("/feedback")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> provideFeedback(
            @RequestBody Map<String, Object> feedback,
            Authentication authentication) {
        
        try {
            String userId = authentication.getName();
            String conversationId = (String) feedback.get("conversationId");
            String rating = (String) feedback.get("rating");
            String comment = (String) feedback.get("comment");
            
            log.info("Received feedback from user: {} for conversation: {} - Rating: {}", 
                    userId, conversationId, rating);
            
            // Track feedback
            analyticsService.trackUserInteraction(userId, "ai_feedback", rating, 
                Map.of(
                    "conversationId", conversationId,
                    "comment", comment != null ? comment : "",
                    "rating", rating
                ));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Feedback received successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to process feedback", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to process feedback: " + e.getMessage()
            ));
        }
    }

    /**
     * Get AI assistant configuration
     */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'COACH')")
    public ResponseEntity<Map<String, Object>> getAIConfig(Authentication authentication) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "maxMessageLength", 1000,
                    "supportedLanguages", List.of("en", "es", "fr", "de"),
                    "features", Map.of(
                        "chatEnabled", true,
                        "insightsEnabled", true,
                        "recommendationsEnabled", true,
                        "teamAnalysisEnabled", true,
                        "trainingRecommendationsEnabled", true
                    ),
                    "rateLimits", Map.of(
                        "messagesPerMinute", 10,
                        "insightsPerHour", 5,
                        "recommendationsPerDay", 20
                    )
                )
            ));
            
        } catch (Exception e) {
            log.error("Failed to get AI config", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get AI config: " + e.getMessage()
            ));
        }
    }
}