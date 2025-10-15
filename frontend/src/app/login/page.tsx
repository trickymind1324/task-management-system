// ABOUTME: Login page component with email/password authentication
// ABOUTME: Uses auth store for JWT-based authentication with error handling and loading states

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Synapse Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Task Management</h1>
          <p className="mt-2 text-slate-600">Project Synapse</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <Label htmlFor="email" className="text-slate-900">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1 bg-white text-slate-900 border-slate-300"
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-900">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 bg-white text-slate-900 border-slate-300"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || !email || !password}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Production frontend with JWT authentication
          <br />
          Connect to backend API for full functionality
        </p>
      </div>
    </div>
  );
}
