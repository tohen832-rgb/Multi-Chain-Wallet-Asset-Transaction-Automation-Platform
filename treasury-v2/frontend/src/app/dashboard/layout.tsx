'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gray-400">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Sidebar */}
      <aside className="w-60 bg-dark-800 border-r border-dark-500 flex flex-col">
        <div className="p-4 border-b border-dark-500">
          <h2 className="font-bold text-lg">Treasury</h2>
          <p className="text-xs text-gray-500">Distributor System</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-dark-600 text-gray-300 hover:text-white transition">
            <span className="w-5 text-center">~</span> Dashboard
          </Link>
          <Link href="/dashboard/tasks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-dark-600 text-gray-300 hover:text-white transition">
            <span className="w-5 text-center">#</span> Tasks
          </Link>

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs text-gray-600 uppercase tracking-wider">Admin</div>
              <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-dark-600 text-gray-300 hover:text-white transition">
                <span className="w-5 text-center">@</span> Users
              </Link>
            </>
          )}

          <div className="pt-4 pb-1 px-3 text-xs text-gray-600 uppercase tracking-wider">System</div>
          <Link href="/dashboard/logs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-dark-600 text-gray-300 hover:text-white transition">
            <span className="w-5 text-center">&gt;</span> Logs
          </Link>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-dark-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white truncate">{user.email}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                user.role === 'ADMIN' ? 'bg-red-900/50 text-red-300' :
                user.role === 'OPERATOR' ? 'bg-blue-900/50 text-blue-300' :
                'bg-gray-700 text-gray-300'
              }`}>{user.role}</span>
            </div>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition">Logout</button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
