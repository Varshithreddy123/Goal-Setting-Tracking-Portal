"use client";

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';

type User = {
  employeeId: string;
  name: string;
  department: string;
};

type Goal = {
  _id: string;
  title: string;
  description?: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  deadline: string;
};

type Checkin = {
  _id: string;
  goalId: string;
  quarter: string;
  plannedTarget: number;
  actualAchievement: number;
  progressStatus: string;
};

export default function AdminSharedGoalsPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [primaryGoals, setPrimaryGoals] = useState<Goal[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Creation Form state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thrustArea, setThrustArea] = useState('');
  const [uomType, setUomType] = useState('Numeric');
  const [target, setTarget] = useState('');
  const [weightage, setWeightage] = useState('10');
  const [deadline, setDeadline] = useState('');

  // Management state
  const [selectedGoalForUpdate, setSelectedGoalForUpdate] = useState<Goal | null>(null);
  const [actualAchievement, setActualAchievement] = useState('');
  const [progressStatus, setProgressStatus] = useState('On Track');
  const [quarter, setQuarter] = useState('Q2 2024');

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, goalsRes, checkinsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/goals/shared/primary'),
        fetch('/api/checkins')
      ]);
      
      const usersData = await usersRes.json();
      const goalsData = await goalsRes.json();
      const checkinsData = await checkinsRes.json();

      if (usersRes.ok && goalsRes.ok && checkinsRes.ok) {
        setUsers(usersData.data.filter((u: any) => u.role === 'employee'));
        setPrimaryGoals(goalsData.data);
        setCheckins(checkinsData.data);
      }
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0 || !title || !target || !deadline) {
      showToast('Please fill all required fields and select at least one employee', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/goals/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: selectedUsers,
          title,
          description,
          thrustArea,
          uomType,
          target: Number(target),
          weightage: Number(weightage),
          deadline,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Shared goal pushed successfully!');
        setSelectedUsers([]);
        setTitle('');
        setDescription('');
        setTarget('');
        setDeadline('');
      } else {
        showToast(data.error?.message || 'Failed to share goal', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAchievement = async () => {
    if (!selectedGoalForUpdate || !actualAchievement) {
      showToast('Please select a goal and enter achievement', 'error');
      return;
    }

    try {
      const existingCheckin = checkins.find(c => c.goalId === selectedGoalForUpdate._id && c.quarter === quarter);
      
      const res = await fetch(existingCheckin ? `/api/checkins/${existingCheckin._id}` : '/api/checkins', {
        method: existingCheckin ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoalForUpdate._id,
          quarter,
          plannedTarget: selectedGoalForUpdate.target,
          actualAchievement: Number(actualAchievement),
          progressStatus,
          managerComment: 'Primary shared goal update (Admin)',
        }),
      });

      if (res.ok) {
        showToast('Achievement updated and synced!');
        setActualAchievement('');
        setSelectedGoalForUpdate(null);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'Failed to update', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>Push Shared Goals</h2>
        <p style={{ color: '#64748b' }}>Assign a departmental KPI to multiple employees at once.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: 20 }}>1. Goal Details</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <label style={labelStyle}>Goal Title*
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Annual Sales Target" />
            </label>
            <label style={labelStyle}>Description
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, height: 80 }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={labelStyle}>Thrust Area*
                <input value={thrustArea} onChange={e => setThrustArea(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>UoM Type*
                <select value={uomType} onChange={e => setUomType(e.target.value)} style={inputStyle}>
                  <option value="Numeric">Numeric</option>
                  <option value="%">%</option>
                  <option value="Timeline">Timeline</option>
                  <option value="Zero-based">Zero-based</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={labelStyle}>Target*
                <input type="number" value={target} onChange={e => setTarget(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>Default Weightage (%)*
                <input type="number" value={weightage} onChange={e => setWeightage(e.target.value)} style={inputStyle} />
              </label>
            </div>
            <label style={labelStyle}>Deadline*
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: 20 }}>2. Select Recipients ({selectedUsers.length})</h3>
          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
            {users.map(user => (
              <div 
                key={user.employeeId} 
                onClick={() => toggleUser(user.employeeId)}
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid #f1f5f9', 
                  cursor: 'pointer',
                  background: selectedUsers.includes(user.employeeId) ? '#f0f9ff' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <input type="checkbox" checked={selectedUsers.includes(user.employeeId)} readOnly />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{user.employeeId} • {user.department}</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleShare} 
            disabled={submitting}
            style={{ 
              marginTop: 24, 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              background: '#111827', 
              color: '#fff', 
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {submitting ? 'Pushing Goals...' : 'Push Shared Goal'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 48, paddingTop: 48, borderTop: '2px solid #e2e8f0' }}>
        <h2 style={{ marginBottom: 24 }}>Manage Existing Shared Goals</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
          <div>
            <h3 style={{ marginBottom: 20 }}>Active Shared Goals</h3>
            {primaryGoals.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
                No active shared goals.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {primaryGoals.map(goal => {
                  const latest = checkins
                    .filter(c => c.goalId === goal._id)
                    .sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
                  
                  return (
                    <div 
                      key={goal._id} 
                      onClick={() => {
                        setSelectedGoalForUpdate(goal);
                        if (latest) {
                          setActualAchievement(latest.actualAchievement.toString());
                          setProgressStatus(latest.progressStatus);
                        } else {
                          setActualAchievement('');
                          setProgressStatus('On Track');
                        }
                      }}
                      style={{ 
                        background: '#fff', 
                        padding: 20, 
                        borderRadius: 12, 
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        borderColor: selectedGoalForUpdate?._id === goal._id ? '#2563eb' : '#e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>{goal.thrustArea}</div>
                          <h4 style={{ margin: '4px 0' }}>{goal.title}</h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Target</div>
                          <div style={{ fontWeight: 700 }}>{goal.target} {goal.uomType}</div>
                        </div>
                      </div>
                      {latest && (
                        <div style={{ marginTop: 12, fontSize: 13, color: '#475569', display: 'flex', gap: 12 }}>
                          <span>Latest: <strong>{latest.actualAchievement}</strong></span>
                          <span style={{ color: latest.progressStatus === 'Completed' ? '#166534' : '#854d0e' }}>
                            ● {latest.progressStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', position: 'sticky', top: 24 }}>
              <h3 style={{ marginBottom: 20 }}>Update Shared Achievement</h3>
              {!selectedGoalForUpdate ? (
                <p style={{ color: '#64748b', fontSize: 14 }}>Select a goal from the list to update progress for all recipients.</p>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Selected Goal</label>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedGoalForUpdate.title}</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Quarter</label>
                    <select value={quarter} onChange={e => setQuarter(e.target.value)} style={inputStyle}>
                      <option value="Q1 2024">Q1 2024</option>
                      <option value="Q2 2024">Q2 2024</option>
                      <option value="Q3 2024">Q3 2024</option>
                      <option value="Q4 2024">Q4 2024</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Actual Achievement</label>
                    <input 
                      type="number" 
                      value={actualAchievement} 
                      onChange={e => setActualAchievement(e.target.value)} 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={progressStatus} onChange={e => setProgressStatus(e.target.value)} style={inputStyle}>
                      <option value="Not Started">Not Started</option>
                      <option value="On Track">On Track</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleUpdateAchievement}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      borderRadius: 8, 
                      background: '#111827', 
                      color: '#fff', 
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Update & Sync All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  marginTop: 4,
  fontSize: 14,
};
