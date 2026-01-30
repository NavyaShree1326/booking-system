// src/services/calendarService.js
{/*import { supabase } from './supabase';

// ============= TIMEZONE CONFIGURATION =============
// Set your timezone here - change this to your actual timezone
// Common timezones:
// - 'Asia/Kolkata' (India)
// - 'America/New_York' (US Eastern)
// - 'America/Los_Angeles' (US Pacific)
// - 'Europe/London' (UK)
// - 'Asia/Dubai' (UAE)
// - 'Asia/Singapore' (Singapore)
const CALENDAR_TIMEZONE = 'Asia/Kolkata'; // <-- CHANGE THIS TO YOUR TIMEZONE
// ==================================================

export const calendarService = {
  // Create calendar event
  async createCalendarEvent(booking, attendees) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.provider_token) {
        console.warn('No provider token available for calendar integration');
        return null;
      }

      const event = {
        summary: booking.title,
        description: booking.description,
        location: booking.location,
        start: {
          dateTime: booking.start_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        end: {
          dateTime: booking.end_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        attendees: attendees.map(att => ({
          email: att.email,
          displayName: att.full_name
        })),
        conferenceData: booking.meeting_link ? {
          entryPoints: [{
            entryPointType: 'video',
            uri: booking.meeting_link,
            label: 'Meeting Link'
          }]
        } : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24*60 }, // ✅ FIXED: Send email immediately (was 24*60 = 1 day before)
            { method: 'popup', minutes: 30 }, // Popup 30 minutes before event
          ],
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.provider_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        let body = null
        try {
          body = await response.json()
        } catch (_e) {
          try { body = await response.text() } catch { body = null }
        }
        console.error('Calendar API error: status=', response.status, 'body=', body)
        return null;
      }

      const calendarEvent = await response.json();
      return calendarEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  },


  // Update calendar event
  async updateCalendarEvent(eventId, booking, attendees) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.provider_token || !eventId) {
        return null;
      }

      const event = {
        summary: booking.title,
        description: booking.description,
        location: booking.location,
        start: {
          dateTime: booking.start_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        end: {
          dateTime: booking.end_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        attendees: attendees.map(att => ({
          email: att.email,
          displayName: att.full_name
        })),
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.data.session.provider_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        return null;
      }

      const calendarEvent = await response.json();
      return calendarEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  },

  // Delete calendar event
  async deleteCalendarEvent(eventId) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.provider_token || !eventId) {
        return;
      }

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.data.session.provider_token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  },

  // Generate iCal format for email attachments
  generateICalEvent(booking, attendees) {
    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking System//EN
BEGIN:VEVENT
UID:${booking.id}@bookingsystem.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(booking.start_time)}
DTEND:${formatDate(booking.end_time)}
SUMMARY:${booking.title}
DESCRIPTION:${booking.description || ''}
LOCATION:${booking.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return ical;
  }
};
*/}

// src/services/calendarService.js
import { supabase } from './supabase';

// ============= TIMEZONE CONFIGURATION =============
// Set your timezone here - change this to your actual timezone
const CALENDAR_TIMEZONE = 'Asia/Kolkata'; // <-- CHANGE THIS TO YOUR TIMEZONE
// ==================================================

export const calendarService = {
  // Create calendar event
  async createCalendarEvent(booking, attendees) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.provider_token) {
        console.warn('No provider token available for calendar integration');
        return null;
      }

      const event = {
        summary: booking.title,
        description: booking.description,
        location: booking.location,
        start: {
          dateTime: booking.start_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        end: {
          dateTime: booking.end_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        attendees: attendees.map(att => ({
          email: att.email,
          displayName: att.full_name
        })),
        conferenceData: booking.meeting_link ? {
          entryPoints: [{
            entryPointType: 'video',
            uri: booking.meeting_link,
            label: 'Meeting Link'
          }]
        } : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.provider_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        let body = null
        try {
          body = await response.json()
        } catch (_e) {
          try { body = await response.text() } catch { body = null }
        }
        console.error('Calendar API error: status=', response.status, 'body=', body)
        return null;
      }

      const calendarEvent = await response.json();
      return calendarEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  },


  // Update calendar event
  async updateCalendarEvent(eventId, booking, attendees) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.provider_token || !eventId) {
        return null;
      }

      const event = {
        summary: booking.title,
        description: booking.description,
        location: booking.location,
        start: {
          dateTime: booking.start_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        end: {
          dateTime: booking.end_time,
          timeZone: CALENDAR_TIMEZONE, // Using explicit timezone
        },
        attendees: attendees.map(att => ({
          email: att.email,
          displayName: att.full_name
        })),
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=none`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.data.session.provider_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        let body = null
        try { body = await response.json() } catch (_e) { try { body = await response.text() } catch { body = null } }
        console.error('Calendar API update error: status=', response.status, 'body=', body)
        return null;
      }

      const calendarEvent = await response.json();
      return calendarEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  },

  // Delete calendar event
  async deleteCalendarEvent(eventId) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.provider_token || !eventId) {
        return;
      }

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=none`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.data.session.provider_token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  },

  // Generate iCal format for email attachments
  generateICalEvent(booking, attendees) {
    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking System//EN
BEGIN:VEVENT
UID:${booking.id}@bookingsystem.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(booking.start_time)}
DTEND:${formatDate(booking.end_time)}
SUMMARY:${booking.title}
DESCRIPTION:${booking.description || ''}
LOCATION:${booking.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return ical;
  }
};