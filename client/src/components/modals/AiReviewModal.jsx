import { useEngagement } from '../../store/EngagementContext.jsx';

export default function AiReviewModal() {
  const app = useEngagement();
  const ai = app.aiView;
  if (!ai.open) return null;

  return (
    <div style={overlay} onClick={app.closeAi}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderBottom: '2px solid #000', padding: '18px 22px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}>Suggested from · {ai.fileName}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 350, marginTop: 3 }}>Review &amp; apply</div>
          {ai.hasSummary && <div style={{ fontSize: 12, color: '#3e3e3e', marginTop: 6, lineHeight: 1.45 }}>{ai.summary}</div>}
        </div>
        <div style={{ overflowY: 'auto', padding: '6px 22px 12px', flex: 1 }}>
          {ai.empty && <div style={{ padding: '32px 0', color: '#666', fontSize: 13, textAlign: 'center' }}>Nothing was found that could be confidently mapped into your project book from this file.</div>}
          {ai.sections.map(sec => (
            <div key={sec.key} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #000', paddingBottom: 6 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{sec.title}</div>
                <button onClick={() => app.toggleAiSection(sec.key)} style={toggleAllBtn}>Toggle all</button>
              </div>
              {sec.items.map(it => (
                <label key={it.key} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={it.checked} onChange={() => app.toggleAiItem(it.key)} style={{ marginTop: 3, flexShrink: 0, width: 15, height: 15, accentColor: '#000' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.35 }}>{it.label}</div>
                    {it.hasDetail && <div style={{ fontSize: 11, color: '#666', marginTop: 2, lineHeight: 1.4 }}>{it.detail}</div>}
                  </div>
                </label>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}>
          <button onClick={app.closeAi} style={cancelBtn}>Cancel</button>
          <button onClick={app.applyAi} style={applyBtn}>Apply {ai.selectedCount} selected</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 };
const panel = { background: '#fff', width: 720, maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #000', boxShadow: '10px 10px 0 rgba(0,0,0,0.25)' };
const toggleAllBtn = { border: 0, background: 'none', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: 14, border: 0, background: '#fff', color: '#000', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRight: '1px solid rgba(0,0,0,0.12)' };
const applyBtn = { flex: 2, padding: 14, border: 0, background: '#000', color: '#fff', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' };
