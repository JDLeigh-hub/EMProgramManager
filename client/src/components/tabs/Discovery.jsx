import { useState } from 'react';
import { useEngagement } from '../../store/EngagementContext.jsx';

export default function Discovery({ proj }) {
  const app = useEngagement();
  const editing = app.ui.editing || {};
  const [newCandidate, setNewCandidate] = useState('');
  const [newStakeGroup, setNewStakeGroup] = useState(app.T.stakeholderGroups[0]);
  const candidates = proj.discoveryCandidates || [];
  const stakeholders = proj.stakeholders || [];

  const submitCandidate = () => {
    if (!newCandidate.trim()) return;
    app.addDiscoveryCandidate(newCandidate);
    setNewCandidate('');
  };

  return (
    <div className="rise-in">
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Discovery</div>
      <div style={{ fontSize: 12, color: '#666', maxWidth: 640 }}>
        Before you commit a use case, work it here: capture notes on how you're narrowing in on the right problem, and bring in the stakeholders you're learning from. When a candidate is ready, promote it straight into <b>Use Cases</b>.
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHead>Discovery notes</SectionHead>
        <textarea
          key={proj.id}
          defaultValue={proj.discoveryNotes || ''}
          onBlur={(e) => app.editDiscoveryNotes(e.target.value)}
          rows={6}
          placeholder="What are you learning? Who's driving the ask? What workflows are actually broken today? What's ruled out and why?"
          style={notesTextarea}
        />
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <SectionHead>Candidate use cases</SectionHead>
        </div>
        {candidates.length === 0 && (
          <div style={{ padding: '14px 0', color: '#999', fontSize: 13 }}>No candidates yet — jot down an idea below as you talk to stakeholders.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {candidates.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(0,0,0,0.15)', padding: '8px 10px' }}>
              <input
                defaultValue={c.text}
                onBlur={(e) => app.editDiscoveryCandidate(c.id, e.target.value)}
                style={{ flex: 1, fontSize: 13, border: 0, outline: 'none' }}
              />
              <button onClick={() => app.promoteCandidate(c.id)} style={promoteBtn}>Promote to Use Case →</button>
              <button onClick={() => app.delDiscoveryCandidate(c.id)} style={removeBtn}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={newCandidate}
            onChange={(e) => setNewCandidate(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitCandidate(); }}
            placeholder="e.g. Automate brand-compliant asset variation for regional campaigns"
            style={{ flex: 1, fontSize: 13, padding: '8px 10px', border: '1px solid rgba(0,0,0,0.25)' }}
          />
          <button onClick={submitCandidate} style={addBtn}>+ Add candidate</button>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <SectionHead>Stakeholders in discovery</SectionHead>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={newStakeGroup} onChange={(e) => setNewStakeGroup(e.target.value)} style={miniSelect}>
              {app.T.stakeholderGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={() => app.addStake(newStakeGroup)} style={addBtn}>+ Add stakeholder</button>
          </div>
        </div>
        {stakeholders.length === 0 && (
          <div style={{ padding: '14px 0', color: '#999', fontSize: 13 }}>
            No stakeholders yet. Add the people you're talking to during discovery — the full map lives in the <b>Stakeholders</b> tab.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 10, border: stakeholders.length ? '1px solid rgba(0,0,0,0.15)' : 0 }}>
          {stakeholders.map(s => {
            const isEditing = !!editing[s.id];
            if (!isEditing) {
              return (
                <div key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}><b>{s.name || '(unnamed)'}</b> <span style={{ color: '#666' }}>— {s.role || '—'}</span></div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.group} · {s.posture}</div>
                  </div>
                  <button onClick={() => app.startEdit(s.id)} style={editBtn}>Edit</button>
                </div>
              );
            }
            return (
              <div key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '10px 12px', background: '#fafafa' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input defaultValue={s.name} onBlur={(e) => app.editStake(s.id, 'name', e.target.value)} placeholder="Name" style={{ fontSize: 13, fontWeight: 700, border: '1px solid rgba(0,0,0,0.15)', padding: 5, flex: 1 }} />
                  <input defaultValue={s.role} onBlur={(e) => app.editStake(s.id, 'role', e.target.value)} placeholder="Role / title" style={{ fontSize: 12, border: '1px solid rgba(0,0,0,0.15)', padding: 5, flex: 1 }} />
                  <select defaultValue={s.posture} onChange={(e) => app.editStake(s.id, 'posture', e.target.value)} style={miniSelect}>
                    <option>Champion</option><option>Supportive</option><option>Neutral</option><option>Skeptical</option><option>Blocker</option>
                  </select>
                  <button onClick={() => app.stopEdit(s.id)} style={doneBtn}>Done</button>
                  <button onClick={() => app.delStake(s.id)} style={removeBtn}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: 8, fontWeight: 700 }}>{children}</div>;
}

const notesTextarea = { width: '100%', fontSize: 13, lineHeight: 1.5, border: '1px solid rgba(0,0,0,0.18)', padding: 10, marginTop: 10, resize: 'vertical', fontFamily: 'var(--font-sans)' };
const addBtn = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 14px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' };
const promoteBtn = { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 10px', border: '1px solid #000', background: '#fff', color: '#000', cursor: 'pointer', whiteSpace: 'nowrap' };
const removeBtn = { border: 0, background: 'none', fontSize: 16, color: '#999', cursor: 'pointer' };
const editBtn = { border: '1px solid rgba(0,0,0,0.25)', background: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 12px', flexShrink: 0 };
const doneBtn = { border: '1px solid #000', background: '#000', color: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '6px 12px', flexShrink: 0 };
const miniSelect = { fontSize: 12, border: '1px solid rgba(0,0,0,0.18)', padding: 5 };
