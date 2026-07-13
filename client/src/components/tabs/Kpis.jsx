import { useEngagement } from '../../store/EngagementContext.jsx';
import { kpiPct } from '../../lib/stats.js';

export default function Kpis({ proj }) {
  const app = useEngagement();
  const editing = app.ui.editing || {};

  return (
    <div className="rise-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>KPIs &amp; Value</div>
          <div style={{ fontSize: 12, color: '#666' }}>Capture baseline, target and current per KPI. % to target updates automatically.</div>
        </div>
        <button onClick={app.addKpi} style={solidBtn}>+ Add KPI</button>
      </div>

      {proj.kpis.length === 0 && (
        <div style={{ border: '1px dashed rgba(0,0,0,0.3)', padding: 40, textAlign: 'center', color: '#666', fontSize: 13, marginTop: 22 }}>
          No KPIs yet. Add one to start tracking value realization against your use cases.
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
        <thead>
          <tr>
            <Th>Category</Th><Th w="22%">KPI</Th><Th>Use case</Th><Th>Unit</Th>
            <Th align="right">Base</Th><Th align="right">Target</Th><Th align="right">Current</Th>
            <Th w={110}>% to target</Th><Th w={130}>Status</Th><th style={{ borderBottom: '1px solid #000' }}></th>
          </tr>
        </thead>
        <tbody>
          {proj.kpis.map(k => {
            const isEditing = !!editing[k.id];
            const pct = kpiPct(k);
            const shown = pct == null ? 0 : Math.max(0, Math.min(100, pct));
            const pctStr = pct == null ? '—' : pct + '%';
            if (!isEditing) {
              return (
                <tr key={k.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <td style={td}>{k.category || '—'}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{k.name || k.code}</td>
                  <td style={td}>{k.useCase || '—'}</td>
                  <td style={td}>{k.unit}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{k.baseline === '' ? '—' : k.baseline}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{k.target === '' ? '—' : k.target}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{k.current === '' ? '—' : k.current}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 8, background: '#ededed' }}><div style={{ height: 8, background: '#000', width: shown + '%' }} /></div>
                      <span style={{ fontSize: 11, fontWeight: 700, width: 34, textAlign: 'right' }}>{pctStr}</span>
                    </div>
                  </td>
                  <td style={td}>{k.status}</td>
                  <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}><button onClick={() => app.startEdit(k.id)} style={editBtn}>Edit</button></td>
                </tr>
              );
            }
            const statusSelectStyle = { fontSize: 12, border: '1px solid rgba(0,0,0,0.2)', padding: 4, width: '100%', ...(k.status === 'Off track' ? { background: '#000', color: '#fff' } : k.status === 'At risk' ? { background: '#d6d6d6' } : k.status === 'Target met' ? { fontWeight: 700 } : {}) };
            return (
              <tr key={k.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#fafafa' }}>
                <td style={tdEdit}><input defaultValue={k.category} onBlur={(e) => app.editKpi(k.id, 'category', e.target.value)} placeholder="—" style={{ ...miniInput, minWidth: 90 }} /></td>
                <td style={tdEdit}><input defaultValue={k.name} onBlur={(e) => app.editKpi(k.id, 'name', e.target.value)} placeholder="KPI name" style={miniInput} /></td>
                <td style={tdEdit}><input defaultValue={k.useCase} onBlur={(e) => app.editKpi(k.id, 'useCase', e.target.value)} placeholder="UC-…" style={{ ...miniInput, minWidth: 80 }} /></td>
                <td style={tdEdit}><input defaultValue={k.unit} onBlur={(e) => app.editKpi(k.id, 'unit', e.target.value)} placeholder="unit" style={{ ...miniInput, width: 60 }} /></td>
                <td style={tdEdit}><input defaultValue={k.baseline} onBlur={(e) => app.editKpi(k.id, 'baseline', e.target.value)} style={{ ...miniInput, width: 64, textAlign: 'right' }} /></td>
                <td style={tdEdit}><input defaultValue={k.target} onBlur={(e) => app.editKpi(k.id, 'target', e.target.value)} style={{ ...miniInput, width: 64, textAlign: 'right' }} /></td>
                <td style={tdEdit}><input defaultValue={k.current} onBlur={(e) => app.editKpi(k.id, 'current', e.target.value)} style={{ ...miniInput, width: 64, textAlign: 'right' }} /></td>
                <td style={tdEdit}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 8, background: '#ededed' }}><div style={{ height: 8, background: '#000', width: shown + '%' }} /></div>
                    <span style={{ fontSize: 11, fontWeight: 700, width: 34, textAlign: 'right' }}>{pctStr}</span>
                  </div>
                </td>
                <td style={tdEdit}>
                  <select defaultValue={k.status} onChange={(e) => app.editKpi(k.id, 'status', e.target.value)} style={statusSelectStyle}>
                    <option>Baseline pending</option><option>On track</option><option>At risk</option><option>Off track</option><option>Target met</option><option>N/A</option>
                  </select>
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => app.stopEdit(k.id)} style={{ ...doneBtn, marginRight: 4 }}>Done</button>
                  <button onClick={() => app.delKpi(k.id)} style={removeBtn}>×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, w, align }) {
  return <th style={{ textAlign: align || 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', padding: '8px 8px', borderBottom: '1px solid #000', fontWeight: 700, width: w }}>{children}</th>;
}

const td = { padding: 8, fontSize: 12 };
const tdEdit = { padding: '5px 8px' };
const solidBtn = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 18px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', flexShrink: 0 };
const editBtn = { border: '1px solid rgba(0,0,0,0.25)', background: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 10px' };
const doneBtn = { border: '1px solid #000', background: '#000', color: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 10px' };
const removeBtn = { border: 0, background: 'none', fontSize: 14, color: '#999', cursor: 'pointer' };
const miniInput = { fontSize: 12, border: '1px solid rgba(0,0,0,0.15)', padding: 4, width: '100%' };
