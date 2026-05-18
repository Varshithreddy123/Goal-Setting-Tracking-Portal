"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

type Goal = {
  _id: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  deadline: string;
  approvalStatus: string;
  isShared?: boolean;
  parentGoalId?: string | null;
};

type Subordinate = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  goals: Goal[];
};

type TeamGoal = Goal & {
  employeeId: string;
  employeeName: string;
  department: string;
};

export default function TeamGoalsPage() {
  const [team, setTeam] = useState<Subordinate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/manager/subordinates');
      const data = await res.json();

      if (res.ok) {
        setTeam(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to load team goals');
      }
    } catch {
      setError('Network error while loading team goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamGoals();
  }, [fetchTeamGoals]);

  const approvedGoals = useMemo<TeamGoal[]>(() => {
    return team
      .flatMap((member) =>
        (member.goals || [])
          .filter((goal) => goal.approvalStatus === 'Approved')
          .map((goal) => ({
            ...goal,
            employeeId: member.employeeId,
            employeeName: member.name,
            department: member.department,
          }))
      )
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [team]);

  const overdueCount = approvedGoals.filter((goal) => new Date(goal.deadline).getTime() < startOfToday()).length;
  const nearestGoal = approvedGoals[0];
  const totalWeightage = approvedGoals.reduce((sum, goal) => sum + (Number(goal.weightage) || 0), 0);

  if (loading) return <div style={{ padding: 24 }}>Loading team goals...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Team Goals Overview</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Approved team goals sorted by nearest deadline first.</p>
        </div>
        <button onClick={fetchTeamGoals} className="button">
          Refresh
        </button>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard label="Approved Goals" value={approvedGoals.length} />
        <SummaryCard label="Team Members" value={team.length} />
        <SummaryCard label="Overdue Deadlines" value={overdueCount} tone={overdueCount > 0 ? 'danger' : 'default'} />
        <SummaryCard label="Total Weightage" value={`${totalWeightage}%`} />
      </div>

      {nearestGoal && (
        <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Nearest Deadline</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#111827' }}>{nearestGoal.title}</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>{nearestGoal.employeeName} - {nearestGoal.department}</div>
            </div>
            <DeadlineBadge deadline={nearestGoal.deadline} />
          </div>
        </section>
      )}

      {approvedGoals.length === 0 ? (
        <div style={{ marginTop: 32, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 8, border: '2px dashed #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>No approved team goals yet</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Approved goals will appear here after L1 review.</p>
        </div>
      ) : (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>Deadline</th>
                <th style={thStyle}>Goal</th>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Thrust Area</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Weightage</th>
                <th style={thStyle}>Type</th>
              </tr>
            </thead>
            <tbody>
              {approvedGoals.map((goal) => (
                <tr key={goal._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}><DeadlineBadge deadline={goal.deadline} /></td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{goal.title}</div>
                    <div style={{ color: '#64748b', fontSize: 13, maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {goal.description}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700 }}>{goal.employeeName}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{goal.employeeId}</div>
                  </td>
                  <td style={tdStyle}>{goal.thrustArea}</td>
                  <td style={tdStyle}>{goal.target} {goal.uomType}</td>
                  <td style={tdStyle}>{goal.weightage}%</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: goal.isShared ? '#e0f2fe' : '#f1f5f9',
                      color: goal.isShared ? '#0369a1' : '#475569',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {goal.isShared ? 'Shared KPI' : 'Individual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <style jsx>{`
        .button {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          font-weight: 700;
          color: #111827;
        }
      `}</style>
    </main>
  );
}

function SummaryCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'danger' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: tone === 'danger' ? '#b91c1c' : '#111827' }}>{value}</div>
    </div>
  );
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const date = new Date(deadline);
  const days = Math.ceil((date.getTime() - startOfToday()) / 86400000);
  const overdue = days < 0;
  const dueSoon = days >= 0 && days <= 14;

  return (
    <div>
      <div style={{ fontWeight: 800, color: overdue ? '#b91c1c' : '#111827' }}>{date.toLocaleDateString()}</div>
      <div style={{
        display: 'inline-block',
        marginTop: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        background: overdue ? '#fee2e2' : dueSoon ? '#fef3c7' : '#dcfce7',
        color: overdue ? '#991b1b' : dueSoon ? '#92400e' : '#166534',
      }}>
        {overdue ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
      </div>
    </div>
  );
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 12,
  color: '#64748b',
  fontWeight: 800,
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '14px',
  fontSize: 14,
  color: '#334155',
  verticalAlign: 'top',
};
