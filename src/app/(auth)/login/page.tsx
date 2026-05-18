"use client";

import { useCallback, useState } from 'react';

type Role = 'employee' | 'manager' | 'admin';

export default function LoginPage() {
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [status, setStatus] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setStatus(null);

    // Backend verifies:
    // - email is within ORG_EMAIL_DOMAIN
    // - user exists in Mongo and isActive
    // - role stored in Mongo (not from the UI)
    // If you have a real Firebase ID token, set it on window.__FIREBASE_ID_TOKEN__.
    // Otherwise, legacy uid/email dev login still works.
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        uid,
        email,
        ...(typeof (window as any).__FIREBASE_ID_TOKEN__ === 'string' ? { idToken: (window as any).__FIREBASE_ID_TOKEN__ } : {}),
      }),
    });



    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus(data?.error?.message ?? 'Login failed');
      return;
    }

    const redirect = data?.data?.redirect;
    if (redirect) window.location.href = redirect;
    else window.location.href = '/dashboard/employee';
  }, [email, uid]);

  return (
    <main style={{ padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Login</h1>
      <p>Use the real login endpoint. Role is enforced from MongoDB user record.</p>

      <div style={{ maxWidth: 520, marginTop: 18 }}>
        <label style={{ display: 'block', marginBottom: 10 }}>
          UID
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 6 }}
            placeholder="firebase_uid"
          />
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 6 }}
            placeholder="user@atomberg.com"
          />
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          (Optional) Role hint
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

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="button primary" onClick={submit} type="button">
            Login
          </button>
          <a className="button" href="/">
            Skip (will redirect)
          </a>
        </div>

        {status ? (
          <div style={{ marginTop: 14, color: 'crimson' }}>
            {status}
          </div>
        ) : null}
      </div>
    </main>
  );
}



