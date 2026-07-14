import { useEngagement } from '../../store/EngagementContext.jsx';

export default function NewProjectModal() {
  const app = useEngagement();
  if (!app.ui.newOpen) return null;

  const submit = () => {
    app.createProject({
      name: app.npName.current && app.npName.current.value,
      client: app.npClient.current && app.npClient.current.value,
      em: app.npEm.current && app.npEm.current.value,
      target: app.npTarget.current && app.npTarget.current.value,
    });
  };

  return (
    <div style={overlay} onClick={app.closeNew}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderBottom: '2px solid #000', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}>New engagement</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350, marginTop: 4 }}>Create from template</div>
        </div>
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label>Project name *</Label>
            <input ref={app.npName} placeholder="e.g. Firefly Rollout — Acme" style={input} />
          </div>
          <div>
            <Label>Client</Label>
            <input ref={app.npClient} placeholder="e.g. Acme Corp" style={input} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Label>Engagement Manager</Label>
              <input ref={app.npEm} placeholder="Your name" style={input} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Target launch</Label>
              <input ref={app.npTarget} type="date" style={input} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>Includes the full 182-item checklist, 38-task project plan, RACI, use-case menu, KPIs and the value-realization framework — all blank and ready to fill.</div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
          <button onClick={app.closeNew} style={cancelBtn}>Cancel</button>
          <button onClick={submit} style={createBtn}>Create project</button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>{children}</div>;
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const panel = { background: '#fff', width: 460, maxWidth: '92vw', border: '1px solid #000', boxShadow: '10px 10px 0 rgba(0,0,0,0.25)' };
const input = { fontSize: 14, border: '1px solid rgba(0,0,0,0.3)', padding: 9, width: '100%' };
const cancelBtn = { flex: 1, padding: 15, border: 0, background: '#fff', color: '#000', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRight: '1px solid rgba(0,0,0,0.12)' };
const createBtn = { flex: 1, padding: 15, border: 0, background: '#000', color: '#fff', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' };
