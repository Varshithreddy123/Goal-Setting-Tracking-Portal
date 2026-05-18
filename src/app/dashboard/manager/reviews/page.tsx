"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';

type Goal = {
  _id: string;
  title: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  deadline: string;
  approvalStatus: string;
};

type Checkin = {
  _id: string;
  goalId: string;
  quarter: string;
  plannedTarget: number;
  actualAchievement: number;
  progressStatus: 'Not Started' | 'On Track' | 'Completed';
  employeeComment?: string;
  managerComment?: string;
  computedScore?: number;
};

type Subordinate = {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  goals: Goal[];
};

type ReviewRow = {
  member: Subordinate;
  goal: Goal;
  checkin?: Checkin;
};

const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];

export default function QuarterlyReviewsPage() {
  const { showToast } = useToast();
  const [team, setTeam] = useState<Subordinate[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [quarter, setQuarter] = useState('Q2 2024');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [teamRes, checkinsRes] = await Promise.all([
        fetch('/api/manager/subordinates'),
        fetch('/api/checkins'),
      ]);

      const teamData = await teamRes.json();
      const checkinsData = await checkinsRes.json();

      if (!teamRes.ok || !checkinsRes.ok) {
        setError(teamData.error?.message || checkinsData.error?.message || 'Failed to load review data');
        return;
      }

      setTeam(teamData.data || []);
      setCheckins(checkinsData.data || []);
    } catch {
      setError('Network error while loading review data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = useMemo<ReviewRow[]>(() => {
    return team.flatMap((member) =>
      (member.goals || [])
        .filter((goal) => goal.approvalStatus === 'Approved')
        .map((goal) => {
          const goalCheckins = checkins
            .filter((checkin) => checkin.goalId === goal._id && checkin.quarter === quarter)
            .sort((a, b) => String(b._id).localeCompare(String(a._id)));

          return { member, goal, checkin: goalCheckins[0] };
        })
    );
  }, [team, checkins, quarter]);

  const completedReviews = rows.filter((row) => row.checkin?.managerComment?.trim()).length;
  const pendingReviews = rows.filter((row) => row.checkin && !row.checkin.managerComment?.trim()).length;
  const noCheckin = rows.filter((row) => !row.checkin).length;

  const saveComment = async (checkin: Checkin) => {
    const comment = drafts[checkin._id] ?? checkin.managerComment ?? '';
    if (!comment.trim()) {
      showToast('Please enter a review comment before saving', 'error');
      return;
    }

    setSaving(checkin._id);
    try {
      const res = await fetch(`/api/checkins/${checkin._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerComment: comment, progressStatus: checkin.progressStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Review comment saved');
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[checkin._id];
          return next;
        });
        fetchData();
      } else {
        showToast(data.error?.message || 'Failed to save review comment', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading quarterly reviews...</div>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Quarterly Performance Reviews</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Review planned vs actual achievement and document L1 check-in feedback.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} style={selectStyle}>
            {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <button onClick={fetchData} className="button">Refresh</button>
        </div>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Approved Goals" value={rows.length} />
        <MetricCard label="Completed Reviews" value={completedReviews} tone="success" />
        <MetricCard label="Pending Comments" value={pendingReviews} tone="warning" />
        <MetricCard label="No Check-in" value={noCheckin} tone="danger" />
      </div>

      {rows.length === 0 ? (
        <div style={{ marginTop: 32, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 8, border: '2px dashed #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>No approved goals to review</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Quarterly reviews will appear after team goals are approved.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {rows.map(({ member, goal, checkin }) => {
            const draftValue = checkin ? drafts[checkin._id] ?? checkin.managerComment ?? '' : '';
            const achievementPct = checkin && checkin.plannedTarget
              ? Math.round((checkin.actualAchievement / checkin.plannedTarget) * 100)
              : null;

            return (
              <section key={`${member.employeeId}-${goal._id}`} style={reviewCardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>{member.department}</div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 18 }}>{member.name}</h3>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{member.employeeId}</div>

                    <h4 style={{ margin: '0 0 6px 0' }}>{goal.title}</h4>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>{goal.thrustArea}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Info label="Target" value={`${goal.target} ${goal.uomType}`} />
                      <Info label="Weightage" value={`${goal.weightage}%`} />
                      <Info label="Deadline" value={new Date(goal.deadline).toLocaleDateString()} />
                      <Info label="Status" value="Approved" />
                    </div>
                  </div>

                  <div>
                    {checkin ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                          <Info label="Planned" value={checkin.plannedTarget} />
                          <Info label="Actual" value={checkin.actualAchievement} />
                          <Info label="Achievement" value={achievementPct === null ? 'N/A' : `${achievementPct}%`} />
                          <Info label="Progress" value={checkin.progressStatus} />
                        </div>

                        {checkin.employeeComment && (
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, marginBottom: 4 }}>Employee Comment</div>
                            <p style={{ margin: 0, color: '#334155', fontSize: 14 }}>{checkin.employeeComment}</p>
                          </div>
                        )}

                        <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 800, marginBottom: 6 }}>Manager Review Comment</label>
                        <textarea
                          value={draftValue}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [checkin._id]: e.target.value }))}
                          placeholder="Document the quarterly review discussion..."
                          style={textareaStyle}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 12 }}>
                          <StatusBadge done={Boolean(checkin.managerComment?.trim())} />
                          <button onClick={() => saveComment(checkin)} disabled={saving === checkin._id} className="button primary">
                            {saving === checkin._id ? 'Saving...' : 'Save Review'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ height: '100%', minHeight: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 24 }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0' }}>No check-in submitted for {quarter}</h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Ask the employee to submit planned vs actual achievement before review.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .button {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          font-weight: 700;
        }
        .button.primary {
          background: #111827;
          border-color: #111827;
          color: #fff;
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? '#166534' : tone === 'warning' ? '#92400e' : tone === 'danger' ? '#991b1b' : '#111827';

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ done }: { done: boolean }) {
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      background: done ? '#dcfce7' : '#fef3c7',
      color: done ? '#166534' : '#92400e',
    }}>
      {done ? 'Comment Saved' : 'Comment Pending'}
    </span>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  background: '#fff',
  fontWeight: 700,
};

const reviewCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 20,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 84,
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  padding: 10,
  fontSize: 14,
  resize: 'vertical',
};
