"use client";

import { useCallback, useEffect, useState } from 'react';

type Goal = {
  _id: string;
  title: string;
  target: number;
  uomType: string;
  approvalStatus: string;
};

type Checkin = {
  _id: string;
  goalId: string;
  quarter: string;
  plannedTarget: number;
  actualAchievement: number;
  progressStatus: string;
  employeeComment: string;
  managerComment?: string;
  createdAt: string;
};

export default function EmployeeCheckinsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [quarter, setQuarter] = useState('Q2 2024');
  const [plannedTarget, setPlannedTarget] = useState('');
  const [actualAchievement, setActualAchievement] = useState('');
  const [progressStatus, setProgressStatus] = useState('On Track');
  const [employeeComment, setEmployeeComment] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, checkinsRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/checkins')
      ]);
      
      const goalsData = await goalsRes.json();
      const checkinsData = await checkinsRes.json();
      
      if (goalsRes.ok && checkinsRes.ok) {
        // Only allow check-ins for approved goals
        setGoals(goalsData.data.filter((g: Goal) => g.approvalStatus === 'Approved'));
        setCheckins(checkinsData.data);
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

  const saveCheckin = async () => {
    if (!selectedGoalId || !plannedTarget || !actualAchievement) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoalId,
          quarter,
          plannedTarget: Number(plannedTarget),
          actualAchievement: Number(actualAchievement),
          progressStatus,
          employeeComment,
        }),
      });

      if (res.ok) {
        setPlannedTarget('');
        setActualAchievement('');
        setEmployeeComment('');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Failed to save check-in');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading check-ins...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>Quarterly Check-ins</h2>
        <p style={{ color: '#64748b' }}>Track your progress against approved goals for the current quarter.</p>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32 }}>
        {/* Check-in Form */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginBottom: 20 }}>New Check-in</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select Approved Goal*</label>
              <select 
                value={selectedGoalId} 
                onChange={e => setSelectedGoalId(e.target.value)} 
                style={inputStyle}
              >
                <option value="">-- Choose a Goal --</option>
                {goals.map(g => (
                  <option key={g._id} value={g._id}>{g.title}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Quarter*</label>
              <input value={quarter} onChange={e => setQuarter(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Planned Target*</label>
                <input 
                  type="number" 
                  value={plannedTarget} 
                  onChange={e => setPlannedTarget(e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Actual Achievement*</label>
                <input 
                  type="number" 
                  value={actualAchievement} 
                  onChange={e => setActualAchievement(e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Progress Status*</label>
              <select 
                aria-label="Progress Status"
                value={progressStatus} 
                onChange={e => setProgressStatus(e.target.value)} 
                style={inputStyle}
                title="Progress Status"
              >
                <option value="Not Started">Not Started</option>
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Comments</label>
              <textarea 
                value={employeeComment} 
                onChange={e => setEmployeeComment(e.target.value)} 
                style={{ ...inputStyle, height: 80 }} 
                placeholder="How is it going? Any blockers?"
              />
            </div>

            <button 
              onClick={saveCheckin} 
              className="button primary" 
              style={{ width: '100%' }}
              disabled={saving || goals.length === 0}
            >
              {saving ? 'Saving...' : 'Post Check-in'}
            </button>
          </div>
        </div>

        {/* Check-in History */}
        <div>
          <h3 style={{ marginBottom: 20 }}>Recent Check-ins</h3>
          {checkins.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No check-in history yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {checkins.map(ci => {
                const goal = goals.find(g => g._id === ci.goalId);
                return (
                  <div key={ci._id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 20, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{ci.quarter}</div>
                        <h4 style={{ margin: '4px 0' }}>{goal?.title || 'Unknown Goal'}</h4>
                      </div>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: 12, 
                        fontSize: 11, 
                        fontWeight: 700,
                        background: ci.progressStatus === 'Completed' ? '#dcfce7' : ci.progressStatus === 'Behind' ? '#fee2e2' : '#f1f5f9',
                        color: ci.progressStatus === 'Completed' ? '#166534' : ci.progressStatus === 'Behind' ? '#991b1b' : '#475569'
                      }}>
                        {ci.progressStatus.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>PLANNED</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{ci.plannedTarget}</div>
                      </div>
                      <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>ACTUAL</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{ci.actualAchievement}</div>
                      </div>
                    </div>

                    {ci.employeeComment && (
                      <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#475569' }}>
                        <strong>Comment:</strong> {ci.employeeComment}
                      </p>
                    )}

                    {ci.managerComment && (
                      <div style={{ padding: 10, background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
                        <strong>Manager Feedback:</strong> {ci.managerComment}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .button {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
        }
        .button.primary {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  outline: 'none',
};
