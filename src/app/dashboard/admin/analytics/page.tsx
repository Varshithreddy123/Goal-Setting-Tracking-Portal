"use client";

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
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
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [goalsData, setGoalsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const seedDemoData = async () => {
    if (!confirm('This will seed demo employees, managers, goals and check-ins. Continue?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Demo data seeded successfully!');
        fetchAnalytics();
      } else {
        showToast('Failed to seed: ' + data.error?.message, 'error');
      }
    } catch (err) {
      showToast('Network error while seeding', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, deptRes, goalsRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/analytics/departments'),
        fetch('/api/analytics/goals')
      ]);

      const ov = await ovRes.json();
      const dept = await deptRes.json();
      const goals = await goalsRes.json();

      if (ov.ok && dept.ok && goals.ok) {
        setOverview(ov.data);
        setDepartments(dept.data);
        setGoalsData(goals.data);
      } else {
        setError('Failed to fetch analytics data');
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

  if (loading) return <div style={{ padding: 24 }}>Loading Analytics Dashboard...</div>;
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;

  const pieData = [
    { name: 'Pending', value: overview?.Pending || 0 },
    { name: 'Submitted', value: overview?.Submitted || 0 },
    { name: 'Approved', value: overview?.Approved || 0 },
    { name: 'Rejected', value: overview?.Rejected || 0 },
  ].filter(d => d.value > 0);

  const exportReport = () => {
    window.open('/api/reporting/achievement', '_blank');
  };

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2>Enterprise Analytics</h2>
          <p style={{ color: '#64748b' }}>Organization-wide performance and goal tracking overview.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={exportReport} 
            className="button"
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            Export Achievement CSV
          </button>
          <button 
            onClick={seedDemoData} 
            disabled={seeding}
            className="button primary"
            style={{ padding: '10px 24px', fontSize: 14, background: '#059669', borderColor: '#059669' }}
          >
            {seeding ? 'Generating...' : 'Generate Demo Data'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <Card title="Total Employees" value={overview?.totalEmployees} color="#111827" />
        <Card title="Submitted Goals" value={overview?.Submitted} color="#3b82f6" />
        <Card title="Approved Goals" value={overview?.Approved} color="#10b981" />
        <Card title="Pending Review" value={overview?.Pending} color="#f59e0b" />
        <Card title="Rejected" value={overview?.Rejected} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Goal Distribution Pie Chart */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Goal Status Distribution</h3>
          <div style={{ height: 300 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={emptyStateStyle}>No goal data available</div>
            )}
          </div>
        </section>

        {/* Department Performance Bar Chart */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Department Approval Rates (%)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approvalRate" name="Approval Rate %" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Top Performers Table */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Top Performing Employees (Approved Goals)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Approved Goals</th>
                <th style={thStyle}>Total Weightage</th>
              </tr>
            </thead>
            <tbody>
              {goalsData?.topEmployees.map((emp: any) => (
                <tr key={emp.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}>{emp.employeeId}</td>
                  <td style={tdStyle}>{emp.approvedCount}</td>
                  <td style={tdStyle}>{emp.totalWeightage}%</td>
                </tr>
              ))}
              {goalsData?.topEmployees.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Department Stats */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Department Breakdown</h3>
          <div style={{ marginTop: 16 }}>
            {departments.map((dept: any) => (
              <div key={dept.department} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{dept.department}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{dept.employeeCount} Employees</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{dept.approvedGoals} / {dept.totalGoals}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Approved Goals</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  fontSize: 14,
  fontStyle: 'italic',
};
