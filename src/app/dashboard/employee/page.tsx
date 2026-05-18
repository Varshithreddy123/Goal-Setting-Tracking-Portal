"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Goal = {
  _id: string;
  weightage: number;
  approvalStatus: string;
  locked: boolean;
};

type Checkin = {
  _id: string;
  progressStatus: string;
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, checkinsRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/checkins')
      ]);
      const gData = await goalsRes.json();
      const cData = await checkinsRes.json();
      if (goalsRes.ok && checkinsRes.ok) {
        setGoals(gData.data);
        setCheckins(cData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalGoals = goals.length;
  const approvedGoals = goals.filter(g => g.approvalStatus === 'Approved').length;
  const completedGoals = checkins.filter(c => c.progressStatus === 'Completed').length;
  const totalWeightage = goals.reduce((acc, g) => acc + g.weightage, 0);
  const isSubmitted = goals.some(g => g.locked);

  if (loading) return <div style={{ padding: 24 }}>Loading Dashboard...</div>;

  const cards = [
    {
      title: 'Total Goals',
      value: totalGoals.toString().padStart(2, '0'),
      description: 'Goals in your current plan',
    },
    {
      title: 'Approved Goals',
      value: approvedGoals.toString().padStart(2, '0'),
      description: 'Ready for tracking',
    },
    {
      title: 'Completed',
      value: completedGoals.toString().padStart(2, '0'),
      description: 'Goals marked as completed',
    },
    {
      title: 'Total Weightage',
      value: `${totalWeightage}%`,
      description: 'Goal weightage sum (Target 100%)',
    },
    {
      title: 'Submission Status',
      value: isSubmitted ? 'Submitted' : 'Draft',
      description: isSubmitted ? 'Locked for review' : 'Still editable',
    },
    {
      title: 'Current Quarter',
      value: 'Q2',
      description: 'Active review cycle',
    },
  ];

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2>Welcome back!</h2>
        <p style={{ color: '#64748b' }}>Here's an overview of your performance goals and progress.</p>
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
          <h3 style={{ margin: '0 0 16px 0' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/employee/create-goals')} className="button primary">
              Manage Goal Plan
            </button>
            <button onClick={() => router.push('/dashboard/employee/checkins')} className="button">
              New Check-in
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0' }}>Performance Tip</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
            Ensure your total goal weightage adds up to exactly 100% before submitting for approval. 
            Regular check-ins help your manager stay updated on your achievements.
          </p>
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
