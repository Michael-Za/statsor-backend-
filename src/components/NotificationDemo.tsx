import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationDemo: React.FC = () => {
  const { addNotification, notifications } = useNotifications();

  useEffect(() => {
    // Only add demo notifications if there are no existing notifications
    if (notifications.length === 0) {
      // Add some sample notifications to demonstrate the functionality
      setTimeout(() => {
        addNotification({
          title: 'Welcome to TeamPlaymate!',
          message: 'Your dashboard is ready. Explore all the features available to manage your team effectively.',
          type: 'info',
          actionUrl: '/dashboard',
          actionLabel: 'View Dashboard'
        });
      }, 1000);

      setTimeout(() => {
        addNotification({
          title: 'New Match Scheduled',
          message: 'Your next match against Team Alpha is scheduled for tomorrow at 3:00 PM.',
          type: 'success',
          actionUrl: '/matches',
          actionLabel: 'View Matches'
        });
      }, 2000);

      setTimeout(() => {
        addNotification({
          title: 'Player Performance Alert',
          message: 'John Smith has shown significant improvement in recent training sessions.',
          type: 'success',
          actionUrl: '/players',
          actionLabel: 'View Players'
        });
      }, 3000);

      setTimeout(() => {
        addNotification({
          title: 'Training Session Reminder',
          message: 'Don\'t forget about today\'s training session at 5:00 PM. Make sure all equipment is ready.',
          type: 'warning',
          actionUrl: '/training',
          actionLabel: 'View Training'
        });
      }, 4000);

      setTimeout(() => {
        addNotification({
          title: 'Analytics Report Ready',
          message: 'Your weekly team performance analytics report is now available for review.',
          type: 'info',
          actionUrl: '/advanced-analytics',
          actionLabel: 'View Analytics'
        });
      }, 5000);
    }
  }, [addNotification, notifications.length]);

  return null; // This component doesn't render anything
};

export default NotificationDemo;