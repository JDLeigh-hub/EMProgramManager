import { useMemo } from 'react';
import { useEngagement } from '../store/EngagementContext.jsx';
import { computeStats } from '../lib/stats.js';
import { healthStyle } from '../lib/styleHelpers.js';
import { fmt } from '../lib/dates.js';
import Dashboard from './tabs/Dashboard.jsx';
import Checklist from './tabs/Checklist.jsx';
import Plan from './tabs/Plan.jsx';
import UseCases from './tabs/UseCases.jsx';
import Kpis from './tabs/Kpis.jsx';
import Raci from './tabs/Raci.jsx';
import ValueBaseline from './tabs/ValueBaseline.jsx';
import ValueHypothesis from './tabs/ValueHypothesis.jsx';
import Stakeholders from './tabs/Stakeholders.jsx';
import Library from './tabs/Library.jsx';

const TAB_DEFS = [
  ['dashboard', 'Overview'], ['checklist', 'Checklist'], ['plan', 'Project Plan'], ['usecases', 'Use Cases'],
  ['kpis', 'KPIs & Value'], ['raci', 'RACI'], ['baseline', 'Value Baseline'], ['hypothesis', 'Value Hypothesis'],
  ['stakeholders', 'Stakeholders'], ['library', 'Library'],
];

export default function ProjectWorkspace() {
  const app = useEngagement();
  const proj = app.cur();
  const dash = useMemo(() => proj ? computeStats(proj, app.dueSoonDays) : null, [proj, app.dueSoonDays]);

  if (!proj || !dash) return null;

  const metaBits = [];
  if (proj.client) metaBits.push(proj.client);
  if (proj.em) metaBits.push('EM: ' + proj.em);
  if (proj.targetDate) metaBits.push('Target ' + fmt(proj.targetDate));

  return (
    <div className="fade-in">
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '2px solid #000' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <button onClick={app.goHome} style={backLink}>← All projects</button>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 6 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 350, fontSize: 34, letterSpacing: '-0.02em', margin: 0 }}>{proj.name}</h1>
                <span style={healthStyle(dash.health)}>{dash.health}</span>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{metaBits.join('  ·  ') || 'New engagement'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingTop: 22 }}>
              <div style={{ textAlign: 'right' }} title={dash.overallBreakdown}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 350, lineHeight: 1 }}>{dash.overallStr}</div>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666' }}>Overall progress</div>
              </div>
              <button onClick={app.openHelp} title="How to use Engagement OS" style={helpBtn}>?</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 16, overflowX: 'auto' }}>
            {TAB_DEFS.map(([id, label]) => {
              const active = app.ui.tab === id;
              return (
                <button key={id} onClick={() => app.goTab(id)} style={{
                  flexShrink: 0, border: 0, borderBottom: '2px solid ' + (active ? '#000' : 'transparent'), background: 'none',
                  padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.04em',
                  color: active ? '#000' : '#888', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap',
                }}>{label}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 40px 100px' }}>
        {app.ui.tab === 'dashboard' && <Dashboard proj={proj} dash={dash} />}
        {app.ui.tab === 'checklist' && <Checklist proj={proj} />}
        {app.ui.tab === 'plan' && <Plan proj={proj} />}
        {app.ui.tab === 'usecases' && <UseCases proj={proj} />}
        {app.ui.tab === 'kpis' && <Kpis proj={proj} />}
        {app.ui.tab === 'raci' && <Raci proj={proj} />}
        {app.ui.tab === 'baseline' && <ValueBaseline proj={proj} />}
        {app.ui.tab === 'hypothesis' && <ValueHypothesis proj={proj} />}
        {app.ui.tab === 'stakeholders' && <Stakeholders proj={proj} />}
        {app.ui.tab === 'library' && <Library proj={proj} />}
      </div>
    </div>
  );
}

const backLink = { border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666' };
const helpBtn = { width: 36, height: 36, flexShrink: 0, border: '1px solid rgba(0,0,0,0.25)', background: '#fff', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: 17 };
