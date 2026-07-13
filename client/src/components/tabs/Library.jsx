import { useEngagement } from '../../store/EngagementContext.jsx';
import { fmtBytes, fmtUpdated } from '../../lib/dates.js';
import AiReviewModal from '../modals/AiReviewModal.jsx';

export default function Library({ proj }) {
  const app = useEngagement();
  const { uploading, aiBusyId, aiErr } = app.ui;
  const files = proj.library || [];

  const onDrop = (e) => { e.preventDefault(); const fl = e.dataTransfer && e.dataTransfer.files; if (fl && fl.length) app.ingestFiles(fl); };
  const onDragOver = (e) => e.preventDefault();

  return (
    <div className="rise-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Resource Library</div>
          <div style={{ fontSize: 12, color: '#666' }}>Drop the source material for this engagement — SOWs, kickoff decks, discovery notes, RACI drafts, KPI sheets. Then let the assistant read a file and propose entries for your project book. You review everything before it's applied.</div>
        </div>
        <button onClick={() => app.uploadRef.current && app.uploadRef.current.click()} style={solidBtn}>+ Upload files</button>
      </div>
      <input type="file" multiple accept=".xlsx,.xlsm,.docx,.pptx,.pdf,.csv,.txt,.md,.json" ref={app.uploadRef} style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files && e.target.files.length) app.ingestFiles(e.target.files); e.target.value = ''; }} />

      <div onDrop={onDrop} onDragOver={onDragOver} onClick={() => app.uploadRef.current && app.uploadRef.current.click()}
        style={{ marginTop: 20, border: '1px dashed rgba(0,0,0,0.35)', padding: 28, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
        <div style={{ fontSize: 13, color: '#666' }}>Drag files here or click to browse — Excel, Word, PowerPoint, PDF, CSV or text.</div>
      </div>

      {uploading.length > 0 && (
        <div style={{ marginTop: 16, border: '1px solid rgba(0,0,0,0.15)' }}>
          {uploading.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}>
              <span>{u.name}</span><span style={{ color: '#666' }}>{u.status}</span>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && uploading.length === 0 && (
        <div style={{ marginTop: 20, color: '#999', fontSize: 13 }}>No files yet.</div>
      )}

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(0,0,0,0.15)' }}>
        {files.map(f => {
          const busy = aiBusyId === f.id;
          const canAI = f.textLen > 0;
          const aiBtnStyle = {
            fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 12px', border: '1px solid #000', cursor: 'pointer', whiteSpace: 'nowrap',
            ...(busy ? { background: '#666', color: '#fff', borderColor: '#666' } : canAI ? { background: '#000', color: '#fff' } : { background: '#f2f2f2', color: '#bbb', borderColor: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }),
          };
          const meta = [fmtBytes(f.size), (f.textLen ? (f.textLen >= 1000 ? Math.round(f.textLen / 1000) + 'k' : f.textLen) + ' chars read' : 'no readable text'), fmtUpdated(f.uploadedAt).replace('Updated ', 'Added ')].filter(Boolean).join('  ·  ');
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ flexShrink: 0, width: 64, height: 40, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{f.kind}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{meta}</div>
                {f.error && <div style={{ fontSize: 11, color: '#000', fontWeight: 700, marginTop: 2 }}>⚠ {f.error}</div>}
              </div>
              <button onClick={() => canAI && !busy && app.aiExtract(f.id)} style={aiBtnStyle}>{busy ? 'Reading…' : 'Auto-fill →'}</button>
              <button onClick={() => app.downloadFile(f.id)} style={dlBtn}>Download</button>
              <button onClick={() => app.delFile(f.id)} style={removeBtn}>×</button>
            </div>
          );
        })}
      </div>

      {aiErr && <div style={{ marginTop: 14, border: '1px solid #000', padding: '12px 14px', fontSize: 12 }}>⚠ {aiErr}</div>}

      <AiReviewModal />
    </div>
  );
}

const solidBtn = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 18px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', flexShrink: 0 };
const dlBtn = { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 12px', border: '1px solid rgba(0,0,0,0.25)', background: '#fff', color: '#000', cursor: 'pointer' };
const removeBtn = { fontSize: 16, border: 0, background: 'none', color: '#999', cursor: 'pointer' };
