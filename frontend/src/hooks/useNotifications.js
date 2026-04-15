/**
 * Real-time notifications hook using Supabase Realtime subscriptions
 * Enables instant updates across multiple devices and eliminates polling
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load initial notifications from database
  const loadInitialNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load initial notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!userId) return;

    // Load initial data first
    loadInitialNotifications();

    // Subscribe to INSERT events (new notifications)
    const insertSubscription = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] New notification:', payload.new);
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] INSERT subscription:', status);
      });

    // Subscribe to UPDATE events (read status changes)
    const updateSubscription = supabase
      .channel(`notifications:update:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Notification updated:', payload.new);
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] UPDATE subscription:', status);
      });

    // Cleanup
    return () => {
      insertSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, [userId, loadInitialNotifications]);

  // Mark a notification as read (multi-device sync via DB)
  const markAsRead = useCallback(async (notificationId) => {
    if (!userId || !notificationId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      // Local state will auto-update via Realtime subscription
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  }, [userId]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!userId || !notificationId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  }, [userId]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount: notifications.filter(n => !n.read).length,
  };
}
