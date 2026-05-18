"use client";

import { useCallback, useEffect, useState } from 'react';

type Goal = {
  _id: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  deadline: string;
  locked: boolean;
  approvalStatus: string;
  managerComment?: string;
};

type Checkin = {
  goalId: string;
  actualAchievement: number;
  progressStatus: string;
  quarter: string;
};

export default function EmployeeGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateScore = (goal: Goal) => {
    const relevant = checkins.filter(c => c.goalId === goal._id);
    if (relevant.length === 0) return 0;
    
    // Use the latest check-in
    const latest = relevant[relevant.length - 1];
    
    if (goal.uomType === 'Zero-based') {
      return latest.actualAchievement === 0 ? 100 : 0;
    }
    if (goal.uomType === 'Timeline') {
      return latest.progressStatus === 'Completed' ? 100 : 0;
    }
    if (goal.target === 0) return 0;
    
    const score = (latest.actualAchievement / goal.target) * 100;
    return Math.min(Math.round(score), 100);
  };

  if (loading) return <div style={{ padding: 24 }}>Loading goals...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>My Goals</h2>
        <p style={{ color: '#64748b' }}>View your active and submitted goals with computed progress scores.</p>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>{error}</div>}

      {goals.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
          <p style={{ color: '#64748b' }}>No goals found. Start by creating your goal plan.</p>
          <a href="/dashboard/employee/create-goals" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline' }}>
            Go to Goal Planning
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {goals.map(goal => {
            const score = calculateScore(goal);
            return (
              <div key={goal._id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{goal.title}</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Weightage: {goal.weightage}%</span>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ 
                      padding: '6px 12px', 
                      borderRadius: 20, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #dbeafe'
                    }}>
                      SCORE: {score}%
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      borderRadius: 20, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      background: goal.approvalStatus === 'Approved' ? '#dcfce7' : goal.approvalStatus === 'Rejected' ? '#fee2e2' : '#fef9c3',
                      color: goal.approvalStatus === 'Approved' ? '#166534' : goal.approvalStatus === 'Rejected' ? '#991b1b' : '#854d0e'
                    }}>
                      {goal.approvalStatus}
                    </div>
                  </div>
                </div>

                <p style={{ margin: '0 0 16px 0', fontSize: 15, color: '#334155', lineHeight: 1.5 }}>{goal.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Thrust Area</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{goal.thrustArea}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Target</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{goal.target} {goal.uomType}</div>
                  </div>
                  {checkins.find(c => c.goalId === goal._id) && (
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Latest Achievement</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        {checkins.filter(c => c.goalId === goal._id).pop()?.actualAchievement}
                      </div>
                    </div>
                  )}
                </div>

                {goal.managerComment && (
                  <div style={{ marginTop: 16, padding: 12, borderLeft: '4px solid #e2e8f0', background: '#fdfdfd' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Manager Feedback:</div>
                    <p style={{ margin: 0, fontSize: 14, color: '#475569', fontStyle: 'italic' }}>"{goal.managerComment}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
