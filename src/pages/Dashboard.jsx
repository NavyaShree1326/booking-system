// src/pages/Dashboard.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Users, TrendingUp, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService } from '../services/bookingService';
import BookingForm from '../components/bookings/BookingForm';
import { format, isToday, isFuture, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  // CRITICAL FIX: Only load bookings when user is ready
  useEffect(() => {
    if (!authLoading && user?.id) {
      loadBookings();
    } else if (!authLoading && !user) {
      // Not logged in, redirect
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const loadBookings = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping load');
      return;
    }

    try {
      setLoading(true);
      const data = await bookingService.getUserBookings(user.id);
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingForm(true);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      await bookingService.deleteBooking(bookingId);
      toast.success('Booking deleted');
      loadBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled');
      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const startTime = new Date(booking.start_time);
    if (filter === 'upcoming') return isFuture(startTime) && booking.status === 'scheduled';
    if (filter === 'past') return isPast(startTime) || booking.status === 'completed';
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  const stats = {
    upcoming: bookings.filter(b => isFuture(new Date(b.start_time)) && b.status === 'scheduled').length,
    today: bookings.filter(b => isToday(new Date(b.start_time)) && b.status === 'scheduled').length,
    total: bookings.filter(b => b.created_by === user?.id).length,
  };

  // Show loading only while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, don't render (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Booking System</h1>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}`}
                  alt={profile?.full_name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
                </div>
              </div>

              <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.upcoming}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.today}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-lg ${filter === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              Upcoming
            </button>
            <button onClick={() => setFilter('past')} className={`px-4 py-2 rounded-lg ${filter === 'past' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              Past
            </button>
            <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg ${filter === 'cancelled' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              Cancelled
            </button>
          </div>

          <button onClick={handleCreateBooking} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus className="w-5 h-5" />
            Create Booking
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No {filter} bookings</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'upcoming' && "Create your first booking to get started!"}
              {filter === 'past' && "No past bookings found."}
              {filter === 'cancelled' && "No cancelled bookings found."}
            </p>
            {filter === 'upcoming' && (
              <button onClick={handleCreateBooking} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-5 h-5" />
                Create Your First Booking
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onEdit={handleEditBooking}
                onDelete={handleDeleteBooking}
                onCancel={handleCancelBooking}
                isCreator={booking.created_by === user.id}
              />
            ))}
          </div>
        )}
      </div>

      {showBookingForm && (
        <BookingForm
          booking={selectedBooking}
          onClose={() => setShowBookingForm(false)}
          onSuccess={loadBookings}
        />
      )}
    </div>
  );
}

function BookingCard({ booking, onEdit, onDelete, onCancel, isCreator }) {
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              booking.status === 'scheduled' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
              booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
          </div>
        </div>

        {isCreator && booking.status === 'scheduled' && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(booking)} className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
              Edit
            </button>
            <button onClick={() => onCancel(booking.id)} className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}