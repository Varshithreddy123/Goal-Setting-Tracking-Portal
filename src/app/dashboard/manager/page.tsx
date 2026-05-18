"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Metrics = {
  teamSize: number;
  totalGoals: number;
  approvedGoals: number;
  pendingApprovals: number;
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manager/analytics');
      const json = await res.json();
      if (res.ok) {
        setMetrics(json.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch manager metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) return <div style={{ padding: 24 }}>Loading Dashboard...</div>;

  const cards = [
    {
      title: 'Team Size',
      value: metrics?.teamSize.toString().padStart(2, '0') || '00',
      description: 'Direct reporting employees',
    },
    {
      title: 'Pending Approvals',
      value: metrics?.pendingApprovals.toString().padStart(2, '0') || '00',
      description: 'Goal plans awaiting review',
    },
    {
      title: 'Approved Goals',
      value: metrics?.approvedGoals.toString().padStart(2, '0') || '00',
      description: 'Successfully reviewed plans',
    },
    {
      title: 'Total Team Goals',
      value: metrics?.totalGoals.toString().padStart(2, '0') || '00',
      description: 'Active goals across team',
    },
    {
      title: 'Quarterly Reviews',
      value: '18',
      description: 'Check-ins completed',
    },
    {
      title: 'Team Progress',
      value: '78%',
      description: 'Average completion rate',
    },
  ];

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2>Manager Workspace</h2>
        <p style={{ color: '#64748b' }}>Monitor your team's performance and manage goal approvals.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{card.title}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{card.description}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0' }}>Approval Queue</h3>
          <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: 14 }}>
            You have <strong>{metrics?.pendingApprovals}</strong> goal plans waiting for your approval.
          </p>
          <button onClick={() => router.push('/dashboard/manager/approvals')} className="button primary">
            Review Approvals
          </button>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0' }}>Team Insights</h3>
          <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: 14 }}>
            View detailed performance charts and individual progress tracking.
          </p>
          <button onClick={() => router.push('/dashboard/manager/team-performance')} className="button">
            View Team Performance
          </button>
        </section>
      </div>

      <style jsx>{`
        .button {
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        .button.primary {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
      `}</style>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: 24,
  borderRadius: 12,
};
