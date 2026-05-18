"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';

type UserRow = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  managerId: string | null;
};

export default function ManagerTeamManagementPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [managerProfile, setManagerProfile] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string | 'all'>('all');
  const [view, setView] = useState<'all' | 'my-team'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, usersRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/users')
      ]);

      const profileData = await profileRes.json();
      const usersData = await usersRes.json();

      if (profileRes.ok) setManagerProfile(profileData.data);
      if (usersRes.ok) setUsers(usersData.data);
    } catch (err) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const u of users) set.add(u.department);
    return Array.from(set).sort();
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (view === 'my-team' && u.managerId !== managerProfile?.employeeId) return false;
      if (deptFilter !== 'all' && u.department !== deptFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q)
      );
    });
  }, [deptFilter, managerProfile?.employeeId, query, users, view]);

  const toggleTeamMember = async (user: UserRow) => {
    const isMember = user.managerId === managerProfile?.employeeId;
    const newManagerId = isMember ? null : managerProfile?.employeeId;

    setBusy(user._id);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: newManagerId }),
      });

      if (res.ok) {
        showToast(isMember ? 'Removed from team' : 'Added to team');
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'Failed to update team', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading team management...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2>Team Management</h2>
        <p style={{ color: '#64748b' }}>Assign employees to your team for goal approvals.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search name, ID or email..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={inputStyle}
        />
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
          <button 
            onClick={() => setView('all')}
            style={{ 
              ...toggleButtonStyle, 
              background: view === 'all' ? '#fff' : 'transparent',
              boxShadow: view === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            All Employees
          </button>
          <button 
            onClick={() => setView('my-team')}
            style={{ 
              ...toggleButtonStyle, 
              background: view === 'my-team' ? '#fff' : 'transparent',
              boxShadow: view === 'my-team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            My Team
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>Employee</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Current Manager</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const isMyMember = u.managerId === managerProfile?.employeeId;
              const hasOtherManager = u.managerId && u.managerId !== managerProfile?.employeeId;

              return (
                <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.employeeId} • {u.email}</div>
                  </td>
                  <td style={tdStyle}>{u.department}</td>
                  <td style={tdStyle}>
                    {isMyMember ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>You</span>
                    ) : u.managerId ? (
                      <span style={{ color: '#64748b' }}>{u.managerId}</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => toggleTeamMember(u)}
                      disabled={busy === u._id}
                      style={{ 
                        ...actionButtonStyle,
                        background: isMyMember ? '#fee2e2' : '#f0f9ff',
                        color: isMyMember ? '#991b1b' : '#0369a1',
                        borderColor: isMyMember ? '#fecaca' : '#bae6fd'
                      }}
                    >
                      {busy === u._id ? 'Updating...' : isMyMember ? 'Remove from Team' : 'Add to Team'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            No employees found matching your filters.
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  minWidth: 200
};

const toggleButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase'
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: 14
};

const actionButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer'
};
