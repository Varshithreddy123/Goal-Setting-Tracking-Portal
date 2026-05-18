"use client";

import { useCallback, useEffect, useState } from 'react';

type AuditLog = {
  _id: string;
  goalId: string;
  changedBy: string;
  changedByDisplay?: string;
  changeType: string;
  oldValues: any;
  newValues: any;
  reason: string;
  createdAt: string;
};


export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) return <div style={{ padding: 24 }}>Loading Audit Trail...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>System Audit Trail</h2>
        <p style={{ color: '#64748b' }}>Detailed log of all changes made to goals after lock date.</p>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16 }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Changed By</th>
              <th style={thStyle}>Goal ID</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No audit logs found.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={tdStyle}>{log.changedByDisplay || log.changedBy}</td>

                  <td style={tdStyle}>{log.goalId}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      fontSize: 11, 
                      fontWeight: 700,
                      background: '#f1f5f9',
                      color: '#475569'
                    }}>
                      {log.changeType}
                    </span>
                  </td>
                  <td style={tdStyle}>{log.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 12,
  color: '#64748b',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#111827',
};
