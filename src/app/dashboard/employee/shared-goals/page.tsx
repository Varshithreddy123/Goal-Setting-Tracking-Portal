"use client";

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';

type Goal = {
  _id: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  deadline: string;
  isShared: boolean;
  parentGoalId: string | null;
};

export default function EmployeeSharedGoalsPage() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSharedGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals/shared/employee');
      const data = await res.json();
      if (res.ok) {
        setGoals(data.data as Goal[]);
      }
    } catch (err) {
      console.error('Failed to fetch shared goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedGoals();
  }, [fetchSharedGoals]);

  const updateWeightage = async (goalId: string, newWeight: number) => {
    setSaving(goalId);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightage: newWeight }),
      });
      if (res.ok) {
        showToast('Weightage updated successfully');
        fetchSharedGoals();
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'Failed to update weightage', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading shared goals...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>Shared Departmental Goals</h2>
        <p style={{ color: '#64748b' }}>These goals are pushed by your manager or admin. You can only adjust the weightage.</p>
      </div>

      {goals.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
          <p style={{ color: '#64748b' }}>No shared goals assigned to you yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {goals.map(goal => (
            <div key={goal._id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0 }}>{goal.title}</h3>
                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: 12, fontWeight: 700 }}>SHARED KPI</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>{goal.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Weightage (%)</label>
                  <input 
                    type="number" 
                    defaultValue={goal.weightage} 
                    onBlur={(e) => updateWeightage(goal._id, Number(e.target.value))}
                    disabled={saving === goal._id}
                    style={{ width: 80, padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center' }}
                  />
                  {saving === goal._id && <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>Saving...</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Thrust Area</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{goal.thrustArea} (Read-only)</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Target</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{goal.target} {goal.uomType} (Read-only)</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Deadline</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(goal.deadline).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
