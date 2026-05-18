"use client";

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'employee' | 'manager' | 'admin';

export default function AdminCreateUserPage() {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [department, setDepartment] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      employeeId.trim() &&
        name.trim() &&
        email.trim() &&
        temporaryPassword.trim() &&
        department.trim() &&
        role
    );
  }, [department, email, employeeId, name, role, temporaryPassword]);

  const submit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError('Missing required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          name: name.trim(),
          email: email.trim(),
          temporaryPassword: temporaryPassword,
          role,
          department: department.trim(),
          managerId: managerId.trim() ? managerId.trim() : null,
          isActive,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to create user');
        return;
      }

      setSuccess('User created successfully.');
      setEmployeeId('');
      setName('');
      setEmail('');
      setTemporaryPassword('');
      setDepartment('');
      setManagerId('');
      setRole('employee');
      setIsActive(true);

      router.push('/dashboard/admin/users/manage');
    } catch {
      setError('Network error while creating user.');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, department, email, employeeId, isActive, managerId, name, temporaryPassword, role, router]);

  return (
    <main style={{ padding: 24 }}>
      <h2>Create User</h2>
      <p style={{ marginTop: 4, opacity: 0.85 }}>
        Admin provisioning form. Submits to <code>POST /api/users/create</code>.
      </p>

      <div
        style={{
          marginTop: 18,
          maxWidth: 720,
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ display: 'block' }}>
            Employee ID*
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="EMP-001"
            />
          </label>

          <label style={{ display: 'block' }}>
            Full Name*
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="Jane Doe"
            />
          </label>

          <label style={{ display: 'block' }}>
            Email*
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="jane@atomberg.com"
            />
          </label>

          <label style={{ display: 'block' }}>
            Temporary Password*
            <input
              type="password"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="temp-password"
            />
          </label>

          <label style={{ display: 'block' }}>
            Role*
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
            >
              <option value="employee">employee</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label style={{ display: 'block' }}>
            Department*
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="Engineering"
            />
          </label>

          <label style={{ display: 'block' }}>
            Manager ID
            <input
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
              placeholder="optional"
            />
          </label>

          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>

        {error ? <div style={{ marginTop: 14, color: 'crimson' }}>{error}</div> : null}
        {success ? <div style={{ marginTop: 14, color: 'green' }}>{success}</div> : null}

        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <button
            className="button primary"
            type="button"
            disabled={!canSubmit || loading}
            onClick={submit}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
          <button className="button" type="button" disabled={loading} onClick={() => router.push('/dashboard/admin/users/manage')}>
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        .button {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: white;
          cursor: pointer;
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
      `}</style>
    </main>
  );
}
