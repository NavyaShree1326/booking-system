// src/components/bookings/BookingCard.jsx
import { Calendar, Clock, Users, MapPin, Edit, Trash2, Ban } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingCard({ booking, onEdit, onDelete, onCancel, isCreator }) {
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {booking.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              booking.status === 'scheduled'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : booking.status === 'cancelled'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {booking.status}
            </span>
          </div>
          
          {booking.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{booking.description}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(startTime, 'MMM dd, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(startTime, 'hh:mm a')} - {format(endTime, 'hh:mm a')}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {booking.attendees?.length || 0} attendees
            </span>
            {booking.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {booking.location}
              </span>
            )}
          </div>
        </div>

        {isCreator && booking.status === 'scheduled' && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(booking)}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Edit booking"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onCancel(booking.id)}
              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              title="Cancel booking"
            >
              <Ban className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(booking.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete booking"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}