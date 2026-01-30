// src/components/bookings/BookingForm.jsx
import { useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { bookingService } from '../../services/bookingService';
import { emailService } from '../../services/emailService';
import { calendarService } from '../../services/calendarService';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingForm({ booking, onClose, onSuccess }) {
  const { user } = useAuth();
  const isEdit = !!booking;

  // Get current datetime for min attribute
  const now = new Date();
  const minDateTime = format(now, "yyyy-MM-dd'T'HH:mm");

  const [formData, setFormData] = useState({
    title: booking?.title || '',
    description: booking?.description || '',
    start_time: booking?.start_time ? format(new Date(booking.start_time), "yyyy-MM-dd'T'HH:mm") : '',
    end_time: booking?.end_time ? format(new Date(booking.end_time), "yyyy-MM-dd'T'HH:mm") : '',
    location: booking?.location || '',
    meeting_link: booking?.meeting_link || '',
    max_attendees: booking?.max_attendees || 10,
  });

  const [attendees, setAttendees] = useState(
    booking?.attendees || [{ email: '', full_name: '' }]
  );

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttendeeChange = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const addAttendee = () => {
    setAttendees([...attendees, { email: '', full_name: '' }]);
  };

  const removeAttendee = (index) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate attendees
      const validAttendees = attendees.filter(a => a.email && a.full_name);
      
      if (validAttendees.length === 0) {
        toast.error('Please add at least one attendee');
        setLoading(false);
        return;
      }

      // Validate dates
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);
      const now = new Date();
      
      // Check if start time is in the past
      if (startDate <= now) {
        toast.error('Start time must be in the future');
        setLoading(false);
        return;
      }
      
      if (endDate <= startDate) {
        toast.error('End time must be after start time');
        setLoading(false);
        return;
      }

      // Enforce maximum duration of 1 hour
      const durationMs = endDate - startDate;
      if (durationMs > 60 * 60 * 1000) {
        toast.error('Maximum booking duration is 1 hour');
        setLoading(false);
        return;
      }

      // Optional: check availability windows (bookingService may return true if no availability constraints exist)
      if (typeof bookingService.isWithinAvailability === 'function') {
        const available = await bookingService.isWithinAvailability(startDate.toISOString(), endDate.toISOString(), user.id);
        if (!available) {
          toast.error('Selected time is outside the defined availability windows');
          setLoading(false);
          return;
        }
      }

      // Check for booking conflicts
      const hasConflict = await bookingService.checkBookingConflict(
        formData.start_time,
        formData.end_time,
        booking?.id // Exclude current booking if editing
      );

      if (hasConflict) {
        toast.error('This time slot conflicts with an existing booking');
        setLoading(false);
        return;
      }

      const bookingData = {
        ...formData,
        created_by: user.id,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      // Prepare attendees with form names (NOT Google names)
      const attendeesToSave = validAttendees.map(attendee => ({
        email: attendee.email,
        full_name: attendee.full_name, // Use the name from form, not Google
        user_id: null // Don't link to user_id to avoid Google name override
      }));

      let result;
      if (isEdit) {
        // Update existing booking
        result = await bookingService.updateBooking(
          booking.id,
          bookingData,
          attendeesToSave
        );
        
        toast.success('Booking updated!');
        
        // Send update notifications asynchronously
        emailService.sendBookingUpdatedEmail(result, attendeesToSave)
          .then(response => {
            if (response.success) {
              console.log('Update emails sent successfully');
            }
          })
          .catch(err => console.error('Email error:', err));
        
      } else {
        // Create new booking
        result = await bookingService.createBooking(bookingData, attendeesToSave);
        
        toast.success('Booking created!');
        
        // Send creation notifications (fire-and-forget)
        emailService.sendBookingCreatedEmail(result, attendeesToSave)
          .then(res => {
            if (res?.success) {
              toast.success('Invitations sent to attendees!');
            }
          })
          .catch(e => console.error('Email error:', e));

        // Try to create calendar event (fire-and-forget)
        calendarService.createCalendarEvent(result, attendeesToSave)
          .then(ev => {
            if (ev) {
              console.log('Calendar event created:', ev.id || ev.htmlLink || ev); 
            }
          })
          .catch(err => console.error('Calendar error:', err));
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('Failed to save booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Booking' : 'Create New Booking'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Team Meeting"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Discuss project milestones..."
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                min={minDateTime}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time *
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                min={formData.start_time || minDateTime}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Conference Room A or Online"
            />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Meeting Link
            </label>
            <input
              type="url"
              name="meeting_link"
              value={formData.meeting_link}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://meet.google.com/..."
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attendees * ({attendees.filter(a => a.email && a.full_name).length} added)
            </label>
            <div className="space-y-3">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={attendee.full_name}
                    onChange={(e) => handleAttendeeChange(index, 'full_name', e.target.value)}
                    placeholder="Full Name"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="email"
                    value={attendee.email}
                    onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAttendee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAttendee}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Attendee
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>{isEdit ? 'Update Booking' : 'Create Booking'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}