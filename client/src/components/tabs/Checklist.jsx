import { useMemo } from 'react';
import { useEngagement } from '../../store/EngagementContext.jsx';
import { statusStyle } from '../../lib/styleHelpers.js';
import { parseDate } from '../../lib/dates.js';

const STATUS_OPTS = ['All', 'Open', 'Not started', 'In progress', 'Blocked', 'Done', 'N/A'];

export default function Checklist({ proj }) {
  const app = useEngagement();
  const { q, fSection, fStatus } = app.ui;

  const secOpts = useMemo(() => {
    const opts = ['All'];
    proj.checklist.forEach(x => { if (!opts.includes(x.section)) opts.push(x.section); });
    return opts;
  }, [proj.checklist]);

  const clGroups = useMemo(() => {
    const matchStatus = (s) => {
      if (fStatus === 'All') return true;
      if (fStatus === 'Open') return s !== 'Done' && s !== 'N/A';
      if (fStatus === 'Not started') return s === '' || s === 'Not started';
      return s === fStatus;
    };
    const qLower = (q || '').toLowerCase();
    const groupMap = {}; const sectionOrder = [];
    proj.checklist.forEach((it, idx) => {
      if (!sectionOrder.includes(it.section)) sectionOrder.push(it.section);
      if (fSection !== 'All' && it.section !== fSection) return;
      if (!matchStatus(it.status)) return;
      if (qLower && !((it.item || '').toLowerCase().includes(qLower) || (it.subsection || '').toLowerCase().includes(qLower) || (it.owner || '').toLowerCase().includes(qLower))) return;
      (groupMap[it.section] = groupMap[it.section] || []).push({ ...it, __ord: idx });
    });
    return sectionOrder.filter(sec => groupMap[sec]).map(sec => {
      const sorted = groupMap[sec].slice().sort((a, b) => {
        const da = parseDate(a.due), db = parseDate(b.due);
        if (da && db) return da - db || a.__ord - b.__ord;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return a.__ord - b.__ord;
      });
      const den = groupMap[sec].filter(x => x.status !== 'N/A').length;
      const dn = groupMap[sec].filter(x => x.status === 'Done').length;
      return { section: sec, items: sorted, tally: `${dn}/${den} done` };
    });
  }, [proj.checklist, fSection, fStatus, q]);

  return (
    <div className="rise-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>EM Checklist</div>
          <div style={{ fontSize: 12, color: '#666' }}>172-item master tracker. Assign an owner, set a due date, and update status. N/A items are excluded from % complete.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Search items…" value={q} onChange={(e) => app.onSearch(e.target.value)} style={{ fontSize: 12, padding: '8px 10px', border: '1px solid rgba(0,0,0,0.25)', width: 200 }} />
          <select value={fSection} onChange={(e) => app.onFilterSection(e.target.value)} style={selStyle}>
            {secOpts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => app.onFilterStatus(e.target.value)} style={selStyle}>
            {STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {clGroups.map(g => (
        <div key={g.section} style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', color: '#fff', padding: '6px 12px' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{g.section}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 11, color: '#bbb' }}>{g.tally}</div>
              <button onClick={() => app.addClItem(g.section)} style={addTaskBtn}>+ Add task</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th w="38%">Item</Th><Th>Owner</Th><Th w={130}>Due</Th><Th w={150}>Status</Th><Th w="22%">Notes</Th>
              </tr>
            </thead>
            <tbody>
              {g.items.map(it => (
                <tr key={it.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <td style={{ padding: '8px 12px', fontSize: 13, verticalAlign: 'top' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#999' }}>{it.subsection}</div>
                    {!it.custom && (
                      <div style={{ fontSize: 13, lineHeight: 1.4, marginTop: 2, ...(it.status === 'Done' ? { color: '#999', textDecoration: 'line-through' } : {}) }}>{it.item}</div>
                    )}
                    {it.custom && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <input defaultValue={it.item} onBlur={(e) => app.editCl(it.id, 'item', e.target.value)} placeholder="New task…" style={{ fontSize: 13, padding: '4px 6px', border: '1px solid rgba(0,0,0,0.25)', width: '100%' }} />
                        <button onClick={() => app.delClItem(it.id)} title="Remove task" style={removeBtn}>×</button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>
                    <input defaultValue={it.owner} onBlur={(e) => app.editCl(it.id, 'owner', e.target.value)} placeholder="—" style={{ fontSize: 12, padding: '5px 6px', border: '1px solid rgba(0,0,0,0.18)', width: '100%', minWidth: 120 }} />
                  </td>
                  <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>
                    <input type="date" defaultValue={it.due} onChange={(e) => app.editCl(it.id, 'due', e.target.value)} style={{ fontSize: 12, padding: '4px 5px', border: '1px solid rgba(0,0,0,0.18)', width: '100%' }} />
                  </td>
                  <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>
                    <select value={it.status} onChange={(e) => app.editCl(it.id, 'status', e.target.value)} style={statusStyle(it.status)}>
                      <option value="">— Not set</option><option value="Not started">Not started</option><option value="In progress">In progress</option><option value="Blocked">Blocked</option><option value="Done">Done</option><option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>
                    <input defaultValue={it.notes} onBlur={(e) => app.editCl(it.id, 'notes', e.target.value)} placeholder="Decisions, links, why blocked…" style={{ fontSize: 12, padding: '5px 6px', border: '1px solid rgba(0,0,0,0.18)', width: '100%' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Th({ children, w }) {
  return <th style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', padding: '8px 12px', borderBottom: '1px solid #000', fontWeight: 700, width: w }}>{children}</th>;
}

const selStyle = { fontSize: 12, padding: '8px 10px', border: '1px solid rgba(0,0,0,0.25)' };
const addTaskBtn = { border: '1px solid rgba(255,255,255,0.4)', background: 'none', color: '#fff', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 10px' };
const removeBtn = { border: 0, background: 'none', fontSize: 15, color: '#999', cursor: 'pointer', flexShrink: 0 };
