import { useEngagement } from '../../store/EngagementContext.jsx';

export default function IntegrationsModal() {
  const app = useEngagement();
  if (!app.ui.integrationsOpen) return null;

  return (
    <div style={overlay} onClick={app.closeIntegrations}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderBottom: '2px solid #000', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}>Roadmap</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350, marginTop: 3 }}>Calendar &amp; Slack in My Week</div>
        </div>
        <div style={{ padding: '22px 24px', fontSize: 13.5, lineHeight: 1.6, color: '#1a1a1a' }}>
          <p style={{ marginTop: 0 }}>Live calendar and Slack sync needs a small server and each user's sign-in, so it switches on once Engagement OS is deployed rather than running purely from the browser. Here's the plan and why it's worth it.</p>
          <div style={label}>Calendar (Google / Outlook)</div>
          <p><b>How:</b> OAuth sign-in, then read your events for the week and overlay them on the same board next to project tasks. Two-way optional — push a task's due date as a calendar event.<br /><b>Value:</b> one screen shows client meetings <i>and</i> the deliverables they depend on, so you spot the workshop with no prep task behind it before Monday.</p>
          <div style={label}>Slack</div>
          <p><b>How:</b> a Slack app posts your Monday "My Week" digest and any newly-blocked or overdue items to your project channel or DM; optionally turn a flagged message into a checklist item.<br /><b>Value:</b> the book stays current without anyone opening it, and blockers surface in the channel where they get unblocked.</p>
          <div style={label}>Lightweight interim option</div>
          <p>Before a full build, My Week can publish a read-only <b>.ics</b> feed your calendar subscribes to (tasks appear as all-day events) and accept an incoming Slack webhook for the weekly digest — no per-user login required.</p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
          <button onClick={app.closeIntegrations} style={gotItBtn}>Got it</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 };
const panel = { background: '#fff', width: 620, maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #000', boxShadow: '10px 10px 0 rgba(0,0,0,0.25)' };
const label = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginTop: 18 };
const gotItBtn = { flex: 1, padding: 14, border: 0, background: '#000', color: '#fff', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' };
