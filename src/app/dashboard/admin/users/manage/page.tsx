"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

type UserRole = 'employee' | 'manager' | 'admin';

type UserRow = {
  _id: string;
  uid: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  managerId: string | null;
  isActive: boolean;
};

function toUserRole(v: string): UserRole {
  if (v === 'employee' || v === 'manager' || v === 'admin') return v;
  return 'employee';
}

export default function AdminManageUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UserRow[]>([]);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<string | 'all'>('all');

  const fetchUsers = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to fetch users');
        setRows([]);
        return;
      }

      const list = (data?.data ?? []) as any[];
      const mapped: UserRow[] = list.map((u) => ({
        _id: String(u._id ?? u.id),
        uid: String(u.uid ?? 'N/A'),
        employeeId: String(u.employeeId ?? ''),
        name: String(u.name ?? ''),
        email: String(u.email ?? ''),
        role: toUserRole(String(u.role ?? 'employee')),
        department: String(u.department ?? ''),
        managerId: u.managerId ?? null,
        isActive: Boolean(u.isActive),
      }));

      setRows(mapped);
    } catch {
      setError('Network error while fetching users');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.department);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (deptFilter !== 'all' && r.department !== deptFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q)
      );
    });
  }, [deptFilter, query, roleFilter, rows]);

  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<UserRow> | null>(null);
  const [busy, setBusy] = useState(false);

  const beginEdit = useCallback(
    (row: UserRow) => {
      setEditId(row._id);
      setEditDraft({
        employeeId: row.employeeId,
        name: row.name,
        email: row.email,
        role: row.role,
        department: row.department,
        managerId: row.managerId,
        isActive: row.isActive,
      });
    },
    []
  );

  const cancelEdit = useCallback(() => {
    setEditId(null);
    setEditDraft(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId || !editDraft) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${editId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employeeId: String(editDraft.employeeId ?? ''),
          name: String(editDraft.name ?? ''),
          email: String(editDraft.email ?? ''),
          role: editDraft.role,
          department: String(editDraft.department ?? ''),
          managerId: (editDraft.managerId ?? '') || null,
          isActive: Boolean(editDraft.isActive),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error?.message ?? 'Failed to update user', 'error');
        return;
      }

      showToast('User updated successfully');
      await fetchUsers();
      cancelEdit();
    } catch {
      showToast('Network error while updating user', 'error');
    } finally {
      setBusy(false);
    }
  }, [cancelEdit, editDraft, editId, fetchUsers, showToast]);

  const deleteUser = useCallback(
    async (id: string) => {
      if (!confirm('Delete this user? This will delete Firebase Auth account too.')) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          showToast(data?.error?.message ?? 'Failed to delete user', 'error');
          return;
        }
        showToast('User deleted successfully');
        await fetchUsers();
      } catch {
        showToast('Network error while deleting user', 'error');
      } finally {
        setBusy(false);
      }
    },
    [fetchUsers, showToast]
  );

  const toggleActive = useCallback(
    async (row: UserRow) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/users/${row._id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            isActive: !row.isActive,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          showToast(data?.error?.message ?? 'Failed to update status', 'error');
          return;
        }
        showToast(row.isActive ? 'User deactivated' : 'User activated');
        await fetchUsers();
      } catch {
        showToast('Network error while toggling status', 'error');
      } finally {
        setBusy(false);
      }
    },
    [fetchUsers, showToast]
  );

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Manage Users</h2>
          <p style={{ marginTop: 6, opacity: 0.85 }}>
            Enterprise admin table. Actions: edit, delete, activate/deactivate.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="button primary"
            type="button"
            onClick={() => router.push('/dashboard/admin/users/create')}
            disabled={busy}
          >
            + Create User
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.08)',
          background: '#fff',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.9fr', gap: 12 }}>
          <label style={{ display: 'block' }}>
            Search (name/email/employeeId)
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="e.g. jane@atomberg.com"
            />
          </label>

          <label style={{ display: 'block' }}>
            Role
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
            >
              <option value="all">all</option>
              <option value="employee">employee</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label style={{ display: 'block' }}>
            Department
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as any)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
            >
              <option value="all">all</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <div style={{ marginTop: 14, color: 'crimson' }}>{error}</div> : null}

      <div
        style={{
          marginTop: 16,
          overflowX: 'auto',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={thStyle}>Employee ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>UID (Firebase)</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td style={tdStyle} colSpan={8}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={8}>
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>No users found</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Try adjusting your filters or search query.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row._id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={tdStyle}>
                    {editId === row._id ? (
                      <label style={{ display: 'block' }}>
                        <input
                          value={String(editDraft?.employeeId ?? '')}
                          onChange={(e) => setEditDraft((d) => ({ ...(d ?? {}), employeeId: e.target.value }))}
                          style={{ width: '100%', padding: 8 }}
                        />
                      </label>
                    ) : (
                      row.employeeId
                    )}

                  </td>
                  <td style={tdStyle}>
                    {editId === row._id ? (
                      <input
                        value={String(editDraft?.name ?? '')}
                        onChange={(e) => setEditDraft((d) => ({ ...(d ?? {}), name: e.target.value }))}
                        style={{ width: '100%', padding: 8 }}
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td style={tdStyle}>
                    {editId === row._id ? (
                      <input
                        value={String(editDraft?.email ?? '')}
                        onChange={(e) => setEditDraft((d) => ({ ...(d ?? {}), email: e.target.value }))}
                        style={{ width: '100%', padding: 8 }}
                      />
                    ) : (
                      row.email
                    )}
                  </td>
                  <td style={tdStyle}>
                    {editId === row._id ? (
                      <label style={{ display: 'block' }}>
                        <span style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
                          Role
                        </span>
                        <select
                          value={String(editDraft?.role ?? row.role)}
                          onChange={(e) => setEditDraft((d) => ({ ...(d ?? {}), role: e.target.value as any }))}
                          style={{ width: '100%', padding: 8 }}
                        >
                          <option value="employee">employee</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>
                    ) : (
                      row.role
                    )}

                  </td>
                  <td style={tdStyle}>
                    {editId === row._id ? (
                      <input
                        value={String(editDraft?.department ?? '')}
                        onChange={(e) => setEditDraft((d) => ({ ...(d ?? {}), department: e.target.value }))}
                        style={{ width: '100%', padding: 8 }}
                        aria-label="Department"
                      />
                    ) : (
                      row.department
                    )}
                  </td>
                  <td style={tdStyle}>
                    <code style={{ fontSize: 11, color: '#64748b' }}>{row.uid.slice(0, 8)}...</code>
                  </td>
                  <td style={tdStyle}>
                    {editId === row._id ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(editDraft?.isActive)}
                          onChange={(e) => setEditDraft((d) => ({ ...(d ?? {}), isActive: e.target.checked }))}
                        />
                        {editDraft?.isActive ? 'Active' : 'Inactive'}
                      </label>
                    ) : row.isActive ? (
                      <span style={{ color: 'green' }}>Active</span>
                    ) : (
                      <span style={{ color: 'crimson' }}>Inactive</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {editId === row._id ? (
                        <>
                          <button className="button primary" type="button" onClick={saveEdit} disabled={busy}>
                            {busy ? 'Saving...' : 'Save'}
                          </button>
                          <button className="button" type="button" onClick={cancelEdit} disabled={busy}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="button"
                            type="button"
                            onClick={() => beginEdit(row)}
                            disabled={busy}
                          >
                            Edit
                          </button>
                          <button
                            className="button"
                            type="button"
                            onClick={() => toggleActive(row)}
                            disabled={busy}
                          >
                            {row.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="button danger"
                            type="button"
                            onClick={() => deleteUser(row._id)}
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .button {
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: white;
          cursor: pointer;
          font-size: 13px;
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .button.primary {
          background: #111827;
          border-color: #111827;
          color: white;
        }
        .button.danger {
          border-color: rgba(220, 38, 38, 0.6);
          background: rgba(220, 38, 38, 0.08);
          color: #991b1b;
        }
      `}</style>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  fontSize: 13,
  verticalAlign: 'top',
};
