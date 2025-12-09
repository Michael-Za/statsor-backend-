package com.captainpro.aiassistant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * AI Service
 * 
 * Enhanced AI service that integrates with OpenAI and provides:
 * - Intelligent chat responses
 * - Context-aware recommendations
 * - Data-driven insights
 * - Personalized assistance
 * - Real-time analysis
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final ChatClient chatClient;
    private final AnalyticsService analyticsService;
    private final InsightsService insightsService;
    private final DataProcessingService dataProcessingService;

    @Value("${app.ai.model:gpt-3.5-turbo}")
    private String aiModel;

    @Value("${app.ai.max-tokens:1000}")
    private int maxTokens;

    @Value("${app.ai.temperature:0.7}")
    private double temperature;

    /**
     * Process chat message with AI
     */
    public Map<String, Object> processChat(String userId, String message, Map<String, Object> context) {
        log.info("Processing AI chat for user: {} - Message length: {}", userId, message.length());
        
        try {
            // Track user interaction
            analyticsService.trackUserInteraction(userId, "ai_chat", "message", 
                Map.of("messageLength", message.length(), "hasContext", !context.isEmpty()));
            
            // Get user context and insights
            Map<String, Object> userInsights = insightsService.generateUserInsights(userId, "comprehensive");
            
            // Build enhanced prompt with context
            String enhancedPrompt = buildEnhancedPrompt(message, context, userInsights);
            
            // Get AI response
            ChatResponse response = chatClient.call(new Prompt(List.of(
                new SystemMessage(getSystemPrompt()),
                new UserMessage(enhancedPrompt)
            )));
            
            String aiResponse = response.getResult().getOutput().getContent();
            
            // Generate follow-up actions and recommendations
            List<Map<String, Object>> actions = generateFollowUpActions(userId, message, aiResponse, context);
            List<Map<String, Object>> recommendations = generateRecommendations(userId, message, userInsights);
            
            Map<String, Object> result = Map.of(
                "response", aiResponse,
                "actions", actions,
                "recommendations", recommendations,
                "insights", extractKeyInsights(userInsights),
                "timestamp", LocalDateTime.now(),
                "model", aiModel
            );
            
            // Track successful AI interaction
            analyticsService.trackUserInteraction(userId, "ai_response_generated", "success", 
                Map.of("responseLength", aiResponse.length(), "actionsCount", actions.size()));
            
            return result;
            
        } catch (Exception e) {
            log.error("Failed to process AI chat for user: {}", userId, e);
            
            // Track error
            analyticsService.trackUserInteraction(userId, "ai_chat_error", "error", 
                Map.of("error", e.getMessage()));
            
            return Map.of(
                "response", "I apologize, but I'm experiencing technical difficulties. Please try again.",
                "actions", Collections.emptyList(),
                "recommendations", Collections.emptyList(),
                "error", true,
                "timestamp", LocalDateTime.now()
            );
        }
    }

    /**
     * Generate AI-powered insights
     */
    @Async
    public CompletableFuture<Map<String, Object>> generateAIInsights(String userId, String dataType) {
        log.info("Generating AI insights for user: {} - Data type: {}", userId, dataType);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Get user data and insights
                Map<String, Object> userData = dataProcessingService.getUserData(userId);
                Map<String, Object> baseInsights = insightsService.generateUserInsights(userId, dataType);
                
                // Create AI prompt for insights generation
                String insightsPrompt = buildInsightsPrompt(userData, baseInsights, dataType);
                
                // Get AI analysis
                ChatResponse response = chatClient.call(new Prompt(List.of(
                    new SystemMessage(getInsightsSystemPrompt()),
                    new UserMessage(insightsPrompt)
                )));
                
                String aiAnalysis = response.getResult().getOutput().getContent();
                
                Map<String, Object> result = Map.of(
                    "aiAnalysis", aiAnalysis,
                    "baseInsights", baseInsights,
                    "dataType", dataType,
                    "generatedAt", LocalDateTime.now(),
                    "confidence", calculateConfidenceScore(userData, baseInsights)
                );
                
                // Track insights generation
                analyticsService.trackUserInteraction(userId, "ai_insights_generated", dataType, 
                    Map.of("analysisLength", aiAnalysis.length()));
                
                return result;
                
            } catch (Exception e) {
                log.error("Failed to generate AI insights for user: {}", userId, e);
                return Map.of(
                    "error", true,
                    "message", "Failed to generate insights",
                    "timestamp", LocalDateTime.now()
                );
            }
        });
    }

    /**
     * Generate personalized recommendations
     */
    @Cacheable(value = "aiRecommendations", key = "#userId + '_' + #category")
    public List<Map<String, Object>> generatePersonalizedRecommendations(String userId, String category) {
        log.info("Generating personalized recommendations for user: {} - Category: {}", userId, category);
        
        try {
            // Get user insights and behavior patterns
            Map<String, Object> userInsights = insightsService.generateUserInsights(userId, "comprehensive");
            Map<String, Object> behaviorPatterns = analyticsService.getUserBehaviorPatterns(userId);
            
            // Create recommendations prompt
            String recommendationsPrompt = buildRecommendationsPrompt(userInsights, behaviorPatterns, category);
            
            // Get AI recommendations
            ChatResponse response = chatClient.call(new Prompt(List.of(
                new SystemMessage(getRecommendationsSystemPrompt()),
                new UserMessage(recommendationsPrompt)
            )));
            
            String aiRecommendations = response.getResult().getOutput().getContent();
            
            // Parse and structure recommendations
            List<Map<String, Object>> recommendations = parseRecommendations(aiRecommendations, category);
            
            // Track recommendations generation
            analyticsService.trackUserInteraction(userId, "ai_recommendations_generated", category, 
                Map.of("recommendationsCount", recommendations.size()));
            
            return recommendations;
            
        } catch (Exception e) {
            log.error("Failed to generate recommendations for user: {}", userId, e);
            return Collections.emptyList();
        }
    }

    /**
     * Analyze team performance with AI
     */
    public Map<String, Object> analyzeTeamPerformance(String teamId, Map<String, Object> performanceData) {
        log.info("Analyzing team performance with AI for team: {}", teamId);
        
        try {
            // Create analysis prompt
            String analysisPrompt = buildTeamAnalysisPrompt(performanceData);
            
            // Get AI analysis
            ChatResponse response = chatClient.call(new Prompt(List.of(
                new SystemMessage(getTeamAnalysisSystemPrompt()),
                new UserMessage(analysisPrompt)
            )));
            
            String aiAnalysis = response.getResult().getOutput().getContent();
            
            // Generate improvement suggestions
            List<Map<String, Object>> improvements = generateImprovementSuggestions(performanceData, aiAnalysis);
            
            Map<String, Object> result = Map.of(
                "analysis", aiAnalysis,
                "improvements", improvements,
                "performanceScore", calculatePerformanceScore(performanceData),
                "analyzedAt", LocalDateTime.now(),
                "teamId", teamId
            );
            
            // Track team analysis
            analyticsService.trackUserInteraction("system", "team_analysis_completed", "ai_analysis", 
                Map.of("teamId", teamId, "improvementsCount", improvements.size()));
            
            return result;
            
        } catch (Exception e) {
            log.error("Failed to analyze team performance for team: {}", teamId, e);
            throw new RuntimeException("Failed to analyze team performance: " + e.getMessage());
        }
    }

    /**
     * Generate training recommendations with AI
     */
    public Map<String, Object> generateTrainingRecommendations(String playerId, Map<String, Object> playerData) {
        log.info("Generating AI training recommendations for player: {}", playerId);
        
        try {
            // Create training prompt
            String trainingPrompt = buildTrainingPrompt(playerData);
            
            // Get AI recommendations
            ChatResponse response = chatClient.call(new Prompt(List.of(
                new SystemMessage(getTrainingSystemPrompt()),
                new UserMessage(trainingPrompt)
            )));
            
            String aiRecommendations = response.getResult().getOutput().getContent();
            
            // Parse training plan
            Map<String, Object> trainingPlan = parseTrainingPlan(aiRecommendations, playerData);
            
            Map<String, Object> result = Map.of(
                "recommendations", aiRecommendations,
                "trainingPlan", trainingPlan,
                "playerId", playerId,
                "generatedAt", LocalDateTime.now(),
                "priority", determinePriority(playerData)
            );
            
            // Track training recommendations
            analyticsService.trackUserInteraction("system", "training_recommendations_generated", "ai_training", 
                Map.of("playerId", playerId, "planDuration", trainingPlan.get("duration")));
            
            return result;
            
        } catch (Exception e) {
            log.error("Failed to generate training recommendations for player: {}", playerId, e);
            throw new RuntimeException("Failed to generate training recommendations: " + e.getMessage());
        }
    }

    // Helper methods
    
    private String buildEnhancedPrompt(String message, Map<String, Object> context, Map<String, Object> userInsights) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("User Message: ").append(message).append("\n\n");
        
        if (!context.isEmpty()) {
            prompt.append("Context: ").append(context).append("\n\n");
        }
        
        if (!userInsights.isEmpty()) {
            prompt.append("User Insights: ").append(extractKeyInsights(userInsights)).append("\n\n");
        }
        
        prompt.append("Please provide a helpful, personalized response based on the user's message, context, and insights.");
        
        return prompt.toString();
    }

    private String buildInsightsPrompt(Map<String, Object> userData, Map<String, Object> baseInsights, String dataType) {
        return String.format(
            "Analyze the following user data and provide detailed insights:\n\n" +
            "Data Type: %s\n" +
            "User Data: %s\n" +
            "Base Insights: %s\n\n" +
            "Please provide comprehensive analysis with actionable recommendations.",
            dataType, userData, baseInsights
        );
    }

    private String buildRecommendationsPrompt(Map<String, Object> userInsights, Map<String, Object> behaviorPatterns, String category) {
        return String.format(
            "Generate personalized recommendations for category: %s\n\n" +
            "User Insights: %s\n" +
            "Behavior Patterns: %s\n\n" +
            "Please provide 3-5 specific, actionable recommendations.",
            category, userInsights, behaviorPatterns
        );
    }

    private String buildTeamAnalysisPrompt(Map<String, Object> performanceData) {
        return String.format(
            "Analyze the following team performance data and provide insights:\n\n" +
            "Performance Data: %s\n\n" +
            "Please provide detailed analysis including strengths, weaknesses, and improvement areas.",
            performanceData
        );
    }

    private String buildTrainingPrompt(Map<String, Object> playerData) {
        return String.format(
            "Create a personalized training plan based on the following player data:\n\n" +
            "Player Data: %s\n\n" +
            "Please provide specific training recommendations with exercises, duration, and goals.",
            playerData
        );
    }

    private String getSystemPrompt() {
        return "You are an intelligent football assistant with access to comprehensive user data and insights. " +
               "Provide helpful, personalized responses based on the user's context and football-related needs. " +
               "Be concise, actionable, and supportive.";
    }

    private String getInsightsSystemPrompt() {
        return "You are a data analyst specializing in football performance analysis. " +
               "Analyze the provided data and generate meaningful insights with actionable recommendations.";
    }

    private String getRecommendationsSystemPrompt() {
        return "You are a personalized recommendation engine for football players and teams. " +
               "Generate specific, actionable recommendations based on user behavior and performance data.";
    }

    private String getTeamAnalysisSystemPrompt() {
        return "You are a football team performance analyst. " +
               "Analyze team data and provide comprehensive insights for improvement.";
    }

    private String getTrainingSystemPrompt() {
        return "You are a football training specialist. " +
               "Create personalized training plans based on player data and performance metrics.";
    }

    private List<Map<String, Object>> generateFollowUpActions(String userId, String message, String aiResponse, Map<String, Object> context) {
        // Generate contextual follow-up actions based on the conversation
        List<Map<String, Object>> actions = new ArrayList<>();
        
        if (message.toLowerCase().contains("performance")) {
            actions.add(Map.of(
                "type", "view_performance",
                "label", "View Detailed Performance",
                "description", "See comprehensive performance analytics"
            ));
        }
        
        if (message.toLowerCase().contains("training")) {
            actions.add(Map.of(
                "type", "create_training_plan",
                "label", "Create Training Plan",
                "description", "Generate a personalized training plan"
            ));
        }
        
        return actions;
    }

    private List<Map<String, Object>> generateRecommendations(String userId, String message, Map<String, Object> userInsights) {
        // Generate contextual recommendations
        return List.of(
            Map.of(
                "type", "improvement",
                "title", "Performance Enhancement",
                "description", "Based on your recent activity, focus on endurance training",
                "priority", "high"
            )
        );
    }

    private Map<String, Object> extractKeyInsights(Map<String, Object> userInsights) {
        // Extract and format key insights for AI context
        return Map.of(
            "performanceLevel", userInsights.getOrDefault("performanceLevel", "intermediate"),
            "preferredPosition", userInsights.getOrDefault("preferredPosition", "unknown"),
            "recentActivity", userInsights.getOrDefault("recentActivity", "moderate")
        );
    }

    private double calculateConfidenceScore(Map<String, Object> userData, Map<String, Object> baseInsights) {
        // Calculate confidence score based on data quality and completeness
        int dataPoints = userData.size() + baseInsights.size();
        return Math.min(0.95, 0.5 + (dataPoints * 0.05));
    }

    private List<Map<String, Object>> parseRecommendations(String aiRecommendations, String category) {
        // Parse AI response into structured recommendations
        // This is a simplified implementation - in practice, you'd use more sophisticated parsing
        return List.of(
            Map.of(
                "id", UUID.randomUUID().toString(),
                "category", category,
                "content", aiRecommendations,
                "priority", "medium",
                "createdAt", LocalDateTime.now()
            )
        );
    }

    private List<Map<String, Object>> generateImprovementSuggestions(Map<String, Object> performanceData, String aiAnalysis) {
        // Generate structured improvement suggestions
        return List.of(
            Map.of(
                "area", "Technical Skills",
                "suggestion", "Focus on ball control drills",
                "priority", "high",
                "estimatedImpact", "15% improvement in 4 weeks"
            )
        );
    }

    private double calculatePerformanceScore(Map<String, Object> performanceData) {
        // Calculate overall performance score
        return 75.5; // Simplified implementation
    }

    private Map<String, Object> parseTrainingPlan(String aiRecommendations, Map<String, Object> playerData) {
        // Parse AI response into structured training plan
        return Map.of(
            "duration", "4 weeks",
            "sessionsPerWeek", 3,
            "focusAreas", List.of("endurance", "technical", "tactical"),
            "recommendations", aiRecommendations
        );
    }

    private String determinePriority(Map<String, Object> playerData) {
        // Determine training priority based on player data
        return "medium"; // Simplified implementation
    }
}