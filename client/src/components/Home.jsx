import { useMemo } from 'react';
import { useEngagement } from '../store/EngagementContext.jsx';
import { computeStats } from '../lib/stats.js';
import { healthStyle } from '../lib/styleHelpers.js';
import { fmtUpdated } from '../lib/dates.js';

export default function Home() {
  const app = useEngagement();
  const { projects, dueSoonDays } = app;

  const cards = useMemo(() => (projects || []).map(p => {
    const s = computeStats(p, dueSoonDays);
    return {
      id: p.id, name: p.name, phase: p.phase,
      clientLine: [p.client, p.em].filter(Boolean).join(' · ') || 'No client set',
      cPctStr: s.overallStr, barW: s.overall + '%', breakdown: s.overallBreakdown,
      blocked: s.cBlk + s.pBlk, overdue: s.overdueCount, tasksActive: s.pIp,
      ucTotal: s.ucTotal, health: s.health, updated: fmtUpdated(p.updatedAt),
    };
  }), [projects, dueSoonDays]);

  const home = {
    empty: (projects || []).length === 0,
    count: (projects || []).length,
    blocked: cards.reduce((a, c) => a + c.blocked, 0),
    overdue: cards.reduce((a, c) => a + c.overdue, 0),
    tasksActive: cards.reduce((a, c) => a + c.tasksActive, 0),
    atRisk: cards.filter(c => c.health !== 'On track').length,
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 48px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000', paddingBottom: 22 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666' }}>Code and Theory · Engagement Management</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 350, fontSize: 60, lineHeight: 0.98, letterSpacing: '-0.03em', margin: '14px 0 0' }}>The Master Book</h1>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 20, color: '#3e3e3e', marginTop: 8, maxWidth: 680 }}>
            One home for every client engagement. Each project tracks health at a glance, use cases and their KPIs, a color-coded delivery timeline, and the full EM checklist. Spin up a new one from the template or import a workbook.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={app.goWeek} style={btnOutline}>My Week ↗</button>
          <button title="Rebuild a project from a filled-in copy of the master template workbook" style={btnGhost} onClick={() => app.importXlsxRef.current && app.importXlsxRef.current.click()}>Import workbook</button>
          <button style={btnGhost} onClick={() => app.importRef.current && app.importRef.current.click()}>Import backup</button>
          <button style={btnGhost} onClick={app.exportAll}>Export all</button>
          <button style={btnSolid} onClick={app.openNew}>+ New project</button>
          <button onClick={app.openHelp} title="How to use Engagement OS" style={helpBtn}>?</button>
        </div>
      </div>

      <input type="file" accept="application/json" ref={app.importRef} style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) app.importBackupFile(f); e.target.value = ''; }} />
      <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ref={app.importXlsxRef} style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) app.importWorkbookFile(f); e.target.value = ''; }} />

      <div style={{ display: 'flex', gap: 0, marginTop: 26, border: '1px solid rgba(0,0,0,0.12)' }}>
        <StatCell label="Active engagements" value={home.count} />
        <StatCell label="At risk" value={home.atRisk} />
        <StatCell label="Blocked" value={home.blocked} sub="items + tasks" />
        <StatCell label="Overdue" value={home.overdue} sub="items + tasks" />
        <StatCell label="Tasks in progress" value={home.tasksActive} last />
      </div>

      {home.empty && (
        <div style={{ marginTop: 60, border: '1px dashed rgba(0,0,0,0.3)', padding: 64, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 350 }}>No projects yet</div>
          <div style={{ color: '#666', fontSize: 14, marginTop: 10, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Create your first engagement from the template. It comes pre-loaded with the full 172-item EM checklist, phased project plan, RACI, use-case menu and the value-realization framework.
          </div>
          <button style={{ ...btnSolid, marginTop: 24, padding: '13px 26px' }} onClick={app.openNew}>+ New project</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 18, marginTop: 34 }}>
        {cards.map(p => (
          <ProjectCard key={p.id} p={p} app={app} />
        ))}
      </div>

      <div style={{ marginTop: 80, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', fontVariant: 'small-caps' }}>Code and Theory</div>
        <div style={{ fontSize: 11, color: '#999' }}>Data is saved in this browser. Use Export for backup or to move between devices.</div>
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, last }) {
  return (
    <div style={{ flex: 1, padding: '18px 22px', borderRight: last ? undefined : '1px solid rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 350, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProjectCard({ p, app }) {
  return (
    <div
      onClick={() => app.openProject(p.id)}
      style={{ border: '1px solid #000', padding: 0, cursor: 'pointer', background: '#fff', transition: 'transform 0.12s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '6px 6px 0 #000'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666' }}>{p.phase}</div>
          <div style={healthStyle(p.health)}>{p.health}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 27, fontWeight: 350, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 12 }}>{p.name}</div>
        <div style={{ fontSize: 13, color: '#3e3e3e', marginTop: 4 }}>{p.clientLine}</div>
      </div>
      <div style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#666' }} title={p.breakdown}>
          <span>Overall progress</span><span style={{ color: '#000', fontWeight: 700 }}>{p.cPctStr}</span>
        </div>
        <div style={{ height: 8, background: '#ededed', marginTop: 8 }}>
          <div style={{ height: 8, background: '#000', width: p.barW }} />
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
          <MiniStat value={p.blocked} label="Blocked" />
          <MiniStat value={p.overdue} label="Overdue" />
          <MiniStat value={p.tasksActive} label="Tasks active" />
          <MiniStat value={p.ucTotal} label="Use cases" />
        </div>
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <div style={{ flex: 1, padding: 9, textAlign: 'center', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>{p.updated}</div>
        <button onClick={(e) => { e.stopPropagation(); app.dupProject(p.id); }} style={cardBtn}>Duplicate</button>
        <button onClick={(e) => { e.stopPropagation(); app.delProject(p.id); }} style={cardBtn}>Delete</button>
      </div>
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 350 }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>{label}</div>
    </div>
  );
}

const btnBase = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', cursor: 'pointer' };
const btnOutline = { ...btnBase, border: '1px solid #000', background: '#fff', color: '#000' };
const btnGhost = { ...btnBase, border: '1px solid rgba(0,0,0,0.25)', background: '#fff', color: '#000' };
const btnSolid = { ...btnBase, padding: '12px 20px', border: '1px solid #000', background: '#000', color: '#fff' };
const helpBtn = { width: 40, height: 40, flexShrink: 0, border: '1px solid rgba(0,0,0,0.25)', background: '#fff', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: 18 };
const cardBtn = { padding: '9px 14px', border: 0, borderLeft: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#000', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' };
