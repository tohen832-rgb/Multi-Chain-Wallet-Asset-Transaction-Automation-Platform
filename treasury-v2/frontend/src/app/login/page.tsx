'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="bg-dark-700 border border-dark-500 rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2">Treasury Distributor</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
              placeholder="admin@treasury.local" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
              placeholder="Enter password" required />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-dark-500">
          <p className="text-xs text-gray-500 text-center">Default accounts:</p>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <p>Admin: admin@treasury.local / admin123456</p>
            <p>Operator: operator@treasury.local / operator123</p>
            <p>Viewer: viewer@treasury.local / viewer12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
