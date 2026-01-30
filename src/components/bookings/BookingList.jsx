// src/components/bookings/BookingList.jsx
import BookingCard from './BookingCard';
import LoadingSpinner from '../common/LoadingSpinner';

export default function BookingList({ 
  bookings, 
  loading, 
  onEdit, 
  onDelete, 
  onCancel, 
  currentUserId 
}) {
  if (loading) {
    return <LoadingSpinner message="Loading bookings..." />;
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
        <p className="text-gray-600 dark:text-gray-400">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onEdit={onEdit}
          onDelete={onDelete}
          onCancel={onCancel}
          isCreator={booking.created_by === currentUserId}
        />
      ))}
    </div>
  );
}
