/**
 * Real-time interview requests hook using Supabase Realtime subscriptions
 * Enables instant updates when requests change status across all devices
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useInterviewRequests(userId, userRole) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load initial requests from database
  const loadInitialRequests = useCallback(async () => {
    if (!userId || !userRole) return;
    setLoading(true);
    try {
      let query = supabase
        .from('interview_requests')
        .select(`
          *,
          student:users!interview_requests_student_id_fkey(id, name, email, profile_data),
          alumni:users!interview_requests_alumni_id_fkey(id, name, email, company, profile_data)
        `)
        .order('created_at', { ascending: false });

      // Filter by role
      if (userRole === 'STUDENT') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'ALUMNI') {
        query = query.eq('alumni_id', userId);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        // Normalize to match frontend format
        const normalized = data.map(r => ({
          id: r.request_id,
          studentName: r.student?.name || r.student_name || '',
          studentId: r.student_id,
          alumniName: r.alumni?.name || r.alumni_name || '',
          alumniId: r.alumni_id,
          topic: r.topic,
          message: r.message || '',
          status: (r.status || 'PENDING').toLowerCase(),
          scheduledTime: r.scheduled_time || null,
          roomId: r.room_id || null,
          createdAt: r.created_at,
          studentProfile: r.student_profile_snapshot || r.student?.profile_data || null,
        }));
        setRequests(normalized);
      }
    } catch (err) {
      console.error('Failed to load initial requests:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  // Subscribe to real-time interview request updates
  useEffect(() => {
    if (!userId || !userRole) return;

    loadInitialRequests();

    // Build filter based on user role
    let filter = '';
    if (userRole === 'STUDENT') {
      filter = `student_id=eq.${userId}`;
    } else if (userRole === 'ALUMNI') {
      filter = `alumni_id=eq.${userId}`;
    }

    if (!filter) return;

    // Subscribe to INSERT events (new requests)
    const insertSubscription = supabase
      .channel(`requests:insert:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interview_requests',
          filter,
        },
        () => {
          console.log('[Realtime] New interview request');
          loadInitialRequests();
        }
      )
      .subscribe();

    // Subscribe to UPDATE events (status changes, slot bookings)
    const updateSubscription = supabase
      .channel(`requests:update:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interview_requests',
          filter,
        },
        () => {
          console.log('[Realtime] Interview request updated');
          loadInitialRequests();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      insertSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, [userId, userRole, loadInitialRequests]);

  // Update request status
  const updateRequest = useCallback(async (requestId, updates) => {
    try {
      const { error } = await supabase
        .from('interview_requests')
        .update(updates)
        .eq('request_id', requestId);
      
      if (error) throw error;
      // Local state will auto-update via Realtime
    } catch (err) {
      console.error('Failed to update request:', err.message);
    }
  }, []);

  return {
    requests,
    loading,
    updateRequest,
    pendingRequests: requests.filter(r => r.status === 'pending'),
    acceptedRequests: requests.filter(r => r.status === 'accepted'),
    bookedRequests: requests.filter(r => r.status === 'slot_booked'),
  };
}
