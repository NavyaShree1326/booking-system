// src/components/admin/BookingStats.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

export default function BookingStats() {
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    cancelled: 0,
    completed: 0,
    upcoming: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const { count: total } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: scheduled } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      const { count: cancelled } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      const { count: completed } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: upcoming } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString());

      setStats({
        total: total || 0,
        scheduled: scheduled || 0,
        cancelled: cancelled || 0,
        completed: completed || 0,
        upcoming: upcoming || 0,
      });
    } catch (error) {
      console.error('Error loading booking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatItem icon={<Calendar />} label="Total" value={stats.total} color="text-gray-600 dark:text-gray-400" />
        <StatItem icon={<Clock />} label="Upcoming" value={stats.upcoming} color="text-blue-600 dark:text-blue-400" />
        <StatItem icon={<CheckCircle />} label="Scheduled" value={stats.scheduled} color="text-green-600 dark:text-green-400" />
        <StatItem icon={<CheckCircle />} label="Completed" value={stats.completed} color="text-purple-600 dark:text-purple-400" />
        <StatItem icon={<XCircle />} label="Cancelled" value={stats.cancelled} color="text-red-600 dark:text-red-400" />
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color }) {
  return (
    <div className="text-center">
      <div className={`inline-flex p-2 ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}