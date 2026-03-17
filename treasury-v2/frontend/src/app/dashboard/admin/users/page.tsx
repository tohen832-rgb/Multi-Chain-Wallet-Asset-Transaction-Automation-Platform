'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface UserItem { id: string; email: string; role: string; status: string; lastLogin: string | null; createdAt: string }

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'VIEWER' });
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try { const { data } = await api.get('/api/users'); setUsers(data.users); } catch {}
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/users', form);
      setShowCreate(false);
      setForm({ email: '', password: '', role: 'VIEWER' });
      loadUsers();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed'); }
  }

  async function changeRole(id: string, role: string) {
    try { await api.put(`/api/users/${id}/role`, { role }); loadUsers(); } catch {}
  }

  async function toggleStatus(id: string, current: string) {
    const status = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try { await api.put(`/api/users/${id}/status`, { status }); loadUsers(); } catch {}
  }

  if (!isAdmin) return <div className="p-6 text-red-400">Admin access required</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
          + Create User
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-700 border border-dark-500 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Create User</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white">
                  <option value="VIEWER">Viewer</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-dark-700 border border-dark-500 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-dark-500">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-dark-600 hover:bg-dark-600/50 transition">
                <td className="px-4 py-3 text-sm">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className="bg-dark-600 border border-dark-500 rounded px-2 py-1 text-xs text-white">
                    <option value="ADMIN">Admin</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    u.status === 'ACTIVE' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                  }`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(u.id, u.status)}
                    className={`text-xs px-3 py-1 rounded transition ${
                      u.status === 'ACTIVE' ? 'text-red-400 hover:bg-red-900/30' : 'text-green-400 hover:bg-green-900/30'
                    }`}>
                    {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
