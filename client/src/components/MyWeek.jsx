import { useMemo } from 'react';
import { useEngagement } from '../store/EngagementContext.jsx';
import { computeWeek } from '../lib/week.js';

export default function MyWeek() {
  const app = useEngagement();
  const { projects, me, ui } = app;
  const week = useMemo(() => computeWeek(projects || [], me, ui.weekOffset, ui.onlyMine), [projects, me, ui.weekOffset, ui.onlyMine]);

  const mineBtnStyle = {
    fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid #000', cursor: 'pointer',
    ...(ui.onlyMine ? { background: '#000', color: '#fff' } : { background: '#fff', color: '#000' }),
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000', paddingBottom: 20 }}>
        <div>
          <button onClick={app.goProjects} style={backLink}>← All projects</button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 350, fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em', margin: '8px 0 0' }}>My Week</h1>
          <div style={{ fontSize: 13, color: '#3e3e3e', marginTop: 6 }}>Everything due across every engagement, in one place. {week.rangeLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={app.openIntegrations} style={ghostSm}>Connect calendar</button>
          <button onClick={app.openIntegrations} style={ghostSm}>Connect Slack</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <button onClick={app.weekPrev} style={arrowBtn}>←</button>
          <button onClick={app.weekThis} style={thisWeekBtn}>This week</button>
          <button onClick={app.weekNext} style={arrowBtn}>→</button>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#666' }}>I am</span>
            <input
              defaultValue={me}
              onBlur={(e) => app.editMe(e.target.value)}
              placeholder="your name"
              style={{ fontSize: 12, padding: '6px 8px', border: '1px solid rgba(0,0,0,0.25)', width: 150 }}
            />
          </div>
          <button onClick={app.toggleOnlyMine} style={mineBtnStyle}>{ui.onlyMine ? '✓ Only mine' : 'Only mine'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, marginTop: 20, border: '1px solid #000' }}>
        <SummaryCell label="Due this week" value={week.counts.tasks} />
        <SummaryCell label="Overdue" value={week.counts.overdue} />
        <SummaryCell label="Across projects" value={week.counts.projects} last />
      </div>

      {week.hasOverdue && (
        <div style={{ marginTop: 24, border: '1px solid #000', background: '#000', color: '#fff' }}>
          <div style={{ padding: '8px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Overdue — clear these first</div>
          {week.overdue.map((o, i) => (
            <div key={i} onClick={() => app.openProjectTo(o.projId, o.tab)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{o.name}</div><div style={{ fontSize: 11, color: '#bbb' }}>{o.meta}</div></div>
              <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, background: '#fff', color: '#000', padding: '3px 8px' }}>{o.tag}</div>
            </div>
          ))}
        </div>
      )}

      {week.empty && (
        <div style={{ marginTop: 40, border: '1px dashed rgba(0,0,0,0.3)', padding: 56, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Nothing scheduled {week.emptyWhen}</div>
          <div style={{ color: '#666', fontSize: 13, marginTop: 8, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            This view pulls every checklist item, plan task and use-case target with a due date. Add due dates in your projects — or connect your calendar and Slack to fold in meetings and messages.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 0, marginTop: 24, border: '1px solid rgba(0,0,0,0.15)', borderRight: 0 }}>
        {week.days.map((d, i) => (
          <div key={i} style={{ borderRight: '1px solid rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(0,0,0,0.15)', background: d.isToday ? '#fafafa' : undefined }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: d.isToday ? '#000' : '#f4f4f4', color: d.isToday ? '#fff' : undefined }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{d.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{d.date}</div>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
              {d.items.map((it, j) => (
                <div key={j} onClick={() => app.openProjectTo(it.projId, it.tab)}
                  style={{ border: '1px solid rgba(0,0,0,0.15)', borderLeft: '3px solid #000', padding: '8px 9px', cursor: 'pointer', background: '#fff' }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{it.proj}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.3, marginTop: 3 }}>{it.name}</div>
                  <div style={it.tagStyle}>{it.tag}</div>
                </div>
              ))}
              {d.empty && <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCell({ label, value, last }) {
  return (
    <div style={{ flex: 1, padding: '16px 20px', borderRight: last ? undefined : '1px solid rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 350 }}>{value}</div>
    </div>
  );
}

const backLink = { border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666' };
const ghostSm = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '11px 15px', border: '1px solid rgba(0,0,0,0.25)', background: '#fff', color: '#000', cursor: 'pointer' };
const arrowBtn = { border: '1px solid rgba(0,0,0,0.25)', background: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: 13 };
const thisWeekBtn = { border: '1px solid rgba(0,0,0,0.25)', borderLeft: 0, borderRight: 0, background: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' };
