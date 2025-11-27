package com.aiassistant.service;

import com.aiassistant.entity.Notification;
import com.aiassistant.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class for managing notifications and notification delivery.
 * Provides comprehensive notification functionality including creation,
 * delivery, tracking, and analytics.
 */
@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // ==================== Notification Creation Methods ====================

    /**
     * Create a new notification
     */
    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        if (notification.getStatus() == null) {
            notification.setStatus(Notification.Status.PENDING);
        }
        return notificationRepository.save(notification);
    }

    /**
     * Create a simple notification
     */
    public Notification createSimpleNotification(Long userId, String title, String message, 
                                                Notification.NotificationType type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setPriority(Notification.Priority.MEDIUM);
        notification.setStatus(Notification.Status.PENDING);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }

    /**
     * Create a scheduled notification
     */
    public Notification createScheduledNotification(Long userId, String title, String message,
                                                   Notification.NotificationType type,
                                                   LocalDateTime scheduledAt) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setPriority(Notification.Priority.MEDIUM);
        notification.setStatus(Notification.Status.SCHEDULED);
        notification.setScheduledAt(scheduledAt);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }

    /**
     * Create bulk notifications
     */
    public List<Notification> createBulkNotifications(List<Long> userIds, String title, 
                                                     String message, Notification.NotificationType type) {
        String batchId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        
        List<Notification> notifications = userIds.stream()
            .map(userId -> {
                Notification notification = new Notification();
                notification.setUserId(userId);
                notification.setTitle(title);
                notification.setMessage(message);
                notification.setType(type);
                notification.setPriority(Notification.Priority.MEDIUM);
                notification.setStatus(Notification.Status.PENDING);
                notification.setBatchId(batchId);
                notification.setCreatedAt(now);
                notification.setUpdatedAt(now);
                return notification;
            })
            .toList();
        
        return notificationRepository.saveAll(notifications);
    }

    // ==================== Notification Delivery Methods ====================

    /**
     * Send notification (mark as sent)
     */
    public void sendNotification(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setStatus(Notification.Status.SENT);
            notification.setSentAt(LocalDateTime.now());
            notification.setDeliveryAttempts(notification.getDeliveryAttempts() + 1);
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    /**
     * Mark notification as delivered
     */
    public void markAsDelivered(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setStatus(Notification.Status.DELIVERED);
            notification.setDeliveredAt(LocalDateTime.now());
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    /**
     * Mark notification as read
     */
    public void markAsRead(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    /**
     * Mark notification as clicked
     */
    public void markAsClicked(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setClicked(true);
            notification.setClickedAt(LocalDateTime.now());
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    /**
     * Mark notification as failed
     */
    public void markAsFailed(Long notificationId, String errorMessage) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setStatus(Notification.Status.FAILED);
            notification.setErrorMessage(errorMessage);
            notification.setDeliveryAttempts(notification.getDeliveryAttempts() + 1);
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    // ==================== Notification Query Methods ====================

    /**
     * Get notification by ID
     */
    @Transactional(readOnly = true)
    public Optional<Notification> getNotificationById(Long id) {
        return notificationRepository.findById(id);
    }

    /**
     * Get notifications by user
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    /**
     * Get notifications by user with pagination
     */
    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsByUser(Long userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }

    /**
     * Get unread notifications by user
     */
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndRead(userId, false);
    }

    /**
     * Get notifications by status
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByStatus(Notification.Status status) {
        return notificationRepository.findByStatus(status);
    }

    /**
     * Get notifications by type
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByType(Notification.NotificationType type) {
        return notificationRepository.findByType(type);
    }

    /**
     * Get notifications by priority
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByPriority(Notification.Priority priority) {
        return notificationRepository.findByPriority(priority);
    }

    // ==================== Scheduled Notifications ====================

    /**
     * Get scheduled notifications ready to send
     */
    @Transactional(readOnly = true)
    public List<Notification> getScheduledNotificationsToSend() {
        return notificationRepository.findScheduledNotificationsToSend(LocalDateTime.now());
    }

    /**
     * Process scheduled notifications
     */
    public void processScheduledNotifications() {
        List<Notification> scheduledNotifications = getScheduledNotificationsToSend();
        for (Notification notification : scheduledNotifications) {
            sendNotification(notification.getId());
        }
    }

    // ==================== Bulk Operations ====================

    /**
     * Mark multiple notifications as read
     */
    public void markMultipleAsRead(List<Long> notificationIds) {
        notificationRepository.markAsReadBulk(notificationIds, LocalDateTime.now());
    }

    /**
     * Mark all user notifications as read
     */
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForUser(userId, LocalDateTime.now());
    }

    /**
     * Archive multiple notifications
     */
    public void archiveMultiple(List<Long> notificationIds) {
        notificationRepository.archiveBulk(notificationIds, LocalDateTime.now());
    }

    /**
     * Delete multiple notifications
     */
    public void deleteMultiple(List<Long> notificationIds) {
        notificationRepository.deleteAllById(notificationIds);
    }

    // ==================== Analytics and Statistics ====================

    /**
     * Get notification count by user
     */
    @Transactional(readOnly = true)
    public long getNotificationCountByUser(Long userId) {
        return notificationRepository.countByUserId(userId);
    }

    /**
     * Get unread notification count by user
     */
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(Long userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }

    /**
     * Get notification count by status
     */
    @Transactional(readOnly = true)
    public long getNotificationCountByStatus(Notification.Status status) {
        return notificationRepository.countByStatus(status);
    }

    /**
     * Get notification count by type
     */
    @Transactional(readOnly = true)
    public long getNotificationCountByType(Notification.NotificationType type) {
        return notificationRepository.countByType(type);
    }

    /**
     * Get delivery rate
     */
    @Transactional(readOnly = true)
    public double getDeliveryRate() {
        long totalSent = notificationRepository.countByStatus(Notification.Status.SENT) +
                        notificationRepository.countByStatus(Notification.Status.DELIVERED);
        if (totalSent == 0) return 0.0;
        
        long delivered = notificationRepository.countByStatus(Notification.Status.DELIVERED);
        return (double) delivered / totalSent * 100.0;
    }

    /**
     * Get read rate
     */
    @Transactional(readOnly = true)
    public double getReadRate() {
        long totalDelivered = notificationRepository.countByStatus(Notification.Status.DELIVERED);
        if (totalDelivered == 0) return 0.0;
        
        long read = notificationRepository.countByRead(true);
        return (double) read / totalDelivered * 100.0;
    }

    /**
     * Get click rate
     */
    @Transactional(readOnly = true)
    public double getClickRate() {
        long totalRead = notificationRepository.countByRead(true);
        if (totalRead == 0) return 0.0;
        
        long clicked = notificationRepository.countByClicked(true);
        return (double) clicked / totalRead * 100.0;
    }

    /**
     * Get notification statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getNotificationStatistics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime weekStart = now.minusDays(7);
        
        return Map.of(
            "totalNotifications", notificationRepository.count(),
            "todayNotifications", notificationRepository.countByCreatedAtAfter(todayStart),
            "weekNotifications", notificationRepository.countByCreatedAtAfter(weekStart),
            "pendingNotifications", notificationRepository.countByStatus(Notification.Status.PENDING),
            "sentNotifications", notificationRepository.countByStatus(Notification.Status.SENT),
            "deliveredNotifications", notificationRepository.countByStatus(Notification.Status.DELIVERED),
            "failedNotifications", notificationRepository.countByStatus(Notification.Status.FAILED),
            "deliveryRate", getDeliveryRate(),
            "readRate", getReadRate(),
            "clickRate", getClickRate()
        );
    }

    // ==================== Retry and Error Handling ====================

    /**
     * Get failed notifications for retry
     */
    @Transactional(readOnly = true)
    public List<Notification> getFailedNotificationsForRetry(int maxRetries) {
        return notificationRepository.findFailedNotificationsForRetry(maxRetries);
    }

    /**
     * Retry failed notification
     */
    public void retryFailedNotification(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            if (notification.getStatus() == Notification.Status.FAILED) {
                notification.setStatus(Notification.Status.PENDING);
                notification.setRetryCount(notification.getRetryCount() + 1);
                notification.setUpdatedAt(LocalDateTime.now());
                notificationRepository.save(notification);
            }
        }
    }

    /**
     * Process retry queue
     */
    public void processRetryQueue() {
        List<Notification> failedNotifications = getFailedNotificationsForRetry(3);
        for (Notification notification : failedNotifications) {
            retryFailedNotification(notification.getId());
        }
    }

    // ==================== Expiration Handling ====================

    /**
     * Get expired notifications
     */
    @Transactional(readOnly = true)
    public List<Notification> getExpiredNotifications() {
        return notificationRepository.findExpiredNotifications(LocalDateTime.now());
    }

    /**
     * Clean up expired notifications
     */
    public void cleanupExpiredNotifications() {
        List<Notification> expiredNotifications = getExpiredNotifications();
        for (Notification notification : expiredNotifications) {
            notification.setStatus(Notification.Status.EXPIRED);
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    // ==================== Search and Filter ====================

    /**
     * Search notifications by content
     */
    @Transactional(readOnly = true)
    public List<Notification> searchNotifications(String searchTerm) {
        return notificationRepository.searchByTitleOrMessage(searchTerm);
    }

    /**
     * Get recent notifications
     */
    @Transactional(readOnly = true)
    public List<Notification> getRecentNotifications(int limit) {
        return notificationRepository.findRecentNotifications(Pageable.ofSize(limit));
    }

    /**
     * Get high priority notifications
     */
    @Transactional(readOnly = true)
    public List<Notification> getHighPriorityNotifications() {
        return notificationRepository.findByPriority(Notification.Priority.HIGH);
    }

    // ==================== Campaign and Batch Operations ====================

    /**
     * Get notifications by batch ID
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByBatch(String batchId) {
        return notificationRepository.findByBatchId(batchId);
    }

    /**
     * Get batch statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBatchStatistics(String batchId) {
        List<Notification> batchNotifications = getNotificationsByBatch(batchId);
        
        if (batchNotifications.isEmpty()) {
            return Map.of();
        }
        
        long total = batchNotifications.size();
        long sent = batchNotifications.stream().mapToLong(n -> 
            n.getStatus() == Notification.Status.SENT || n.getStatus() == Notification.Status.DELIVERED ? 1 : 0).sum();
        long delivered = batchNotifications.stream().mapToLong(n -> 
            n.getStatus() == Notification.Status.DELIVERED ? 1 : 0).sum();
        long read = batchNotifications.stream().mapToLong(n -> n.getRead() ? 1 : 0).sum();
        long clicked = batchNotifications.stream().mapToLong(n -> n.getClicked() ? 1 : 0).sum();
        long failed = batchNotifications.stream().mapToLong(n -> 
            n.getStatus() == Notification.Status.FAILED ? 1 : 0).sum();
        
        return Map.of(
            "batchId", batchId,
            "totalNotifications", total,
            "sentNotifications", sent,
            "deliveredNotifications", delivered,
            "readNotifications", read,
            "clickedNotifications", clicked,
            "failedNotifications", failed,
            "deliveryRate", total > 0 ? (double) delivered / total * 100 : 0,
            "readRate", delivered > 0 ? (double) read / delivered * 100 : 0,
            "clickRate", read > 0 ? (double) clicked / read * 100 : 0
        );
    }

    // ==================== Cleanup and Maintenance ====================

    /**
     * Clean up old notifications
     */
    public void cleanupOldNotifications(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        notificationRepository.deleteOldNotifications(cutoffDate);
    }

    /**
     * Archive old notifications
     */
    public void archiveOldNotifications(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        notificationRepository.archiveOldNotifications(cutoffDate, LocalDateTime.now());
    }
}