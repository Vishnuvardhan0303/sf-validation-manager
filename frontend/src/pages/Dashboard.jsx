import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { rulesApi } from '../utils/api';
import RuleCard from '../components/RuleCard';

export default function Dashboard() {
  const { user, logout, instanceUrl } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [pendingChanges, setPendingChanges] = useState({}); // id -> { active }
  const [deploying, setDeploying] = useState(false);
  const [toast, setToast] = useState(null);
  const [fetched, setFetched] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rulesApi.getAll();
      setRules(res.data.rules);
      setPendingChanges({});
      setFetched(true);
      showToast(`Loaded ${res.data.rules.length} validation rules`, 'success');
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to fetch rules', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = async (id, newActive) => {
    // Optimistic update
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: newActive } : r));
    setPendingIds(prev => new Set([...prev, id]));
    setPendingChanges(prev => ({ ...prev, [id]: { active: newActive } }));
    try {
      await rulesApi.toggle(id, newActive);
      showToast(`Rule ${newActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (e) {
      // Revert
      setRules(prev => prev.map(r => r.id === id ? { ...r, active: !newActive } : r));
      setPendingChanges(prev => { const n = {...prev}; delete n[id]; return n; });
      showToast('Failed to update rule', 'error');
    } finally {
      setPendingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleEnableAll = async () => {
    const inactive = rules.filter(r => !r.active);
    if (inactive.length === 0) return showToast('All rules already active', 'info');
    const updates = inactive.map(r => ({ id: r.id, active: true }));
    setRules(prev => prev.map(r => ({ ...r, active: true })));
    setPendingChanges(prev => {
      const n = {...prev};
      updates.forEach(u => { n[u.id] = { active: true }; });
      return n;
    });
    try {
      await rulesApi.bulkUpdate(updates);
      showToast(`Activated ${updates.length} rules`, 'success');
    } catch (e) {
      showToast('Bulk update failed', 'error');
      fetchRules();
    }
  };

  const handleDisableAll = async () => {
    const active = rules.filter(r => r.active);
    if (active.length === 0) return showToast('All rules already inactive', 'info');
    const updates = active.map(r => ({ id: r.id, active: false }));
    setRules(prev => prev.map(r => ({ ...r, active: false })));
    setPendingChanges(prev => {
      const n = {...prev};
      updates.forEach(u => { n[u.id] = { active: false }; });
      return n;
    });
    try {
      await rulesApi.bulkUpdate(updates);
      showToast(`Deactivated ${updates.length} rules`, 'success');
    } catch (e) {
      showToast('Bulk update failed', 'error');
      fetchRules();
    }
  };

  const handleDeploy = async () => {
    const changes = Object.entries(pendingChanges).map(([id, v]) => ({ id, active: v.active }));
    if (changes.length === 0) return showToast('No pending changes to deploy', 'info');
    setDeploying(true);
    try {
      const res = await rulesApi.deploy(changes);
      if (res.data.rules) setRules(res.data.rules);
      setPendingChanges({});
      if (res.data.success) {
        showToast(`Deployed ${changes.length} change(s) to Salesforce ✓`, 'success');
      } else {
        showToast(`Deployed with ${res.data.errors.length} error(s)`, 'error');
      }
    } catch (e) {
      showToast('Deploy failed', 'error');
    } finally {
      setDeploying(false);
    }
  };

  const activeCount = rules.filter(r => r.active).length;
  const inactiveCount = rules.filter(r => !r.active).length;
  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'error' ? 'var(--red-dim)' :
                      toast.type === 'info' ? 'rgba(245,158,11,0.1)' : 'var(--green-dim)',
          borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' :
                       toast.type === 'info' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
          color: toast.type === 'error' ? 'var(--red)' :
                 toast.type === 'info' ? 'var(--amber)' : 'var(--green)',
        }} className="animate-fade-up">
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#hg)" />
              <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 30L20 24L26 30L32 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 style={styles.headerTitle}>Validation Manager</h1>
            {instanceUrl && (
              <a href={instanceUrl} target="_blank" rel="noreferrer" style={styles.instanceUrl} className="mono">
                {instanceUrl.replace('https://', '')} ↗
              </a>
            )}
          </div>
        </div>

        <div style={styles.headerRight}>
          {user && (
            <div style={styles.userChip}>
              <div style={styles.avatar}>{(user.displayName || user.username || 'U')[0].toUpperCase()}</div>
              <span style={styles.userName}>{user.displayName || user.username}</span>
            </div>
          )}
          <button onClick={logout} style={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats */}
        {fetched && (
          <div style={styles.statsRow} className="animate-fade-in">
            <StatCard label="Total Rules" value={rules.length} color="var(--accent)" />
            <StatCard label="Active" value={activeCount} color="var(--green)" />
            <StatCard label="Inactive" value={inactiveCount} color="var(--text-dim)" />
            <StatCard label="Pending" value={pendingCount} color={pendingCount > 0 ? 'var(--amber)' : 'var(--text-dim)'} />
          </div>
        )}

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <h2 style={styles.sectionTitle}>Account Validation Rules</h2>
            {fetched && <span style={styles.countBadge}>{rules.length}</span>}
          </div>
          <div style={styles.actions}>
            <button onClick={fetchRules} disabled={loading} style={styles.btnSecondary}>
              {loading ? <Spinner /> : <RefreshIcon />}
              {loading ? 'Loading…' : fetched ? 'Refresh' : 'Fetch Rules'}
            </button>
            {fetched && <>
              <button onClick={handleEnableAll} style={styles.btnGreen}>
                <span>◉</span> Enable All
              </button>
              <button onClick={handleDisableAll} style={styles.btnRed}>
                <span>◎</span> Disable All
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying || pendingCount === 0}
                style={{
                  ...styles.btnDeploy,
                  opacity: (deploying || pendingCount === 0) ? 0.5 : 1,
                }}
              >
                {deploying ? <Spinner /> : <DeployIcon />}
                {deploying ? 'Deploying…' : `Deploy${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
              </button>
            </>}
          </div>
        </div>

        {/* Rules grid */}
        {!fetched && !loading && (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No rules loaded yet</p>
            <p style={styles.emptySub}>Click "Fetch Rules" to retrieve Account validation rules from your Salesforce org</p>
          </div>
        )}

        {loading && (
          <div style={styles.loadingGrid}>
            {[1,2,3,4].map(i => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        )}

        {!loading && fetched && rules.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No validation rules found</p>
            <p style={styles.emptySub}>Create validation rules on the Account object in your Salesforce org first</p>
          </div>
        )}

        {!loading && rules.length > 0 && (
          <div style={styles.grid} className="animate-fade-in">
            {rules.map((rule, i) => (
              <div key={rule.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fade-up">
                <RuleCard
                  rule={rule}
                  onToggle={handleToggle}
                  pending={pendingIds.has(rule.id)}
                  changed={!!pendingChanges[rule.id]}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function Spinner() {
  return <span style={styles.spinner} />;
}
function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
}
function DeployIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/></svg>;
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  toast: {
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    padding: '12px 20px', borderRadius: 10, border: '1px solid',
    fontSize: '0.87rem', fontWeight: 600,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-2)',
    backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  logo: {
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' },
  instanceUrl: {
    fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none',
    fontWeight: 500,
    '&:hover': { textDecoration: 'underline' },
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-3)', borderRadius: 8, padding: '6px 12px',
    border: '1px solid var(--border)',
  },
  avatar: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  userName: { fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 },
  logoutBtn: {
    padding: '7px 14px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'border-color 0.2s, color 0.2s',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12, marginBottom: 28,
  },
  statCard: {
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  statValue: { fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em' },
  statLabel: { fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12, marginBottom: 20,
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700 },
  countBadge: {
    background: 'var(--bg-4)', color: 'var(--text-muted)',
    fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px',
    borderRadius: 6,
  },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', background: 'var(--bg-3)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: '0.83rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s',
  },
  btnGreen: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', background: 'var(--green-dim)',
    border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8,
    color: 'var(--green)', fontSize: '0.83rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnRed: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', background: 'var(--red-dim)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
    color: 'var(--red)', fontSize: '0.83rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDeploy: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', borderRadius: 8,
    color: '#fff', fontSize: '0.83rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
    transition: 'opacity 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  },
  skeleton: {
    height: 130, borderRadius: 12,
    background: 'linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease infinite',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  },
  empty: {
    textAlign: 'center', padding: '64px 24px',
    border: '1px dashed var(--border)', borderRadius: 16,
  },
  emptyTitle: { fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 },
  emptySub: { color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.6 },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'currentColor', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};
