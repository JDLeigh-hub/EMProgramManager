import { useEngagement } from '../../store/EngagementContext.jsx';

export default function ValueBaseline({ proj }) {
  const app = useEngagement();
  const T = app.T;
  const baseline = proj.baseline;
  const rows = T.valueBaselineQuestions.map((qd, i) => ({
    id: qd.id, topic: qd.topic, prompt: qd.prompt, idx: i,
    answer: (baseline.answers[i] || {}).answer || '', sources: (baseline.answers[i] || {}).sources || '', stakeholders: (baseline.answers[i] || {}).stakeholders || '',
  }));

  return (
    <div className="rise-in" style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 350 }}>Value Baseline</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Internal · not customer-facing. Ramp to Value account primer. Answer only from explicit sources (JSP, sales handoff, MAP, DSG, earnings, discovery). If no source, write "NULL — no source found."</div>
      <div style={{ display: 'flex', gap: 12, margin: '16px 0 24px' }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Account</FieldLabel>
          <input defaultValue={baseline.account} onBlur={(e) => app.editBaselineHead('account', e.target.value)} style={headInput} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Engagement Manager</FieldLabel>
          <input defaultValue={baseline.em} onBlur={(e) => app.editBaselineHead('em', e.target.value)} style={headInput} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Date</FieldLabel>
          <input type="date" defaultValue={baseline.date} onChange={(e) => app.editBaselineHead('date', e.target.value)} style={headInput} />
        </div>
      </div>

      {rows.map(q => (
        <div key={q.id} style={{ border: '1px solid rgba(0,0,0,0.15)', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, padding: '12px 16px', background: '#f7f7f7', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 350, flexShrink: 0, width: 44 }}>{q.id}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{q.topic}</div>
              <div style={{ fontSize: 12, color: '#3e3e3e', marginTop: 3, lineHeight: 1.45 }}>{q.prompt}</div>
            </div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <textarea defaultValue={q.answer} onBlur={(e) => app.editBaseline(q.idx, 'answer', e.target.value)} rows={2} placeholder="Answer…" style={answerTextarea} />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <input defaultValue={q.sources} onBlur={(e) => app.editBaseline(q.idx, 'sources', e.target.value)} placeholder="Source(s) cited" style={{ ...smallInput, flex: 2 }} />
              <input defaultValue={q.stakeholders} onBlur={(e) => app.editBaseline(q.idx, 'stakeholders', e.target.value)} placeholder="Stakeholder(s)" style={{ ...smallInput, flex: 1 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>{children}</div>;
}

const headInput = { fontSize: 13, border: '1px solid rgba(0,0,0,0.18)', padding: 6, width: '100%', marginTop: 4 };
const answerTextarea = { width: '100%', fontSize: 13, border: '1px solid rgba(0,0,0,0.18)', padding: 8, resize: 'vertical', fontFamily: 'var(--font-sans)' };
const smallInput = { fontSize: 12, border: '1px solid rgba(0,0,0,0.15)', padding: 6 };
