// src/pages/AuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let session = null;
        // Try session from URL helper if available
        if (typeof supabase.auth.getSessionFromUrl === 'function') {
          try {
            const res = await supabase.auth.getSessionFromUrl();
            session = res?.data?.session ?? null;
          } catch (_e) {
            // fallback to getSession below
          }
        }

        if (!session) {
          try {
            const res = await supabase.auth.getSession();
            session = res?.data?.session ?? null;
          } catch (_e) {
            session = null;
          }
        }

        if (session) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error', err);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4 animate-pulse">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {error ? 'Authentication Error' : 'Signing you in...'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {error || 'Please wait while we complete the authentication'}
        </p>
        <div className="mt-8">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto" />
        </div>
        {error && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}