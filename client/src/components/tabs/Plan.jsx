import { useMemo } from 'react';
import { useEngagement } from '../../store/EngagementContext.jsx';
import { statusStyle } from '../../lib/styleHelpers.js';
import { computeGantt } from '../../lib/gantt.js';

export default function Plan({ proj }) {
  const app = useEngagement();
  const tl = proj.timeline || app.defaultTimeline();
  const viewBy = app.ui.ganttViewBy || 'all';
  const gantt = useMemo(() => computeGantt(proj, viewBy), [proj, viewBy]);

  const planRows = useMemo(() => proj.plan.map(t => {
    let duration = '';
    if (t.start && t.end) { const d = Math.round((new Date(t.end) - new Date(t.start)) / 86400000); if (!isNaN(d)) duration = (d >= 0 ? d : 0); }
    return { ...t, duration };
  }), [proj.plan]);

  const bdLabel = (tl.businessDays !== false) ? 'Business days' : 'Calendar days';
  const bdBtnStyle = {
    fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 12px', border: '1px solid #000', cursor: 'pointer',
    ...((tl.businessDays !== false) ? { background: '#000', color: '#fff' } : { background: '#fff', color: '#000' }),
  };
  const hasUseCases = (proj.useCases || []).length > 0;

  return (
    <div className="rise-in">
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Project Plan</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 18, maxWidth: 720 }}>
        Set one engagement start date for the shared, one-time work (mobilization, access, kickoff), then a start date per use case. The timeline rolls everything up into four phases — Kickoff → Discovery → Implementation → Assessment — with each use case's work shown inside the phase it belongs to. Generate the timeline and it auto-updates as dates change. Bar fill shows progress pulled from the task detail below.
      </div>

      <div style={{ border: '1px solid #000', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', color: '#fff', padding: '8px 14px' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Timeline setup</div>
          <button onClick={app.genTimeline} style={genBtn}>Generate timeline ↓</button>
        </div>
        <div style={{ padding: '16px 14px' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <Label>Engagement start (one-time work)</Label>
              <input type="date" defaultValue={tl.engagementStart} onChange={(e) => app.editEngStart(e.target.value)} style={dateInput} />
            </div>
            <div>
              <Label>Schedule basis</Label>
              <button onClick={app.toggleBusinessDays} title="Toggle between counting only Mon–Fri or all calendar days" style={bdBtnStyle}>{bdLabel}</button>
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <Label>Stage durations (working plan, in days)</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tl.stages.map(s => (
                  <div key={s.key} style={{ border: '1px solid rgba(0,0,0,0.2)', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div><div style={{ fontSize: 11, fontWeight: 700 }}>{s.label}</div><div style={{ fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#999' }}>{s.scope === 'shared' ? 'One-time' : 'Per use case'}</div></div>
                    <input type="number" min="1" max="400" defaultValue={s.days} onChange={(e) => app.editStageDays(s.key, e.target.value)} style={{ fontSize: 12, padding: 4, border: '1px solid rgba(0,0,0,0.2)', width: 52, textAlign: 'right' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Label>Use-case start dates</Label>
            {hasUseCases ? (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(proj.useCases || []).map(u => (
                    <div key={u.id} style={{ border: '1px solid rgba(0,0,0,0.2)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, maxWidth: 220 }}>{u.name || u.code || 'Untitled use case'}</span>
                      <input type="date" defaultValue={(tl.ucStarts && tl.ucStarts[u.id]) || ''} onChange={(e) => app.editUcStart(u.id, e.target.value)} style={{ fontSize: 12, padding: '4px 6px', border: '1px solid rgba(0,0,0,0.2)' }} />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>Leave a use case blank to start it right after the shared kickoff.</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#666' }}>No use cases yet — add them in the <b>Use Cases</b> tab and they'll appear here as tracks.</div>
            )}
          </div>
        </div>
      </div>

      {gantt.render && (
        <div style={{ border: '1px solid #000', marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #000', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>Engagement timeline</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 11, color: '#666' }}>
              <span>{gantt.rangeLabel} · {gantt.totalDaysLabel}</span>
              <span>Bar = planned window · solid fill = % complete</span>
            </div>
          </div>
          {gantt.legend.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', marginRight: 4, alignSelf: 'center' }}>View by</span>
              <button onClick={() => app.setGanttViewBy('all')} style={viewByBtn(viewBy === 'all')}>Whole project</button>
              {gantt.legend.map(l => (
                <button key={l.id} onClick={() => app.setGanttViewBy(l.id)} style={viewByBtn(viewBy === l.id, l.color)}>{l.name}</button>
              ))}
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 760 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', borderBottom: '1px solid rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '6px 12px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666' }}>Stage</div>
                <div style={{ position: 'relative', height: 26 }}>
                  {gantt.months.map((m, i) => (
                    <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: m.leftPct, borderLeft: '1px solid rgba(0,0,0,0.15)', paddingLeft: 5, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#666', display: 'flex', alignItems: 'center' }}>{m.label}</div>
                  ))}
                </div>
              </div>
              {gantt.groups.map((grp, gi) => (
                <div key={gi}>
                  <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', background: '#000', color: '#fff' }}>
                    <div style={{ padding: '6px 12px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{gi + 1}. {grp.name}</div>
                    <div style={{ padding: '6px 12px', fontSize: 11, color: '#bbb' }}>{grp.empty ? '—' : ''}</div>
                  </div>
                  {grp.empty && <div style={{ padding: '10px 12px', fontSize: 11, color: '#999', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>Nothing in this phase{viewBy !== 'all' ? ' for this use case' : ''}.</div>}
                  {grp.rows.map((r, ri) => (
                    <div key={ri} style={{ display: 'grid', gridTemplateColumns: '230px 1fr', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                      <div style={{ padding: '7px 12px' }}>
                        <div style={{ fontSize: 12 }}>{r.label}</div>
                        {r.ucLabel && <div style={{ fontSize: 10, ...r.ucTagStyle }}>{r.ucLabel}</div>}
                        <div style={{ fontSize: 10, color: '#999' }}>{r.dates} · {r.daysLabel}</div>
                      </div>
                      <div style={{ position: 'relative', height: 32, ...gantt.trackBg }}>
                        {gantt.hasToday && <div style={{ position: 'absolute', top: 0, bottom: 0, left: gantt.todayLeft, width: 0, borderLeft: '1.5px solid #000' }} />}
                        <div style={r.barStyle} title={r.title}><div style={r.fillStyle} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {gantt.hasToday && <div style={{ padding: '6px 14px', fontSize: 10, color: '#999', borderTop: '1px solid rgba(0,0,0,0.1)' }}>Vertical line marks today. Progress is the average completion of the matching phase in the task detail below.</div>}
        </div>
      )}
      {gantt.needsStart && (
        <div style={{ border: '1px dashed rgba(0,0,0,0.3)', padding: 28, textAlign: 'center', color: '#666', fontSize: 13, marginBottom: 26 }}>{gantt.reason}</div>
      )}

      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderTop: '1px solid #000', paddingTop: 16, marginBottom: 10 }}>Task detail</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th>Phase</Th><Th w="30%">Task</Th><Th>Owner</Th><Th>Start</Th><Th>End</Th><Th align="right">Days</Th><Th w={110}>%</Th><Th w={140}>Status</Th>
          </tr>
        </thead>
        <tbody>
          {planRows.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', ...(t.status === 'Blocked' ? { background: '#faf7f7' } : {}) }}>
              <td style={{ padding: '7px 10px', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em', verticalAlign: 'top' }}>{t.phase}</td>
              <td style={{ padding: '7px 10px', fontSize: 13, verticalAlign: 'top' }}>
                <div>{t.task}</div>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.workstream}</div>
              </td>
              <td style={{ padding: '5px 10px', verticalAlign: 'top' }}><input defaultValue={t.owner} onBlur={(e) => app.editPlan(t.id, 'owner', e.target.value)} placeholder="—" style={{ fontSize: 12, padding: '5px 6px', border: '1px solid rgba(0,0,0,0.18)', width: '100%', minWidth: 100 }} /></td>
              <td style={{ padding: '5px 10px', verticalAlign: 'top' }}><input type="date" defaultValue={t.start} onChange={(e) => app.editPlan(t.id, 'start', e.target.value)} style={{ fontSize: 11, padding: '4px 5px', border: '1px solid rgba(0,0,0,0.18)' }} /></td>
              <td style={{ padding: '5px 10px', verticalAlign: 'top' }}><input type="date" defaultValue={t.end} onChange={(e) => app.editPlan(t.id, 'end', e.target.value)} style={{ fontSize: 11, padding: '4px 5px', border: '1px solid rgba(0,0,0,0.18)' }} /></td>
              <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'right', verticalAlign: 'top' }}>{t.duration}</td>
              <td style={{ padding: '5px 10px', verticalAlign: 'top' }}><input type="number" min="0" max="100" defaultValue={t.pct} onChange={(e) => app.editPlan(t.id, 'pct', e.target.value)} style={{ fontSize: 12, padding: '5px 6px', border: '1px solid rgba(0,0,0,0.18)', width: 64 }} /></td>
              <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                <select value={t.status} onChange={(e) => app.editPlan(t.id, 'status', e.target.value)} style={statusStyle(t.status)}>
                  <option value="Not started">Not started</option><option value="In progress">In progress</option><option value="Blocked">Blocked</option><option value="Done">Done</option><option value="N/A">N/A</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>{children}</div>;
}

function Th({ children, w, align }) {
  return <th style={{ textAlign: align || 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', padding: '8px 10px', borderBottom: '1px solid #000', fontWeight: 700, width: w }}>{children}</th>;
}

const genBtn = { border: '1px solid #fff', background: '#fff', color: '#000', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '7px 14px' };
const dateInput = { fontSize: 13, padding: '7px 9px', border: '1px solid rgba(0,0,0,0.3)' };

function viewByBtn(active, color) {
  return {
    fontSize: 11, padding: '6px 12px', border: '1px solid ' + (active ? '#000' : 'rgba(0,0,0,0.2)'), cursor: 'pointer',
    background: active ? '#000' : '#fff', color: active ? '#fff' : (color || '#000'), fontWeight: active ? 700 : 400,
  };
}
