"use client";

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';

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

type User = {
  employeeId: string;
  name: string;
  department: string;
};

type Checkin = {
  _id: string;
  goalId: string;
  quarter: string;
  plannedTarget: number;
  actualAchievement: number;
  progressStatus: string;
  employeeComment?: string;
  managerComment?: string;
};

export default function SharedKPIPage() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thrustArea, setThrustArea] = useState('');
  const [uomType, setUomType] = useState('Numeric');
  const [target, setTarget] = useState('');
  const [weightage, setWeightage] = useState('10');
  const [deadline, setDeadline] = useState('');

  // Update Form state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [quarter, setQuarter] = useState('Q2 2024');
  const [actualAchievement, setActualAchievement] = useState('');
  const [progressStatus, setProgressStatus] = useState('On Track');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, checkinsRes] = await Promise.all([
        fetch('/api/goals/shared/primary'),
        fetch('/api/checkins')
      ]);
      const usersRes = await fetch('/api/manager/subordinates');
      
      const goalsData = await goalsRes.json();
      const checkinsData = await checkinsRes.json();
      const usersData = await usersRes.json();
      
      if (goalsRes.ok && checkinsRes.ok && usersRes.ok) {
        setGoals(goalsData.data);
        setCheckins(checkinsData.data);
        setUsers(usersData.data);
      } else {
        showToast('Failed to fetch data', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleUser = (employeeId: string) => {
    setSelectedUsers(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0 || !title || !thrustArea || !target || !weightage || !deadline) {
      showToast('Please fill all required fields and select at least one team member', 'error');
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
        showToast('Shared KPI pushed to team');
        setSelectedUsers([]);
        setTitle('');
        setDescription('');
        setThrustArea('');
        setUomType('Numeric');
        setTarget('');
        setWeightage('10');
        setDeadline('');
        fetchData();
      } else {
        showToast(data.error?.message || 'Failed to push shared KPI', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAchievement = async () => {
    if (!selectedGoal || !actualAchievement) {
      showToast('Please select a goal and enter achievement', 'error');
      return;
    }

    setProcessing(selectedGoal._id);
    try {
      // Find if checkin already exists for this quarter
      const existingCheckin = checkins.find(c => c.goalId === selectedGoal._id && c.quarter === quarter);
      
      const res = await fetch(existingCheckin ? `/api/checkins/${existingCheckin._id}` : '/api/checkins', {
        method: existingCheckin ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoal._id,
          quarter,
          plannedTarget: selectedGoal.target, // Shared goals use the full target as planned
          actualAchievement: Number(actualAchievement),
          progressStatus,
          managerComment: 'Primary shared goal update',
        }),
      });

      if (res.ok) {
        showToast('Achievement updated and synced across all employees!');
        setActualAchievement('');
        setSelectedGoal(null);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'Failed to update achievement', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading shared goals...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2>Shared Departmental KPIs</h2>
        <p style={{ color: '#64748b' }}>Manage achievements for shared goals. Updates here will automatically sync to all recipient employee goal sheets.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: 20 }}>Push Shared KPI</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={labelStyle}>Goal Title*
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>Description
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, height: 72 }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>Thrust Area*
                <input value={thrustArea} onChange={e => setThrustArea(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>UoM*
                <select value={uomType} onChange={e => setUomType(e.target.value)} style={inputStyle}>
                  <option value="Numeric">Numeric</option>
                  <option value="%">%</option>
                  <option value="Timeline">Timeline</option>
                  <option value="Zero-based">Zero-based</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <h3 style={{ marginBottom: 20 }}>Select Team Members ({selectedUsers.length})</h3>
          <div style={{ maxHeight: 330, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
            {users.length === 0 ? (
              <div style={{ padding: 24, color: '#64748b' }}>No team members found.</div>
            ) : users.map(user => (
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
                  <div style={{ fontSize: 12, color: '#64748b' }}>{user.employeeId} - {user.department}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleShare}
            disabled={submitting}
            style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 8, background: '#111827', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {submitting ? 'Pushing...' : 'Push KPI to Team'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* Goals List */}
        <div>
          <h3 style={{ marginBottom: 20 }}>Active Shared Goals</h3>
          {goals.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
              No shared goals found.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {goals.map(goal => {
                const latestCheckin = checkins
                  .filter(c => c.goalId === goal._id)
                  .sort((a, b) => b.quarter.localeCompare(a.quarter))[0];

                return (
                  <div 
                    key={goal._id} 
                    style={{ 
                      background: '#fff', 
                      padding: 20, 
                      borderRadius: 12, 
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      borderColor: selectedGoal?._id === goal._id ? '#2563eb' : '#e2e8f0',
                      boxShadow: selectedGoal?._id === goal._id ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none'
                    }}
                    onClick={() => {
                      setSelectedGoal(goal);
                      if (latestCheckin) {
                        setActualAchievement(latestCheckin.actualAchievement.toString());
                        setProgressStatus(latestCheckin.progressStatus);
                      } else {
                        setActualAchievement('');
                        setProgressStatus('On Track');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: 4 }}>{goal.thrustArea}</div>
                        <h4 style={{ margin: 0, fontSize: 16 }}>{goal.title}</h4>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Target</div>
                        <div style={{ fontWeight: 700 }}>{goal.target} {goal.uomType}</div>
                      </div>
                    </div>
                    
                    {latestCheckin && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Latest:</span> <strong>{latestCheckin.actualAchievement}</strong> ({latestCheckin.quarter})
                        </div>
                        <div style={{ 
                          fontSize: 11, 
                          padding: '2px 8px', 
                          borderRadius: 12, 
                          background: latestCheckin.progressStatus === 'Completed' ? '#dcfce7' : '#fef9c3',
                          color: latestCheckin.progressStatus === 'Completed' ? '#166534' : '#854d0e',
                          fontWeight: 600
                        }}>
                          {latestCheckin.progressStatus}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievement Update Form */}
        <div>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', position: 'sticky', top: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Update Achievement</h3>
            {!selectedGoal ? (
              <p style={{ color: '#64748b', fontSize: 14 }}>Select a goal from the list to update its achievement.</p>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Selected Goal</label>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedGoal.title}</div>
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
                  <label style={labelStyle}>Actual Achievement ({selectedGoal.uomType})</label>
                  <input 
                    type="number" 
                    value={actualAchievement} 
                    onChange={e => setActualAchievement(e.target.value)} 
                    style={inputStyle} 
                    placeholder={`Enter value (Target: ${selectedGoal.target})`}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Progress Status</label>
                  <select value={progressStatus} onChange={e => setProgressStatus(e.target.value)} style={inputStyle}>
                    <option value="Not Started">Not Started</option>
                    <option value="On Track">On Track</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <button 
                  onClick={handleUpdateAchievement}
                  disabled={processing === selectedGoal._id}
                  style={{ 
                    marginTop: 8,
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: 8, 
                    background: '#111827', 
                    color: '#fff', 
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {processing === selectedGoal._id ? 'Syncing...' : 'Update & Sync Achievement'}
                </button>
                <button 
                  onClick={() => setSelectedGoal(null)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: 8, 
                    background: 'transparent', 
                    color: '#64748b', 
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  marginTop: 6,
  fontSize: 14,
};
