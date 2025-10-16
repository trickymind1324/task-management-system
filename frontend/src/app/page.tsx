// ABOUTME: Landing page that redirects to dashboard or login
// ABOUTME: Entry point for the application

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <img src="/logo.png" alt="Synapse Logo" className="h-16 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Synapse</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
