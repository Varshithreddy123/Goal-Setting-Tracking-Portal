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
  approvalStatus: string;
  managerComment?: string;
};

type Subordinate = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  goals: Goal[];
};

export default function ManagerApprovalsPage() {
  const { showToast } = useToast();
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [goalId: string]: string }>({});
  const [editDraft, setEditDraft] = useState<{ [goalId: string]: { target: number; weightage: number } }>({});

  const fetchSubordinates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manager/subordinates');
      const data = await res.json();
      if (res.ok) {
        setSubordinates(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch subordinates');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubordinates();
  }, [fetchSubordinates]);

  const updateGoalStatus = async (goalId: string, status: 'approved' | 'rejected') => {
    setProcessing(goalId);
    setError(null);
    try {
      const payload: any = {
        approvalStatus: status,
        managerComment: comment[goalId] || '',
      };

      // If manager edited target/weightage, include them in the payload
      if (editDraft[goalId]) {
        payload.target = editDraft[goalId].target;
        payload.weightage = editDraft[goalId].weightage;
      }

      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Goal ${status === 'approved' ? 'approved' : 'returned for rework'} successfully`);
        fetchSubordinates();
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'Failed to update goal', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleInlineEdit = (goalId: string, field: 'target' | 'weightage', value: string) => {
    const num = Number(value);
    setEditDraft(prev => ({
      ...prev,
      [goalId]: {
        ...(prev[goalId] || { 
          target: subordinates.flatMap(s => s.goals).find(g => g._id === goalId)?.target || 0,
          weightage: subordinates.flatMap(s => s.goals).find(g => g._id === goalId)?.weightage || 0
        }),
        [field]: num
      }
    }));
  };

  if (loading) return <div style={{ padding: 24 }}>Loading approvals...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>Goal Approvals</h2>
        <p style={{ color: '#64748b' }}>Review and approve goal plans submitted by your team.</p>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>{error}</div>}

      {subordinates.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ color: '#64748b', margin: 0 }}>No team members found under your management.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 32 }}>
          {subordinates.map(sub => (
          <div key={sub._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{sub.name}</h3>
                <span style={{ fontSize: 13, color: '#64748b' }}>{sub.employeeId} • {sub.department}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                {sub.goals.filter(g => g.approvalStatus === 'Submitted').length} Pending Review
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {sub.goals.length === 0 ? (
                <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic' }}>No goals submitted yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 24 }}>
                  {sub.goals.map(goal => (
                    <div key={goal._id} style={{ border: '1px solid #f1f5f9', borderRadius: 8, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h4 style={{ margin: 0 }}>{goal.title}</h4>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: 12, 
                          fontSize: 11, 
                          fontWeight: 700,
                          background: goal.approvalStatus === 'Approved' ? '#dcfce7' : goal.approvalStatus === 'Rejected' ? '#fee2e2' : '#fef9c3',
                          color: goal.approvalStatus === 'Approved' ? '#166534' : goal.approvalStatus === 'Rejected' ? '#991b1b' : '#854d0e'
                        }}>
                          {goal.approvalStatus.toUpperCase()}
                        </span>
                      </div>
                      
                      <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#475569' }}>{goal.description}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Weightage (%)</label>
                          {goal.approvalStatus === 'Submitted' ? (
                            <input 
                              type="number" 
                              defaultValue={goal.weightage} 
                              onChange={(e) => handleInlineEdit(goal._id, 'weightage', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                            />
                          ) : (
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{goal.weightage}%</div>
                          )}
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Target ({goal.uomType})</label>
                          {goal.approvalStatus === 'Submitted' ? (
                            <input 
                              type="number" 
                              defaultValue={goal.target} 
                              onChange={(e) => handleInlineEdit(goal._id, 'target', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                            />
                          ) : (
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{goal.target}</div>
                          )}
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Deadline</label>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(goal.deadline).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {goal.approvalStatus === 'Submitted' && (
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Manager Comment (Optional)</label>
                          <textarea 
                            value={comment[goal._id] || ''} 
                            onChange={e => setComment(prev => ({ ...prev, [goal._id]: e.target.value }))}
                            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 12, height: 60 }}
                            placeholder="Provide feedback..."
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => updateGoalStatus(goal._id, 'approved')} 
                              className="button success"
                              disabled={processing === goal._id}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updateGoalStatus(goal._id, 'rejected')} 
                              className="button danger"
                              disabled={processing === goal._id}
                            >
                              Return for Rework
                            </button>
                          </div>
                        </div>
                      )}

                      {(goal.approvalStatus === 'Approved' || goal.approvalStatus === 'Rejected') && goal.managerComment && (
                        <div style={{ fontSize: 13, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, color: '#475569' }}>
                          <strong>Comment:</strong> {goal.managerComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      )}

      <style jsx>{`
        .button {
          padding: 6px 16px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }
        .button.success {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .button.danger {
          color: crimson;
          border-color: #fee2e2;
        }
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}
