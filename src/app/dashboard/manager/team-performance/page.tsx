"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

type MemberProgress = {
  name: string;
  employeeId: string;
  department: string;
  goalsCount: number;
  approvedGoalsCount: number;
  checkinsCount: number;
  completedCheckins: number;
  latestStatus: string;
  latestQuarter: string;
  completionRate: number;
};

type TeamAnalytics = {
  metrics: {
    teamSize: number;
    totalGoals: number;
    approvedGoals: number;
    pendingApprovals: number;
    reviewedGoalsByManager: number;
    approvedGoalsByManager: number;
    pendingGoalsByManager: number;
    completedCheckins: number;
    pendingCheckins: number;
    checkinCompletionRate: number;
  };
  statusDistribution: { name: string; value: number }[];
  memberProgress: MemberProgress[];
};

export default function TeamPerformancePage() {
  const [data, setData] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/manager/analytics');
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch team analytics');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <div style={{ padding: 24 }}>Loading Team Performance...</div>;
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;

  const metrics = data?.metrics;
  const members = data?.memberProgress || [];
  const statusDistribution = data?.statusDistribution || [];
  const topPerformers = [...members].sort((a, b) => b.completionRate - a.completionRate).slice(0, 3);
  const needsAttention = [...members].sort((a, b) => a.completionRate - b.completionRate).slice(0, 3);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Team Performance</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Goal approval, check-in completion, and team progress for your reporting team.</p>
        </div>
        <button onClick={fetchAnalytics} className="button primary">Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Card title="Team Size" value={metrics?.teamSize ?? 0} color="#111827" />
        <Card title="Total Team Goals" value={metrics?.totalGoals ?? 0} color="#3b82f6" />
        <Card title="Approved Goals" value={metrics?.approvedGoals ?? 0} color="#10b981" />
        <Card title="Pending Review" value={metrics?.pendingApprovals ?? 0} color="#f59e0b" />
        <Card title="Check-in Completion" value={`${metrics?.checkinCompletionRate ?? 0}%`} color="#7c3aed" />
        <Card title="Pending Check-ins" value={metrics?.pendingCheckins ?? 0} color="#ef4444" />
      </div>

      {members.length === 0 && (
        <div style={{ marginBottom: 32, padding: 24, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 8px 0' }}>No team members found</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Assign employees to this manager from Team Management to populate performance data.</p>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Manager Review</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <MetricPanel label="Reviewed" value={metrics?.reviewedGoalsByManager ?? 0} color="#111827" />
          <MetricPanel label="Approved" value={metrics?.approvedGoalsByManager ?? 0} color="#166534" />
          <MetricPanel label="Pending" value={metrics?.pendingGoalsByManager ?? 0} color="#854d0e" />
          <MetricPanel label="Completed Check-ins" value={metrics?.completedCheckins ?? 0} color="#1d4ed8" />
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Top & Needs Attention</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <RankingCard title="Top Performers" members={topPerformers} emptyText="No team data yet." />
          <RankingCard title="Needs Attention" members={needsAttention} emptyText="No team data yet." />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, marginBottom: 32 }}>
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Check-in Status Distribution</h3>
          <div style={{ height: 300, marginTop: 16 }}>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                    {statusDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={emptyStateStyle}>No check-in data available yet.</div>
            )}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Employee Completion Rates (%)</h3>
          <div style={{ height: 300, marginTop: 16 }}>
            {members.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={members} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={110} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" name="Completion %" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={emptyStateStyle}>No employee data available.</div>
            )}
          </div>
        </section>
      </div>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Team Member Details</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Total Goals</th>
                <th style={thStyle}>Approved</th>
                <th style={thStyle}>Check-ins</th>
                <th style={thStyle}>Latest</th>
                <th style={thStyle}>Completion Rate</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }} colSpan={8}>No employee data available.</td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700 }}>{member.name}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{member.department}</div>
                  </td>
                  <td style={tdStyle}>{member.employeeId}</td>
                  <td style={tdStyle}>{member.goalsCount}</td>
                  <td style={tdStyle}>{member.approvedGoalsCount}</td>
                  <td style={tdStyle}>{member.checkinsCount}</td>
                  <td style={tdStyle}>
                    <StatusBadge status={member.latestStatus} />
                    <div style={{ marginTop: 4, color: '#64748b', fontSize: 12 }}>{member.latestQuarter}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 120, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${member.completionRate}%`, height: '100%', background: member.completionRate >= 70 ? '#10b981' : member.completionRate >= 30 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{member.completionRate}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <button
                      className="linkButton"
                      onClick={() => {
                        window.alert(`${member.name} (${member.employeeId})\n\nTotal goals: ${member.goalsCount}\nApproved goals: ${member.approvedGoalsCount}\nCheck-ins: ${member.checkinsCount}\nCompleted check-ins: ${member.completedCheckins}\nCompletion rate: ${member.completionRate}%`);
                      }}
                    >
                      View Details
                    </button>
                    {member.completionRate >= 80 && (
                      <span style={{ marginLeft: 8, padding: '3px 8px', borderRadius: 999, background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12, fontWeight: 700 }}>
                        Top Performer
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .button {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 700;
        }
        .button.primary {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .linkButton {
          background: transparent;
          border: none;
          color: #2563eb;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          padding: 0;
        }
      `}</style>
    </main>
  );
}

function Card({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 20, borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function MetricPanel({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function RankingCard({ title, members, emptyText }: { title: string; members: MemberProgress[]; emptyText: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, color: '#111827' }}>
        {members.length === 0 && <li style={{ color: '#94a3b8' }}>{emptyText}</li>}
        {members.map((m) => (
          <li key={m.employeeId} style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>{m.name}</span> - {m.completionRate}%
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === 'Completed';
  const isOnTrack = status === 'On Track';

  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: 999,
      background: isCompleted ? '#dcfce7' : isOnTrack ? '#dbeafe' : '#f1f5f9',
      color: isCompleted ? '#166534' : isOnTrack ? '#1d4ed8' : '#475569',
      fontSize: 12,
      fontWeight: 700,
    }}>
      {status}
    </span>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: 24,
  borderRadius: 8,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: '#111827',
};

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 12,
  color: '#64748b',
  fontWeight: 800,
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 14,
  color: '#111827',
  verticalAlign: 'top',
};

const emptyStateStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  fontSize: 14,
  fontStyle: 'italic',
};
