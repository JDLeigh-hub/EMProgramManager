import { useEngagement } from '../../store/EngagementContext.jsx';

export default function HelpPanel() {
  const app = useEngagement();
  if (!app.ui.helpOpen) return null;

  return (
    <div style={overlay} onClick={app.closeHelp}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}>Engagement OS</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 350 }}>Guide</div>
          </div>
          <button onClick={app.closeHelp} style={closeBtn}>×</button>
        </div>
        <div style={{ padding: '24px 28px 60px' }}>
          <div style={label}>Five things to remember</div>
          <ol style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 300, lineHeight: 1.5, paddingLeft: 22, marginTop: 8 }}>
            <li>Lock the first use case fast — scope, owner, success metric.</li>
            <li>Get the right customer owners engaged early on every workstream.</li>
            <li>Build a single source of truth and keep it current.</li>
            <li>Track risks, decisions, and scope changes aggressively in Notes.</li>
            <li>Treat adoption and value realization as part of delivery, not a postscript.</li>
          </ol>

          <div style={{ ...label, marginTop: 28, borderTop: '1px solid #000', paddingTop: 16 }}>Must-haves to kickoff (W0)</div>
          <div style={body}>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>5 things that must be true before kickoff:</p>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Contract executed (SOW / innovation-lab SKU signed)</li>
              <li>Single use case agreed in the JSP (Validate POC or Instruct to Assemble POC)</li>
              <li>Adobe pod assigned (EM · FDE Lead · AI/ML Scientist · PM-of-record)</li>
              <li>Customer POCs identified (Exec Sponsor + day-to-day lead + technical/data lead + brand/creative lead)</li>
              <li>Pilot success metrics signed off (measurable, from JSP)</li>
            </ol>
            <p style={{ marginTop: 10 }}><b>Hydration dependency:</b> brand kits, approved assets, briefs, compliance rules, and ~40K–50K annotations must be accessible before Build. FDE owns setup; customer owns access.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#000', color: '#fff' }}>
                <th style={kickoffTh}>#</th>
                <th style={kickoffTh}>Deliverable</th>
                <th style={kickoffTh}>Output</th>
              </tr>
            </thead>
            <tbody>
              {RECOMMENDED_DELIVERABLES.map((row) => (
                <tr key={row.n} style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                  <td style={kickoffTd}>{row.n}</td>
                  <td style={{ ...kickoffTd, fontWeight: 700 }}>{row.deliverable}</td>
                  <td style={kickoffTd}>{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ ...body, marginTop: 10, fontWeight: 700, fontStyle: 'italic' }}>Best EM operating principle: one workflow, one use case, one KPI set — then expand.</p>

          <div style={{ ...label, marginTop: 28, borderTop: '1px solid #000', paddingTop: 16 }}>How to use it</div>
          <div style={body}>
            <p><b>Overview</b> is your status page — project health, blocked and overdue work (checklist items and plan tasks are tagged), plus condensed checklist and plan progress. Its centrepiece is <b>Use cases &amp; value</b>: each use case with its linked KPIs and % to target. Open it before every status meeting.</p>
            <p><b>Checklist</b> is the 182-item master tracker. Assign owners, set due dates, update status weekly. Mark items N/A when they don't apply — they drop out of the % complete denominator.</p>
            <p><b>Project Plan</b> turns one engagement start date into a colour-coded timeline (a track per use case) plus milestone task detail. Use it for phase narrative; the Checklist for execution detail.</p>
            <p><b>Use Cases</b> holds your committed repository and a <b>Browse menu</b> of Firefly capabilities to promote from — both under one tab. In <b>KPIs &amp; Value</b>, every KPI links to a use case and % to target updates automatically.</p>
            <p><b>Value Baseline, Value Hypothesis</b> and the <b>Stakeholder Value Map</b> are the Value Realization Framework — do them, don't skip them.</p>
            <p style={{ color: '#666' }}>Use cases, KPIs and stakeholders show as clean read-only cards — click <b>Edit</b> on any card (or <b>Add</b>) to enter or change values, then <b>Done</b>.</p>
          </div>

          <div style={{ ...label, marginTop: 28, borderTop: '1px solid #000', paddingTop: 16 }}>Resource Library &amp; auto-fill</div>
          <div style={body}>
            <p>Upload the engagement's source files (SOW, kickoff deck, discovery notes, KPI sheets) to the <b>Library</b> tab. Click <b>Auto-fill</b> on any file and Claude reads it, then proposes use cases, KPIs, RACI markings, stakeholders, checklist owners/dates and baseline answers. Nothing is written until you review and apply.</p>
          </div>

          <div style={{ ...label, marginTop: 28, borderTop: '1px solid #000', paddingTop: 16 }}>Suggested cadence</div>
          <div style={body}>
            <p><b>Monday</b> — Open <b>My Week</b>. Clear overdue, review Checklist filtered to Blocked + In progress, refresh Plan % on active tasks.</p>
            <p><b>Friday</b> — Update status on items closed this week. Validate next week's workshops. Update the Stakeholder Value Map with new signals.</p>
            <p><b>Monthly</b> — Update KPIs with current readings. Review use-case phase progression. Confirm Value Hypothesis assumptions still hold.</p>
          </div>

          <div style={{ ...label, marginTop: 28, borderTop: '1px solid #000', paddingTop: 16 }}>New engagements</div>
          <div style={body}>
            <p>From the Master Book, click <b>+ New project</b> for a fresh copy of the whole template, or <b>Import workbook</b> to rebuild a project from a filled-in master spreadsheet. <b>Duplicate</b> clones a project with its data; <b>Export all</b> / <b>Import backup</b> move everything between devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 110 };
const panel = { position: 'absolute', top: 0, right: 0, height: '100%', width: 560, maxWidth: '94vw', background: '#fff', borderLeft: '2px solid #000', overflowY: 'auto' };
const header = { position: 'sticky', top: 0, background: '#fff', borderBottom: '2px solid #000', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtn = { width: 34, height: 34, border: '1px solid rgba(0,0,0,0.25)', background: '#fff', cursor: 'pointer', fontSize: 16 };
const label = { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666', fontWeight: 700 };
const body = { fontSize: 13.5, lineHeight: 1.6, color: '#1a1a1a', marginTop: 8 };
const kickoffTh = { textAlign: 'left', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 8px', fontWeight: 700 };
const kickoffTd = { textAlign: 'left', padding: '6px 8px', verticalAlign: 'top' };

const RECOMMENDED_DELIVERABLES = [
  { n: 1, deliverable: 'Discovery & value map', output: 'Objectives, pain points, KPIs, exec sponsor, target users' },
  { n: 2, deliverable: 'Use Case Definition', output: '2–3 scoped use cases with entry/exit + success criteria' },
  { n: 3, deliverable: 'Current-State Discovery', output: 'End-to-end workflow maps, tools/data flows, bottlenecks' },
  { n: 4, deliverable: 'Input Asset Collection', output: 'Brand-input package + confirmed access; pilot readout vs baseline' },
];
