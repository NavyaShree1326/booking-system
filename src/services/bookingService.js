// src/services/bookingService.js
{/*import { supabase } from './supabase';

export const bookingService = {
  async createBooking(bookingData, attendees) {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        created_by: bookingData.created_by,
        title: bookingData.title,
        description: bookingData.description,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        location: bookingData.location,
        meeting_link: bookingData.meeting_link,
        max_attendees: bookingData.max_attendees,
        status: 'scheduled'
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    if (attendees && attendees.length > 0) {
      const attendeesData = attendees.map(att => ({
        booking_id: booking.id,
        email: att.email,
        full_name: att.full_name,
        user_id: att.user_id || null,
        status: 'pending'
      }));

      const { error: attendeesError } = await supabase
        .from('attendees')
        .insert(attendeesData);

      if (attendeesError) throw attendeesError;
    }

    return booking;
  },

  async getBookings(filters = {}) {
    let query = supabase
      .from('bookings')
      .select('*, created_by_user:users!bookings_created_by_fkey(id, email, full_name, avatar_url), attendees(id, email, full_name, status)')
      .order('start_time', { ascending: true });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getBooking(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, created_by_user:users!bookings_created_by_fkey(id, email, full_name), attendees(id, email, full_name, status, user_id)')
      .eq('id', bookingId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateBooking(bookingId, updates, newAttendees = null) {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) throw bookingError;

    if (newAttendees !== null) {
      await supabase.from('attendees').delete().eq('booking_id', bookingId);

      if (newAttendees.length > 0) {
        const attendeesData = newAttendees.map(att => ({
          booking_id: bookingId,
          email: att.email,
          full_name: att.full_name,
          user_id: att.user_id || null,
          status: att.status || 'pending'
        }));

        const { error: attendeesError } = await supabase
          .from('attendees')
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;
      }
    }

    return booking;
  },

  async deleteBooking(bookingId) {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) throw error;
  },

  async cancelBooking(bookingId) {
    return this.updateBooking(bookingId, { status: 'cancelled' });
  },

  async getUserBookings(userId) {
    const { data: createdBookings, error: createdError } = await supabase
      .from('bookings')
      .select('*, created_by_user:users!bookings_created_by_fkey(id, email, full_name), attendees(id, email, full_name, status)')
      .eq('created_by', userId)
      .order('start_time', { ascending: true });

    if (createdError) throw createdError;

    const { data: attendeeBookings, error: attendeeError } = await supabase
      .from('attendees')
      .select('booking:bookings(*, created_by_user:users!bookings_created_by_fkey(id, email, full_name), attendees(id, email, full_name, status))')
      .eq('user_id', userId);

    if (attendeeError) throw attendeeError;

    const attendingBookings = attendeeBookings.map(a => a.booking).filter(Boolean);
    const allBookings = [...createdBookings, ...attendingBookings];
    const uniqueBookings = Array.from(new Map(allBookings.map(b => [b.id, b])).values());

    return uniqueBookings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  },

  async checkBookingConflict(startTime, endTime, excludeBookingId = null) {
    let query = supabase
      .from('bookings')
      .select('id, title, start_time, end_time')
      .eq('status', 'scheduled')
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data && data.length > 0;
  }
};

*/}

// src/services/bookingService.js
import { supabase } from './supabase';

export const bookingService = {
  async createBooking(bookingData, attendees) {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        created_by: bookingData.created_by,
        title: bookingData.title,
        description: bookingData.description,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        location: bookingData.location,
        meeting_link: bookingData.meeting_link,
        max_attendees: bookingData.max_attendees,
        status: 'scheduled'
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    if (attendees && attendees.length > 0) {
      const attendeesData = attendees.map(att => ({
        booking_id: booking.id,
        email: att.email,
        full_name: att.full_name,
        user_id: att.user_id || null,
        status: 'pending'
      }));

      const { error: attendeesError } = await supabase
        .from('attendees')
        .insert(attendeesData);

      if (attendeesError) throw attendeesError;
    }

    return booking;
  },

  async getBookings(filters = {}) {
    let query = supabase
      .from('bookings')
      .select('*, created_by_user:users!bookings_created_by_fkey(id, email, full_name, avatar_url), attendees(id, email, full_name, status)')
      .order('start_time', { ascending: true });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getBooking(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, created_by_user:users!bookings_created_by_fkey(id, email, full_name), attendees(id, email, full_name, status, user_id)')
      .eq('id', bookingId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateBooking(bookingId, updates, newAttendees = null) {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) throw bookingError;

    if (newAttendees !== null) {
      await supabase.from('attendees').delete().eq('booking_id', bookingId);

      if (newAttendees.length > 0) {
        const attendeesData = newAttendees.map(att => ({
          booking_id: bookingId,
          email: att.email,
          full_name: att.full_name,
          user_id: att.user_id || null,
          status: att.status || 'pending'
        }));

        const { error: attendeesError } = await supabase
          .from('attendees')
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;
      }
    }

    return booking;
  },

  async deleteBooking(bookingId) {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) throw error;
  },

  async cancelBooking(bookingId) {
    return this.updateBooking(bookingId, { status: 'cancelled' });
  },

  async getUserBookings(userId) {
    const { data: createdBookings, error: createdError } = await supabase
      .from('bookings')
      .select('*, created_by_user:users!bookings_created_by_fkey(id, email, full_name), attendees(id, email, full_name, status)')
      .eq('created_by', userId)
      .order('start_time', { ascending: true });

    if (createdError) throw createdError;

    const { data: attendeeBookings, error: attendeeError } = await supabase
      .from('attendees')
      .select('booking:bookings(*, created_by_user:users!bookings_created_by_fkey(id, email, full_name), attendees(id, email, full_name, status))')
      .eq('user_id', userId);

    if (attendeeError) throw attendeeError;

    const attendingBookings = attendeeBookings.map(a => a.booking).filter(Boolean);
    const allBookings = [...createdBookings, ...attendingBookings];
    const uniqueBookings = Array.from(new Map(allBookings.map(b => [b.id, b])).values());

    return uniqueBookings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  },

  async checkBookingConflict(startTime, endTime, excludeBookingId = null) {
    let query = supabase
      .from('bookings')
      .select('id, title, start_time, end_time')
      .eq('status', 'scheduled')
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data && data.length > 0;
  },

  async isWithinAvailability(startTime, endTime, userId = null) {
    try {
      // If there is no 'availability' table or rows, allow by default
      const { data, error } = await supabase.from('availability').select('*');
      if (error || !data) return true;

      const s = new Date(startTime).getTime();
      const e = new Date(endTime).getTime();

      const rows = Array.isArray(data) ? data : [data];

      // Expect availability rows to include start_time/end_time or start_datetime/end_datetime
      return rows.some(a => {
        const aStart = new Date(a.start_time || a.start_datetime).getTime();
        const aEnd = new Date(a.end_time || a.end_datetime).getTime();
        return s >= aStart && e <= aEnd;
      });
    } catch (err) {
      console.warn('isWithinAvailability failed, allowing by default', err);
      return true;
    }
  }
};