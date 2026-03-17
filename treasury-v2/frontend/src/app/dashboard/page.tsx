'use client';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.email}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: '0', color: 'border-blue-500' },
          { label: 'Contracts', value: '0', color: 'border-purple-500' },
          { label: 'Transfers', value: '0 / 0', color: 'border-green-500' },
          { label: 'Gas', value: '-- Gwei', color: 'border-amber-500' },
        ].map(s => (
          <div key={s.label} className={`bg-dark-700 border-l-4 ${s.color} border border-dark-500 rounded-lg p-4`}>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tasks table placeholder */}
      <div className="bg-dark-700 border border-dark-500 rounded-lg">
        <div className="p-4 border-b border-dark-500 flex justify-between items-center">
          <h2 className="font-semibold">Tasks</h2>
        </div>
        <div className="p-12 text-center text-gray-500">
          No tasks yet. Backend services ready — use AI prompts to build task creation.
        </div>
      </div>
    </div>
  );
}
