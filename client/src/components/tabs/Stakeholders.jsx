import { useEngagement } from '../../store/EngagementContext.jsx';

export default function Stakeholders({ proj }) {
  const app = useEngagement();
  const T = app.T;
  const editing = app.ui.editing || {};

  const stakeGroups = T.stakeholderGroups.map(g => ({
    name: g,
    rows: proj.stakeholders.filter(s => s.group === g),
  }));

  return (
    <div className="rise-in">
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Stakeholder Value Map</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 18 }}>Element 2 of the Value Realization Framework. One row per individual. Capture perceived value in each group's OWN terms. Update after every meeting.</div>

      {stakeGroups.map(g => (
        <div key={g.name} style={{ marginBottom: 24, border: '1px solid rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', color: '#fff', padding: '8px 12px' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{g.name}</div>
            <button onClick={() => app.addStake(g.name)} style={addBtn}>+ Add person</button>
          </div>
          {g.rows.length === 0 && <div style={{ padding: 14, color: '#999', fontSize: 12 }}>No stakeholders in this group yet.</div>}
          {g.rows.map(s => {
            const isEditing = !!editing[s.id];
            if (!isEditing) {
              return (
                <div key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}><b>{s.name || '(unnamed)'}</b> <span style={{ color: '#666' }}>— {s.role || '—'}</span></div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.tier} · {s.posture}</div>
                    {s.value && s.value.trim() && <div style={{ fontSize: 12, color: '#3e3e3e', marginTop: 5, lineHeight: 1.45 }}>{s.value}</div>}
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
                  <select defaultValue={s.tier} onChange={(e) => app.editStake(s.id, 'tier', e.target.value)} style={miniSelect}>
                    <option>Decision Authority</option><option>Network Influencer</option><option>Impacted Constituency</option>
                  </select>
                  <select defaultValue={s.posture} onChange={(e) => app.editStake(s.id, 'posture', e.target.value)} style={miniSelect}>
                    <option>Champion</option><option>Supportive</option><option>Neutral</option><option>Skeptical</option><option>Blocker</option>
                  </select>
                  <button onClick={() => app.stopEdit(s.id)} style={doneBtn}>Done</button>
                  <button onClick={() => app.delStake(s.id)} style={removeBtn}>×</button>
                </div>
                <input defaultValue={s.value} onBlur={(e) => app.editStake(s.id, 'value', e.target.value)} placeholder="Perceived value in their own terms…" style={{ fontSize: 12, border: '1px solid rgba(0,0,0,0.12)', padding: 6, width: '100%', marginTop: 8 }} />
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ border: '1px solid rgba(0,0,0,0.12)', padding: 16, background: '#f7f7f7' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Influence-tier definitions</div>
        {T.influenceTiers.map(([name, desc]) => (
          <div key={name} style={{ padding: '6px 0' }}><span style={{ fontSize: 12, fontWeight: 700 }}>{name}</span> <span style={{ fontSize: 12, color: '#3e3e3e' }}>— {desc}</span></div>
        ))}
      </div>
    </div>
  );
}

const addBtn = { border: 0, background: 'none', color: '#fff', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' };
const editBtn = { border: '1px solid rgba(0,0,0,0.25)', background: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 12px', flexShrink: 0 };
const doneBtn = { border: '1px solid #000', background: '#000', color: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '6px 12px', flexShrink: 0 };
const removeBtn = { border: 0, background: 'none', fontSize: 16, color: '#999', cursor: 'pointer' };
const miniSelect = { fontSize: 12, border: '1px solid rgba(0,0,0,0.18)', padding: 5 };
