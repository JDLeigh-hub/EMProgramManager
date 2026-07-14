import { useMemo } from 'react';
import { useEngagement } from '../../store/EngagementContext.jsx';
import { kpiPct } from '../../lib/stats.js';
import { srcTagStyle, dueTagStyle, ucChipStyle } from '../../lib/styleHelpers.js';
import { fmt } from '../../lib/dates.js';

const LIM = 5;

export default function Dashboard({ proj, dash }) {
  const app = useEngagement();
  const { expandBlocked, expandDue } = app.ui;

  const blockedFull = useMemo(() => dash.blocked.map(b => ({ ...b, hasNotes: !!(b.notes && b.notes.trim()) })), [dash.blocked]);
  const dueFull = useMemo(() => dash.dueItems.map(d => ({ ...d, tag: d.overdue ? 'Overdue' : 'Due ' + fmt(d.due) })), [dash.dueItems]);
  const blockedShown = expandBlocked ? blockedFull : blockedFull.slice(0, LIM);
  const dueShown = expandDue ? dueFull : dueFull.slice(0, LIM);

  const chkTally = `${dash.cDone} of ${dash.cActive} done · ${dash.cBlk} blocked`;
  const planTally = `${dash.pDone} of ${dash.pTotal} done · ${dash.pBlk} blocked`;

  const ucValue = useMemo(() => (proj.useCases || []).map(u => {
    const ucl = (u.code || '').toLowerCase(), unm = (u.name || '').toLowerCase();
    const kps = (proj.kpis || []).filter(k => { const ref = (k.useCase || '').toLowerCase().trim(); return ref && (ref === ucl || (ucl && ref.includes(ucl)) || (unm && ref.includes(unm))); });
    const kpis = kps.map(k => {
      const pct = kpiPct(k); const shown = pct == null ? 0 : Math.max(0, Math.min(100, pct));
      return { name: k.name || k.code, line: (k.current || '—') + ' / ' + (k.target || '—') + (k.unit ? ' ' + k.unit : '') + (k.baseline ? '  (base ' + k.baseline + ')' : ''), pctStr: pct == null ? '—' : pct + '%', barW: shown + '%' };
    });
    return {
      code: u.code, name: u.name || '(unnamed use case)', status: u.status || 'Candidate', priority: u.priority || '—',
      target: u.target ? fmt(u.target) : '—', metric: u.metric || '', hasMetric: !!(u.metric && u.metric.trim()),
      kpis, hasKpis: kpis.length > 0, noKpis: kpis.length === 0,
    };
  }), [proj.useCases, proj.kpis]);

  return (
    <div className="rise-in">
      <div style={{ border: '1px solid #000', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 18px 10px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Overall progress</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 350, lineHeight: 1 }}>{dash.overallStr}</div>
        </div>
        <div style={{ height: 10, background: '#ededed', margin: '0 18px' }}><div style={{ height: 10, background: '#000', width: dash.overallStr }} /></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 18px 16px' }}>
          {dash.overallParts.map((c, i) => (
            <div key={i} style={{ border: '1px solid rgba(0,0,0,0.18)', padding: '5px 10px', fontSize: 11 }}>
              <span style={{ color: '#666' }}>{c.key}</span> <span style={{ fontWeight: 700 }}>{c.val}</span> <span style={{ color: '#999' }}>· wt {c.weight}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', border: '1px solid #000' }}>
        <KpiCell label="Health" value={dash.health} />
        <KpiCell label="Blocked" value={dash.blockedTotal} sub={`${dash.cBlk} items · ${dash.pBlk} tasks`} />
        <KpiCell label="Overdue" value={dash.overdueCount} />
        <KpiCell label="Tasks in progress" value={dash.pIp} sub={`of ${dash.pTotal} plan tasks`} />
        <KpiCell label="Plan complete" value={dash.pPctStr} />
        <KpiCell label="Avg KPI to target" value={dash.avgKpiStr} last />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 32 }}>
        <div>
          <SectionHead>Blocked — needs attention</SectionHead>
          {blockedFull.length === 0 && <div style={{ padding: '16px 0', color: '#999', fontSize: 13 }}>Nothing blocked. Keep it that way.</div>}
          {blockedShown.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ width: 8, height: 8, background: '#000', flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.35 }}><span style={srcTagStyle(b.src)}>{b.src}</span>{b.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{b.meta}</div>
                {b.hasNotes && <div style={{ fontSize: 11, color: '#3e3e3e', marginTop: 3, fontStyle: 'italic' }}>{b.notes}</div>}
              </div>
            </div>
          ))}
          {blockedFull.length > LIM && (
            <button onClick={app.toggleBlocked} style={showMoreBtn}>{expandBlocked ? 'Show less' : `Show all ${blockedFull.length} →`}</button>
          )}
        </div>
        <div>
          <SectionHead>Due this week &amp; overdue</SectionHead>
          {dueFull.length === 0 && <div style={{ padding: '16px 0', color: '#999', fontSize: 13 }}>Nothing due soon. Add due dates in the Checklist and Project Plan.</div>}
          {dueShown.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', alignItems: 'baseline' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.35 }}><span style={srcTagStyle(d.src)}>{d.src}</span>{d.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{d.meta}</div>
              </div>
              <div style={dueTagStyle(d.overdue)}>{d.tag}</div>
            </div>
          ))}
          {dueFull.length > LIM && (
            <button onClick={app.toggleDue} style={showMoreBtn}>{expandDue ? 'Show less' : `Show all ${dueFull.length} →`}</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 36 }}>
        <SummaryPanel title="Checklist" pctStr={dash.cPctStr} tally={chkTally} onView={() => app.goTab('checklist')} />
        <SummaryPanel title="Project plan" pctStr={dash.pPctStr} tally={planTally} onView={() => app.goTab('plan')} />
      </div>

      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #000', paddingBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#000', fontWeight: 700 }}>Use cases &amp; value</div>
          <button onClick={() => app.goTab('usecases')} style={linkBtn}>Manage →</button>
        </div>
        {ucValue.length === 0 && <div style={{ padding: '20px 0', color: '#999', fontSize: 13 }}>No use cases yet. Add or promote one in <b>Use Cases</b> — its value (linked KPIs and % to target) will surface here.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {ucValue.map((u, i) => (
            <div key={i} style={{ border: '1px solid rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#f7f7f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontWeight: 700, flexShrink: 0 }}>{u.code}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#666' }}>Priority {u.priority}</span>
                  <span style={{ fontSize: 11, color: '#666' }}>Launch {u.target}</span>
                  <span style={ucChipStyle(u.status)}>{u.status}</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {u.hasMetric && <div style={{ fontSize: 12, color: '#3e3e3e', marginBottom: 10 }}><span style={{ color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>Success metric</span> · {u.metric}</div>}
                {u.hasKpis && u.kpis.map((k, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ flex: '0 0 240px', fontSize: 12 }}>{k.name}</div>
                    <div style={{ flex: '0 0 180px', fontSize: 11, color: '#666' }}>{k.line}</div>
                    <div style={{ flex: 1, height: 8, background: '#ededed' }}><div style={{ height: 8, background: '#000', width: k.barW }} /></div>
                    <div style={{ flex: '0 0 44px', textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{k.pctStr}</div>
                  </div>
                ))}
                {u.noKpis && <div style={{ fontSize: 12, color: '#999' }}>No KPIs linked yet. Add one in <b>KPIs &amp; Value</b> and reference {u.code}.</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCell({ label, value, sub, last }) {
  return (
    <div style={{ padding: '18px 20px', borderRight: last ? undefined : '1px solid rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionHead({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: 8, fontWeight: 700 }}>{children}</div>;
}

function SummaryPanel({ title, pctStr, tally, onView }) {
  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.15)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>{title}</div>
        <button onClick={onView} style={linkBtn}>View all →</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 350 }}>{pctStr}</div>
        <div style={{ fontSize: 11, color: '#666' }}>{tally}</div>
      </div>
      <div style={{ height: 8, background: '#ededed', marginTop: 10 }}><div style={{ height: 8, background: '#000', width: pctStr }} /></div>
    </div>
  );
}

const linkBtn = { border: 0, background: 'none', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', cursor: 'pointer' };
const showMoreBtn = { border: 0, background: 'none', padding: '12px 0 0', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', fontWeight: 700 };
