import { Fragment, useMemo } from 'react';
import { useEngagement } from '../../store/EngagementContext.jsx';

export default function Raci({ proj }) {
  const app = useEngagement();
  const T = app.T;

  const raciCols = useMemo(() => T.raciRoles.map((role, idx) => ({ role, idx, name: proj.raciNames[idx] || '' })), [T, proj.raciNames]);

  const raciGroups = useMemo(() => T.raciGroups.map((g, gi) => ({
    name: g.name,
    rows: g.rows.map((r, ri) => ({
      activity: r[0],
      cells: T.raciRoles.map((_, k) => {
        const key = `${gi}-${ri}-${k}`;
        const mark = proj.raciMarks[key] || '';
        const style = {
          fontFamily: 'var(--font-sans)', fontSize: 11, textAlign: 'center', border: '1px solid rgba(0,0,0,0.12)', padding: 3, width: 56, fontWeight: 700,
          ...(mark === 'A' || mark === 'A,R' ? { background: '#000', color: '#fff' } : mark === 'R' ? { background: '#d6d6d6' } : { background: '#fff', color: '#444' }),
        };
        return { key, mark, style };
      }),
    })),
  })), [T, proj.raciMarks]);

  return (
    <div className="rise-in">
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>RACI</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>R = Responsible · A = Accountable (one per row) · C = Consulted · I = Informed. Fill in the person for each role, adjust markers as needed.</div>
      <div style={{ overflowX: 'auto', border: '1px solid #000' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 900, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', background: '#000', padding: '8px 10px', position: 'sticky', left: 0, zIndex: 2, minWidth: 220 }}>Activity</th>
              {raciCols.map(c => (
                <th key={c.idx} style={{ fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff', background: '#000', padding: '8px 6px', textAlign: 'center', minWidth: 96, verticalAlign: 'bottom' }}>{c.role}</th>
              ))}
            </tr>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 10, color: '#666', padding: '6px 10px', position: 'sticky', left: 0, background: '#f4f4f4', zIndex: 2, borderBottom: '1px solid #000' }}>Name</th>
              {raciCols.map(c => (
                <th key={c.idx} style={{ padding: '4px 5px', background: '#f4f4f4', borderBottom: '1px solid #000' }}>
                  <input defaultValue={c.name} onBlur={(e) => app.editRaciName(c.idx, e.target.value)} placeholder="—" style={{ fontSize: 11, border: '1px solid rgba(0,0,0,0.18)', padding: 3, width: '100%' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {raciGroups.map((g, gi) => (
              <Fragment key={gi}>
                <tr><td style={{ background: '#000', color: '#fff', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '6px 10px' }} colSpan={99}>{g.name}</td></tr>
                {g.rows.map((r, ri) => (
                  <tr key={`${gi}-${ri}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <td style={{ fontSize: 12, padding: '5px 10px', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>{r.activity}</td>
                    {r.cells.map(cell => (
                      <td key={cell.key} style={{ padding: 2, textAlign: 'center' }}>
                        <select value={cell.mark} onChange={(e) => app.editRaciMark(cell.key, e.target.value)} style={cell.style}>
                          <option value=""></option><option value="R">R</option><option value="A">A</option><option value="C">C</option><option value="I">I</option><option value="A,R">A,R</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
