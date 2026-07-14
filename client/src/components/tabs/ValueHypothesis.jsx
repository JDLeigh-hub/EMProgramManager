import { useEngagement } from '../../store/EngagementContext.jsx';

export default function ValueHypothesis({ proj }) {
  const app = useEngagement();
  const T = app.T;
  const hyps = proj.hypotheses;
  const vhIdx = Math.min(app.ui.vhIdx, Math.max(0, hyps.length - 1));
  const curHyp = hyps[vhIdx];

  return (
    <div className="rise-in" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Value Hypothesis</div>
          <div style={{ fontSize: 12, color: '#666' }}>Element 1 of the Value Realization Framework — one per use case.</div>
        </div>
        <button onClick={app.addVh} style={solidBtn}>+ New hypothesis</button>
      </div>

      {hyps.length === 0 && (
        <div style={{ border: '1px dashed rgba(0,0,0,0.3)', padding: 40, textAlign: 'center', color: '#666', fontSize: 13, marginTop: 22 }}>
          No value hypotheses yet. Create one per approved use case.
        </div>
      )}

      {hyps.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 6, margin: '18px 0', flexWrap: 'wrap' }}>
            {hyps.map((h, i) => {
              const label = (h.values && h.values['Use case name']) ? h.values['Use case name'] : ('Hypothesis ' + (i + 1));
              const active = i === vhIdx;
              return (
                <button key={h.id} onClick={() => app.selVh(i)} style={{ border: '1px solid ' + (active ? '#000' : 'rgba(0,0,0,0.2)'), background: active ? '#000' : '#fff', color: active ? '#fff' : '#000', padding: '8px 14px', cursor: 'pointer', fontSize: 12, letterSpacing: '0.03em' }}>{label}</button>
              );
            })}
          </div>

          {T.valueHypothesisTemplate.map((sec, si) => (
            <div key={si} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 6 }}>{sec.section}</div>
              {sec.fields.map(([label, hint]) => (
                <div key={label} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.08)', alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 220px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{hint}</div>
                  </div>
                  <textarea
                    key={curHyp.id + ':' + label}
                    defaultValue={(curHyp.values && curHyp.values[label]) || ''}
                    onBlur={(e) => app.editVh(label, e.target.value)}
                    rows={1}
                    style={{ flex: 1, fontSize: 13, border: '1px solid rgba(0,0,0,0.18)', padding: 6, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  />
                </div>
              ))}
            </div>
          ))}
          <button onClick={() => app.delVh(vhIdx)} style={deleteBtn}>Delete this hypothesis</button>
        </>
      )}
    </div>
  );
}

const solidBtn = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 18px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', flexShrink: 0 };
const deleteBtn = { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 16px', border: '1px solid rgba(0,0,0,0.25)', background: '#fff', color: '#666', cursor: 'pointer' };
