"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  locked: boolean;
  approvalStatus: string;
  isShared?: boolean;
  parentGoalId?: string | null;
};

export default function CreateGoalsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thrustArea, setThrustArea] = useState('');
  const [uomType, setUomType] = useState('');
  const [target, setTarget] = useState('');
  const [weightage, setWeightage] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      if (res.ok) {
        setGoals(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch goals');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setThrustArea('');
    setUomType('');
    setTarget('');
    setWeightage('');
    setDeadline('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (goal: Goal) => {
    setTitle(goal.title);
    setDescription(goal.description);
    setThrustArea(goal.thrustArea);
    setUomType(goal.uomType);
    setTarget(goal.target.toString());
    setWeightage(goal.weightage.toString());
    setDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
    setEditingId(goal._id);
    setShowForm(true);
  };

  const saveGoal = async () => {
    setError(null);
    
    // Client-side validation
    if (!title || !description || !thrustArea || !uomType || !target || !weightage || !deadline) {
      showToast('Please fill in all required fields marked with *', 'error');
      return;
    }

    const weight = Number(weightage);
    if (isNaN(weight) || weight < 10) {
      showToast('Goal weightage must be at least 10%', 'error');
      return;
    }

    const payload = {
      title,
      description,
      thrustArea,
      uomType,
      target: Number(target),
      weightage: weight,
      deadline,
      employeeId: 'me', // handled by middleware/api
    };

    try {
      const url = editingId ? `/api/goals/${editingId}` : '/api/goals';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(editingId ? 'Goal updated' : 'Goal created');
        resetForm();
        fetchGoals();
      } else {
        showToast(data.error?.message || 'Failed to save goal', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Goal deleted');
        fetchGoals();
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'Failed to delete goal', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const submitGoals = async () => {
    if (!confirm('Submit these goals for approval? They will be locked for editing.')) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/goals/submit', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (res.ok) {
        showToast('Goals submitted successfully!');
        router.push('/dashboard/employee/goals');
      } else {
        showToast(data.error?.message || 'Failed to submit goals', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalWeightage = useMemo(() => {
    return goals.reduce((acc, g) => acc + g.weightage, 0);
  }, [goals]);

  const isSharedRecipient = (goal: Goal) => goal.isShared === true && !!goal.parentGoalId;
  const isLocked = goals.some(g => !isSharedRecipient(g) && g.locked);

  if (loading) return <div style={{ padding: 24 }}>Loading goals...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Goal Planning</h2>
        {!isLocked && goals.length < 8 && !showForm && (
          <button onClick={() => setShowForm(true)} className="button primary">
            + Add New Goal
          </button>
        )}
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>{error}</div>}

      {isLocked ? (
        <div style={{ padding: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 24 }}>
          <p style={{ color: '#0369a1', fontWeight: 500 }}>Your goals are locked and submitted for approval.</p>
          <button onClick={() => router.push('/dashboard/employee/goals')} className="button" style={{ marginTop: 12 }}>
            View Goals
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Weightage</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: totalWeightage === 100 ? 'green' : totalWeightage > 100 ? 'crimson' : '#111827' }}>
                  {totalWeightage}% / 100%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals Count</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{goals.length} / 8</div>
              </div>
            </div>
          </div>

          {showForm && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>{editingId ? 'Edit Goal' : 'New Goal'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Goal Title*</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Increase Q3 Revenue" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Description*</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, height: 80 }} placeholder="Detailed explanation..." />
                </div>
                <div>
                  <label style={labelStyle}>Thrust Area*</label>
                  <input value={thrustArea} onChange={e => setThrustArea(e.target.value)} style={inputStyle} placeholder="e.g. Revenue Growth" />
                </div>
                <div>
                  <label style={labelStyle}>UOM Type*</label>
                  <select value={uomType} onChange={e => setUomType(e.target.value)} style={inputStyle}>
                    <option value="">-- Select UoM --</option>
                    <option value="Numeric">Numeric</option>
                    <option value="%">%</option>
                    <option value="Timeline">Timeline</option>
                    <option value="Zero-based">Zero-based</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Target*</label>
                  <input type="number" value={target} onChange={e => setTarget(e.target.value)} style={inputStyle} placeholder="e.g. 500000" />
                </div>
                <div>
                  <label style={labelStyle}>Weightage (%)*</label>
                  <input type="number" value={weightage} onChange={e => setWeightage(e.target.value)} style={inputStyle} placeholder="Min 10" />
                </div>
                <div>
                  <label style={labelStyle}>Deadline*</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={saveGoal} className="button primary">
                  {editingId ? 'Update Goal' : 'Save Draft'}
                </button>
                <button onClick={resetForm} className="button">Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            {goals.map(goal => (
              <div key={goal._id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 20, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ margin: 0 }}>{goal.title}</h4>
                    <span style={{ fontSize: 12, padding: '2px 8px', background: '#f1f5f9', borderRadius: 12, color: '#475569' }}>{goal.weightage}%</span>
                    {isSharedRecipient(goal) && (
                      <span style={{ fontSize: 11, padding: '2px 8px', background: '#e0f2fe', borderRadius: 12, color: '#0369a1', fontWeight: 700 }}>SHARED KPI</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>{goal.description}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                    <span>Thrust Area: {goal.thrustArea}</span>
                    <span>Target: {goal.target} {goal.uomType}</span>
                    <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {isSharedRecipient(goal) ? (
                    <a href="/dashboard/employee/shared-goals" className="button small" style={{ textDecoration: 'none' }}>Adjust Weightage</a>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(goal)} className="button small">Edit</button>
                      <button onClick={() => deleteGoal(goal._id)} className="button small danger">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {goals.length > 0 && (
            <div style={{ marginTop: 32, borderTop: '1px solid #e2e8f0', paddingTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
              {totalWeightage !== 100 && (
                <span style={{ fontSize: 14, color: '#64748b' }}>Total weightage must be exactly 100% to submit.</span>
              )}
              <button 
                onClick={submitGoals} 
                className="button primary" 
                disabled={submitting || totalWeightage !== 100}
                style={{ padding: '12px 24px', fontSize: 16 }}
              >
                {submitting ? 'Submitting...' : 'Submit Goals for Approval'}
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .button {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .button:hover:not(:disabled) {
          background: #f8fafc;
        }
        .button.primary {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .button.primary:hover:not(:disabled) {
          background: #1f2937;
        }
        .button.danger {
          color: crimson;
          border-color: #fee2e2;
        }
        .button.danger:hover:not(:disabled) {
          background: #fee2e2;
        }
        .button.small {
          padding: 4px 12px;
          font-size: 13px;
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
