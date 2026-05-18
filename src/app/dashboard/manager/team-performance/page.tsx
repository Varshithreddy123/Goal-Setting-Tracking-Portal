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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function TeamPerformancePage() {
  const [data, setData] = useState<any>(null);
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
    } catch (err) {
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

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2>Team Performance</h2>
        <p style={{ color: '#64748b' }}>Detailed breakdown of goal completion and progress for your reporting team.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <Card title="Team Size" value={data.metrics.teamSize} color="#111827" />
        <Card title="Goals Assigned to Manager's Review" value={data.metrics.totalGoals} color="#3b82f6" />
        <Card title="Approved" value={data.metrics.approvedGoals} color="#10b981" />
        <Card title="Pending Review" value={data.metrics.pendingApprovals} color="#f59e0b" />
      </div>

      {/* Manager Review by Goal Status */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Manager Review (Team Goals)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Reviewed</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#111827' }}>{data.metrics.reviewedGoalsByManager ?? 0}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Approved</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#166534' }}>{data.metrics.approvedGoalsByManager ?? 0}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Pending</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#854d0e' }}>{data.metrics.pendingGoalsByManager ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Ranking (proper team-performance feature) */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Top & Needs Attention</h3>
          <button
            onClick={fetchAnalytics}
            style={{
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Refresh
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Top Performers</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#111827' }}>
              {([...data.memberProgress].sort((a: any, b: any) => b.completionRate - a.completionRate).slice(0, 3)).map((m: any) => (
                <li key={m.employeeId} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{m.name}</span> — {m.completionRate}%
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 18, borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Needs Attention</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#111827' }}>
              {([...data.memberProgress].sort((a: any, b: any) => a.completionRate - b.completionRate).slice(0, 3)).map((m: any) => (
                <li key={m.employeeId} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{m.name}</span> — {m.completionRate}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, marginBottom: 32 }}>
        {/* Progress Status Pie Chart */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Goal Progress Distribution</h3>
          <div style={{ height: 300, marginTop: 16 }}>
            {data.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {data.statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Member Progress Bar Chart */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Employee Completion Rates (%)</h3>
          <div style={{ height: 300, marginTop: 16 }}>
            {data.memberProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.memberProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" name="Completion %" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={emptyStateStyle}>No employee data available.</div>
            )}
          </div>
        </section>
      </div>

      {/* Member Table */}
      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Team Member Details</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Employee</th>
              <th style={thStyle}>Employee ID</th>
              <th style={thStyle}>Total Goals</th>
              <th style={thStyle}>Completion Rate</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.memberProgress.map((member: any) => (
              <tr key={member.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{member.name}</td>
                <td style={tdStyle}>{member.employeeId}</td>
                <td style={tdStyle}>{member.goalsCount}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${member.completionRate}%`, height: '100%', background: member.completionRate > 70 ? '#10b981' : member.completionRate > 30 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{member.completionRate}%</span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      onClick={() => {
                        // This UI enhancement provides a lightweight, client-only feature.
                        // For full details (goals/check-ins), wire a dedicated endpoint.
                        window.alert(`${member.name} (${member.employeeId})\n\nGoals: ${member.goalsCount}\nCompletion Rate: ${member.completionRate}%`);
                      }}
                    >
                      View Details
                    </button>
                    {member.completionRate >= 80 && (
                      <span style={{ padding: '3px 8px', borderRadius: 999, background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12, fontWeight: 700 }}>
                        Top Performer
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Card({ title, value, color }: { title: string; value: any; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 20, borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? 0}</div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: 24,
  borderRadius: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: '#111827',
};

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 12,
  color: '#64748b',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 14,
  color: '#111827',
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
