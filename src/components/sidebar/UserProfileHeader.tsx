"use client";

import { useEffect, useState } from 'react';

type UserProfile = {
  name: string;
  role: string;
  department: string;
};

export default function UserProfileHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setProfile(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch profile', err));
  }, []);

  if (!profile) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '24px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{profile.name}</div>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
          {profile.role} • {profile.department}
        </div>
      </div>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 600,
        color: '#475569',
        border: '1px solid #e2e8f0'
      }}>
        {profile.name.charAt(0)}
      </div>
    </div>
  );
}
