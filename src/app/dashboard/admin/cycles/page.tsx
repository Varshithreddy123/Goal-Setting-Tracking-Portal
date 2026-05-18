"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';

type CycleInfo = {
  phase: string;
  window: string;
  action: string;
  status: 'Open' | 'Closed' | 'Upcoming';
};

type CycleWindowOverride = {
  phase: string;
  isOpen: boolean;
  override: boolean;
};


export default function AdminCyclesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [overrides, setOverrides] = useState<CycleWindowOverride[]>([]);

  const now = new Date();

  // These windows are from the BRD Phase 2.3
  // NOTE: API expects phase keys: GOAL_SETTING | Q1 | Q2 | Q3 | Q4
  const cycles: CycleInfo[] = useMemo(
    () => [
      { phase: 'GOAL_SETTING', window: 'May', action: 'Goal Creation, Submission & Approval', status: 'Upcoming' },
      { phase: 'Q1', window: 'July', action: 'Progress Update — Planned vs. Actual', status: 'Upcoming' },
      { phase: 'Q2', window: 'October', action: 'Progress Update — Planned vs. Actual', status: 'Upcoming' },
      { phase: 'Q3', window: 'January', action: 'Progress Update — Planned vs. Actual', status: 'Upcoming' },
      { phase: 'Q4', window: 'March / April', action: 'Final Achievement Capture', status: 'Upcoming' },
    ],
    []
  );

  const enrichedCycles = useMemo(() => {
    const overrideMap = new Map<string, boolean>(overrides.map(o => [o.phase, o.isOpen]));
    const month = now.getMonth(); // 0-11

    return cycles.map((c) => {
      // If admin created an override record for this phase, it must be the source of truth.
      if (overrideMap.has(c.phase)) {
        const isOpen = Boolean(overrideMap.get(c.phase));
        return {
          ...c,
          status: isOpen ? 'Open' : 'Closed',
        };
      }

      // Otherwise keep simplified demo month-based behavior.
      let status: 'Open' | 'Closed' | 'Upcoming' = 'Upcoming';
      if (c.window === 'May' && month === 4) status = 'Open';
      else if (c.window === 'July' && month === 6) status = 'Open';
      else if (c.window === 'October' && month === 9) status = 'Open';
      else if (c.window === 'January' && month === 0) status = 'Open';
      else if (c.window === 'March / April' && (month === 2 || month === 3)) status = 'Open';
      else if (
        (c.window === 'May' && month > 4) ||
        (c.window === 'July' && month > 6) ||
        (c.window === 'October' && month > 9) ||
        (c.window === 'January' && month > 0) ||
        (c.window === 'March / April' && month > 3)
      ) {
        status = 'Closed';
      }

      return { ...c, status };
    });
  }, [cycles, overrides, now]);



  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cycles/override');
      const data = await res.json();
      if (res.ok) setOverrides(data.data || []);
      else showToast(data.error?.message || 'Failed to fetch overrides', 'error');
    } catch {
      showToast('Network error while fetching overrides', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const handleToggleOverride = async (phase: string) => {
    // If an override exists, toggle it. Otherwise set it open.
    const current = overrides.find(o => o.phase === phase);
    const isOpen = current ? !current.isOpen : true;

    setLoading(true);
    try {
      const res = await fetch('/api/cycles/override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, isOpen }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Cycle override updated: ${phase} is now ${isOpen ? 'OPEN' : 'CLOSED'}.`, 'success');
        await fetchOverrides();
      } else {
        showToast(data.error?.message || 'Failed to update cycle override', 'error');
      }
    } catch {
      showToast('Network error while updating override', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2>Cycle Management</h2>
        <p style={{ color: '#64748b' }}>Configure and oversee the quarterly goal-setting and achievement windows.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Phase / Period</th>
              <th style={thStyle}>Window</th>
              <th style={thStyle}>Action Required</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Governance</th>
            </tr>
          </thead>
          <tbody>
            {enrichedCycles.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}><strong>{c.phase}</strong></td>
                <td style={tdStyle}>{c.window}</td>
                <td style={tdStyle}>{c.action}</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: 12, 
                    fontSize: 12, 
                    fontWeight: 600,
                    background: c.status === 'Open' ? '#dcfce7' : c.status === 'Closed' ? '#fee2e2' : '#f1f5f9',
                    color: c.status === 'Open' ? '#166534' : c.status === 'Closed' ? '#991b1b' : '#475569'
                  }}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button 
                    onClick={() => handleToggleOverride(c.phase)}
                    className="button" 
                    disabled={loading}
                    style={{ fontSize: 12, padding: '4px 10px', opacity: loading ? 0.7 : 1 }}
                  >
                    Manage Window
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Governance Rules</h3>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
            <li>Goals must be locked after the <strong>May</strong> window closes.</li>
            <li>Achievement data is only editable during the 15-day window of each quarter.</li>
            <li>Admins can unlock individual goal sheets for corrections if required.</li>
            <li>Audit logs capture all modifications made after the lock date.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Cycle Configuration</h3>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
            Current System Time: <strong>{now.toDateString()}</strong>
          </p>
          <button className="button primary">
            Sync with Org Calendar
          </button>
        </section>
      </div>

      <style jsx>{`
        .button {
          padding: 8px 16px;
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
      `}</style>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: 12,
  color: '#64748b',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: 14,
  color: '#111827',
};

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: 24,
  borderRadius: 12,
};
