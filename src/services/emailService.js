// src/services/emailService.js
{/*import { supabase } from './supabase';

export const emailService = {
  async sendBookingCreatedEmail(booking, attendees) {
    try {
      // Create notifications first
      const notifications = attendees.map(attendee => ({
        booking_id: booking.id,
        user_id: attendee.user_id,
        type: 'booking_created',
        message: `You have been invited to "${booking.title}"`,
        status: 'pending'
      }));

      await supabase.from('notifications').insert(notifications);

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('=== EMAIL SERVICE DEBUG ===');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Anon key exists:', !!anonKey);
      console.log('Anon key length:', anonKey?.length);
      
      if (!supabaseUrl || !anonKey) {
        console.error('❌ Missing Supabase configuration');
        return { success: false, error: 'Missing Supabase configuration' };
      }

      // Construct the function URL
      const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-booking-email`;
      console.log('Function URL:', functionUrl);

      // Prepare the payload
      const payload = {
        type: 'booking_created',
        booking,
        attendees: attendees.map(a => ({ email: a.email, full_name: a.full_name }))
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Call the Edge Function with anon key (your Edge Function doesn't verify JWT anyway)
      console.log('🚀 Calling Edge Function...');
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      let result = null;
      try {
        result = await response.json();
      } catch (e) {
        console.log('Failed to parse JSON, trying text...');
        try {
          result = await response.text();
        } catch {
          result = null;
        }
      }

      console.log('📦 Response data:', result);

      if (!response.ok) {
        console.error('❌ Function call failed:', response.status, result);
        
        // Update notifications to failed
        await supabase.from('notifications')
          .update({ status: 'failed' })
          .eq('booking_id', booking.id)
          .eq('type', 'booking_created');
        
        return { success: false, error: result };
      }

      console.log('✅ Email sent successfully!');

      // Mark notifications as sent on success
      await supabase.from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('booking_id', booking.id)
        .eq('type', 'booking_created');

      return { success: true, data: result };
      
    } catch (error) {
      console.error('💥 Error sending emails:', error);
      
      // Update notifications to failed
      try {
        await supabase.from('notifications')
          .update({ status: 'failed' })
          .eq('booking_id', booking.id)
          .eq('type', 'booking_created');
      } catch (e) {
        console.error('Failed to update notification status:', e);
      }
      
      return { success: false, error: error.message };
    }
  },

  async sendBookingUpdatedEmail(booking, attendees) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        return { success: false, error: 'Missing Supabase configuration' };
      }

      const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-booking-email`;
      
      const payload = {
        type: 'booking_updated',
        booking,
        attendees: attendees.map(a => ({ email: a.email, full_name: a.full_name }))
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return { success: response.ok, data: result };
    } catch (error) {
      console.error('Error sending update emails:', error);
      return { success: false, error: error.message };
    }
  },

  async sendBookingCancelledEmail(booking, attendees) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        return { success: false, error: 'Missing Supabase configuration' };
      }

      const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-booking-email`;
      
      const payload = {
        type: 'booking_cancelled',
        booking,
        attendees: attendees.map(a => ({ email: a.email, full_name: a.full_name }))
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return { success: response.ok, data: result };
    } catch (error) {
      console.error('Error sending cancellation emails:', error);
      return { success: false, error: error.message };
    }
  }
};
*/}
// src/services/emailService.js
import { supabase } from './supabase';

const SKIP_PRIVILEGED = (import.meta.env.VITE_SKIP_PRIVILEGED_EMAILS || '').toLowerCase() === 'true';

export const emailService = {
  async isPrivilegedUser(userId) {
    try {
      if (!userId) return false;
      const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
      if (error) return false;
      const role = data?.role || 'user';
      return ['owner', 'developer', 'tester', 'admin'].includes(role);
    } catch (e) {
      console.warn('isPrivilegedUser check failed', e);
      return false;
    }
  },

  async sendBookingCreatedEmail(booking, attendees) {
    try {
      // Only skip emails from privileged accounts if the environment flag enables it
      if (SKIP_PRIVILEGED && await this.isPrivilegedUser(booking.created_by)) {
        console.log('Skipping booking-created emails for privileged account:', booking.created_by);
        return { success: true, skipped: true };
      }

      // Create notifications first
      const notifications = attendees.map(attendee => ({
        booking_id: booking.id,
        user_id: attendee.user_id,
        type: 'booking_created',
        message: `You have been invited to "${booking.title}"`,
        status: 'pending'
      }));

      await supabase.from('notifications').insert(notifications);

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        console.error('❌ Missing Supabase configuration');
        return { success: false, error: 'Missing Supabase configuration' };
      }

      // Construct the function URL
      const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-booking-email`;

      // Prepare the payload
      const payload = {
        type: 'booking_created',
        booking,
        attendees: attendees.map(a => ({ email: a.email, full_name: a.full_name }))
      };

      // Call the Edge Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify(payload)
      });

      let result = null;
      try { result = await response.json(); } catch (e) { result = null; }

      if (!response.ok) {
        console.error('❌ Function call failed:', response.status, result);
        await supabase.from('notifications')
          .update({ status: 'failed' })
          .eq('booking_id', booking.id)
          .eq('type', 'booking_created');
        return { success: false, error: result };
      }

      await supabase.from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('booking_id', booking.id)
        .eq('type', 'booking_created');

      return { success: true, data: result };
      
    } catch (error) {
      console.error('💥 Error sending emails:', error);
      try {
        await supabase.from('notifications')
          .update({ status: 'failed' })
          .eq('booking_id', booking.id)
          .eq('type', 'booking_created');
      } catch (e) {
        console.error('Failed to update notification status:', e);
      }
      return { success: false, error: error.message };
    }
  },

  // sendBookingUpdatedEmail & sendBookingCancelledEmail should follow the same SKIP_PRIVILEGED gating
  async sendBookingUpdatedEmail(booking, attendees) {
    try {
      if (SKIP_PRIVILEGED && await this.isPrivilegedUser(booking.created_by)) {
        console.log('Skipping booking-updated emails for privileged account:', booking.created_by);
        return { success: true, skipped: true };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return { success: false, error: 'Missing Supabase configuration' };

      const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-booking-email`;
      const payload = { type: 'booking_updated', booking, attendees: attendees.map(a => ({ email: a.email, full_name: a.full_name })) };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return { success: response.ok, data: result };
    } catch (error) {
      console.error('Error sending update emails:', error);
      return { success: false, error: error.message };
    }
  },

  async sendBookingCancelledEmail(booking, attendees) {
    try {
      if (SKIP_PRIVILEGED && await this.isPrivilegedUser(booking.created_by)) {
        console.log('Skipping booking-cancelled emails for privileged account:', booking.created_by);
        return { success: true, skipped: true };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return { success: false, error: 'Missing Supabase configuration' };

      const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-booking-email`;
      const payload = { type: 'booking_cancelled', booking, attendees: attendees.map(a => ({ email: a.email, full_name: a.full_name })) };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return { success: response.ok, data: result };
    } catch (error) {
      console.error('Error sending cancellation emails:', error);
      return { success: false, error: error.message };
    }
  }
};