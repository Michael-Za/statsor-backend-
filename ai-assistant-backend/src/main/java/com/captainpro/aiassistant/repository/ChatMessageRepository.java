package com.captainpro.aiassistant.repository;

import com.captainpro.aiassistant.entity.ChatMessage;
import com.captainpro.aiassistant.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Chat Message Repository Interface
 * 
 * Provides data access operations for ChatMessage entities
 * supporting conversation management and AI chat analytics.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Basic queries
    List<ChatMessage> findByUser(User user);
    List<ChatMessage> findByUserId(Long userId);
    List<ChatMessage> findByConversationId(String conversationId);
    
    // Role and type queries
    List<ChatMessage> findByRole(ChatMessage.MessageRole role);
    List<ChatMessage> findByType(ChatMessage.MessageType type);
    List<ChatMessage> findByStatus(ChatMessage.MessageStatus status);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.user = :user AND cm.role = :role")
    List<ChatMessage> findByUserAndRole(@Param("user") User user, 
                                       @Param("role") ChatMessage.MessageRole role);
    
    // Conversation queries
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.conversationId = :conversationId " +
           "ORDER BY cm.timestamp ASC")
    List<ChatMessage> findConversationMessages(@Param("conversationId") String conversationId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.user = :user " +
           "ORDER BY cm.timestamp DESC")
    Page<ChatMessage> findUserMessages(@Param("user") User user, Pageable pageable);
    
    // Time-based queries
    List<ChatMessage> findByTimestampAfter(LocalDateTime timestamp);
    List<ChatMessage> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    // Analytics queries
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.user = :user")
    Long countByUser(@Param("user") User user);
    
    @Query("SELECT cm.role, COUNT(cm) FROM ChatMessage cm GROUP BY cm.role")
    List<Object[]> getMessageRoleStatistics();
    
    @Query("SELECT cm.type, COUNT(cm) FROM ChatMessage cm GROUP BY cm.type")
    List<Object[]> getMessageTypeStatistics();
    
    // Recent conversations
    @Query("SELECT DISTINCT cm.conversationId FROM ChatMessage cm WHERE cm.user = :user " +
           "ORDER BY MAX(cm.timestamp) DESC")
    Page<String> findRecentConversations(@Param("user") User user, Pageable pageable);
    
    // Search functionality
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "LOWER(cm.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<ChatMessage> searchMessages(@Param("searchTerm") String searchTerm, Pageable pageable);
}