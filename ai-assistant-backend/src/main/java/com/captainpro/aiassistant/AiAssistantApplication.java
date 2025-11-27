package com.captainpro.aiassistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Enhanced AI Assistant Backend Application
 * 
 * This Spring Boot application provides:
 * - Comprehensive analytics functionality
 * - Action-oriented features for task execution
 * - Data insights generation
 * - Advanced data processing capabilities
 * - Real-time decision making
 * - Personalized recommendations
 * - Secure data access and privacy measures
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableTransactionManagement
public class AiAssistantApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiAssistantApplication.class, args);
    }

}