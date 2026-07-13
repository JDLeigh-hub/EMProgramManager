import { useEngagement } from '../../store/EngagementContext.jsx';
import { ucChipStyle, segBtnStyle } from '../../lib/styleHelpers.js';
import { fmt } from '../../lib/dates.js';

export default function UseCases({ proj }) {
  const app = useEngagement();
  const ucView = app.ui.ucView || 'repo';
  const editing = app.ui.editing || {};

  return (
    <div className="rise-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Use Cases</div>
          <div style={{ fontSize: 12, color: '#666', maxWidth: 580 }}>Your committed repository, plus the capability menu to promote new candidates from.</div>
        </div>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button onClick={() => app.setUcView('repo')} style={segBtnStyle(ucView === 'repo')}>Repository · {proj.useCases.length}</button>
          <button onClick={() => app.setUcView('menu')} style={segBtnStyle(ucView === 'menu')}>Browse menu</button>
        </div>
      </div>

      {ucView === 'repo' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={app.addUc} style={solidBtn}>+ Add use case</button>
          </div>
          {proj.useCases.length === 0 && (
            <div style={{ border: '1px dashed rgba(0,0,0,0.3)', padding: 40, textAlign: 'center', color: '#666', fontSize: 13, marginTop: 16 }}>
              No committed use cases yet. Add one, or switch to <b>Browse menu</b> to promote a Firefly capability.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {proj.useCases.map(u => {
              const isEditing = !!editing[u.id];
              return (
                <div key={u.id} style={{ border: '1px solid #000' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f4f4f4', padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.12)', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontWeight: 700, flexShrink: 0 }}>{u.code}</span>
                      {!isEditing && <span style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</span>}
                      {isEditing && <input defaultValue={u.name} onBlur={(e) => app.editUc(u.id, 'name', e.target.value)} placeholder="Use case name" style={{ fontSize: 15, fontWeight: 700, border: '1px solid rgba(0,0,0,0.2)', background: '#fff', minWidth: 260, padding: '4px 6px' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {!isEditing && <>
                        <span style={ucChipStyle(u.status)}>{u.status}</span>
                        <button onClick={() => app.startEdit(u.id)} style={editBtn}>Edit</button>
                      </>}
                      {isEditing && <button onClick={() => app.stopEdit(u.id)} style={doneBtn}>Done</button>}
                      <button onClick={() => app.delUc(u.id)} style={removeBtn}>Remove</button>
                    </div>
                  </div>

                  {!isEditing && (
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px', fontSize: 12, color: '#666' }}>
                        <span>Priority <b style={{ color: '#000' }}>{u.priority}</b></span>
                        <span>Phase <b style={{ color: '#000' }}>{u.phase}</b></span>
                        <span>Owner (cust.) <b style={{ color: '#000' }}>{u.ownerCust}</b></span>
                        <span>Owner (Adobe) <b style={{ color: '#000' }}>{u.ownerAdobe}</b></span>
                        <span>Launch <b style={{ color: '#000' }}>{u.target ? fmt(u.target) : '—'}</b></span>
                      </div>
                      {u.problem && <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 10 }}><span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999' }}>Problem</span> · {u.problem}</div>}
                      {u.outcome && <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 6 }}><span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999' }}>Outcome</span> · {u.outcome}</div>}
                      {u.metric && <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 6 }}><span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999' }}>Success metric</span> · {u.metric}</div>}
                    </div>
                  )}

                  {isEditing && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                        <div style={{ padding: '12px 14px', borderRight: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                          <FieldLabel>Business problem</FieldLabel>
                          <textarea defaultValue={u.problem} onBlur={(e) => app.editUc(u.id, 'problem', e.target.value)} rows={2} style={textareaStyle} />
                        </div>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                          <FieldLabel>Business outcome</FieldLabel>
                          <textarea defaultValue={u.outcome} onBlur={(e) => app.editUc(u.id, 'outcome', e.target.value)} rows={2} style={textareaStyle} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)' }}>
                        <div style={gridCell}><FieldLabelSm>Priority</FieldLabelSm>
                          <select defaultValue={u.priority} onChange={(e) => app.editUc(u.id, 'priority', e.target.value)} style={miniSelect}>
                            <option>High</option><option>Medium</option><option>Low</option>
                          </select>
                        </div>
                        <div style={gridCell}><FieldLabelSm>Phase</FieldLabelSm><input defaultValue={u.phase} onBlur={(e) => app.editUc(u.id, 'phase', e.target.value)} style={miniInput} /></div>
                        <div style={gridCell}><FieldLabelSm>Owner (cust.)</FieldLabelSm><input defaultValue={u.ownerCust} onBlur={(e) => app.editUc(u.id, 'ownerCust', e.target.value)} style={miniInput} /></div>
                        <div style={gridCell}><FieldLabelSm>Owner (Adobe)</FieldLabelSm><input defaultValue={u.ownerAdobe} onBlur={(e) => app.editUc(u.id, 'ownerAdobe', e.target.value)} style={miniInput} /></div>
                        <div style={gridCell}><FieldLabelSm>Target launch</FieldLabelSm><input type="date" defaultValue={u.target} onChange={(e) => app.editUc(u.id, 'target', e.target.value)} style={miniInput} /></div>
                        <div style={{ padding: '10px 14px' }}><FieldLabelSm>Status</FieldLabelSm>
                          <select defaultValue={u.status} onChange={(e) => app.editUc(u.id, 'status', e.target.value)} style={miniSelect}>
                            <option>Candidate</option><option>Backlog</option><option>In discovery</option><option>In build</option><option>UAT</option><option>Live</option><option>Deprioritized</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <FieldLabelSm>Success metric</FieldLabelSm>
                        <input defaultValue={u.metric} onBlur={(e) => app.editUc(u.id, 'metric', e.target.value)} placeholder="e.g. Reduce time per asset set from 3 days to 4 hours" style={{ fontSize: 13, border: '1px solid rgba(0,0,0,0.15)', padding: 6, width: '100%', marginTop: 4 }} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {ucView === 'menu' && (
        <>
          <div style={{ fontSize: 12, color: '#666', margin: '18px 0 14px' }}>Illustrative Firefly capability-led use cases. Not committed scope — promote one into your repository to make it real.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {app.T.potentialUseCases.map(p => (
              <div key={p.id} style={{ border: '1px solid rgba(0,0,0,0.2)', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>{p.id}</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666' }}>{p.complexity} · {p.stage}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 400, marginTop: 8, lineHeight: 1.15 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#3e3e3e', marginTop: 8, lineHeight: 1.5, flex: 1 }}>{p.description}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 10 }}><b style={{ color: '#000' }}>Why:</b> {p.why}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: 11, color: '#666' }}>{p.metric}</span>
                  <button onClick={() => app.promote(p.id)} style={promoteBtn}>Promote →</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FieldLabel({ children }) { return <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>{children}</div>; }
function FieldLabelSm({ children }) { return <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>{children}</div>; }

const solidBtn = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 16px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer' };
const editBtn = { border: '1px solid rgba(0,0,0,0.25)', background: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', cursor: 'pointer', padding: '6px 12px' };
const doneBtn = { border: '1px solid #000', background: '#000', color: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '6px 12px' };
const removeBtn = { border: 0, background: 'none', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', cursor: 'pointer' };
const textareaStyle = { width: '100%', fontSize: 13, border: '1px solid rgba(0,0,0,0.15)', padding: 6, resize: 'vertical', fontFamily: 'var(--font-sans)' };
const gridCell = { padding: '10px 14px', borderRight: '1px solid rgba(0,0,0,0.1)' };
const miniSelect = { fontSize: 12, border: '1px solid rgba(0,0,0,0.18)', padding: 4, width: '100%', marginTop: 4 };
const miniInput = { fontSize: 12, border: '1px solid rgba(0,0,0,0.18)', padding: 4, width: '100%', marginTop: 4 };
const promoteBtn = { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px', border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer' };
