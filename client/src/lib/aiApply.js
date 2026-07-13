import { uid } from './id.js';
import { pick } from './workbookImport.js';

export function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

export function clean(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (/^(not specified|not stated|not provided|unspecified|n\/?a|none|unknown|tbd|null)$/i.test(s)) return '';
  return s;
}

export function matchChecklistItem(proj, query) {
  const qWords = norm(query).split(' ').filter(w => w.length > 2);
  if (!qWords.length) return null;
  let best = null, bestScore = 0;
  proj.checklist.forEach(it => {
    const hay = norm(it.item + ' ' + it.subsection + ' ' + it.section);
    let score = 0; qWords.forEach(w => { if (hay.includes(w)) score++; });
    const ratio = score / qWords.length;
    if (score > bestScore && ratio >= 0.5) { bestScore = score; best = it; }
  });
  return best;
}

// Builds the AI review-modal view-model from a raw proposal + checked map.
export function buildAiView({ aiOpen, aiFileName, aiProposal, aiChecked }) {
  const base = { open: aiOpen, fileName: aiFileName, summary: (aiProposal && aiProposal.docSummary) || '', hasSummary: !!(aiProposal && aiProposal.docSummary), sections: [], selectedCount: 0, empty: true };
  if (!aiProposal) return base;
  const data = aiProposal;
  const sections = []; let count = 0;
  const add = (key, title, arr, labeler, detailer) => {
    if (!arr || !arr.length) return;
    const items = arr.map((x, i) => {
      const k = key + ':' + i; const checked = !!aiChecked[k]; if (checked) count++;
      const detail = detailer ? detailer(x, i) : '';
      return { key: k, checked, label: labeler(x, i) || '(untitled)', detail, hasDetail: !!detail };
    });
    sections.push({ key, title: title + ' (' + arr.length + ')', items });
  };
  if (data.projectMeta && Object.values(data.projectMeta).some(v => v && String(v).trim())) {
    const m = data.projectMeta; const parts = [];
    if (m.client) parts.push('Client: ' + m.client); if (m.em) parts.push('EM: ' + m.em);
    if (m.phase) parts.push('Phase: ' + m.phase); if (m.targetDate) parts.push('Target: ' + m.targetDate);
    const k = 'meta:0'; const checked = !!aiChecked[k]; if (checked) count++;
    sections.push({ key: 'meta', title: 'Project details', items: [{ key: k, checked, label: parts.join('  ·  '), detail: '', hasDetail: false }] });
  }
  add('uc', 'Use cases', data.useCases, x => x.name, x => [x.problem, x.metric].filter(Boolean).join(' — '));
  add('kpi', 'KPIs', data.kpis, x => x.name, x => [x.category, (x.baseline != null && x.baseline !== '' ? 'base ' + x.baseline : ''), (x.target != null && x.target !== '' ? 'target ' + x.target : ''), x.unit].filter(Boolean).join(' · '));
  add('sk', 'Stakeholders', data.stakeholders, x => (x.name || '') + (x.role ? ' — ' + x.role : ''), x => [x.group, x.tier, x.posture].filter(Boolean).join(' · '));
  add('raci', 'RACI markings', data.raci, x => x.activity, x => (x.assignments || []).map(a => a.role + ': ' + a.mark).join(', '));
  add('cl', 'Checklist updates', data.checklistUpdates, x => x.itemQuery, x => [x.owner && ('owner ' + x.owner), x.due && ('due ' + x.due), x.status].filter(Boolean).join(' · '));
  add('bl', 'Value Baseline answers', data.baseline, x => x.topic, x => (x.answer || '').slice(0, 140));
  base.sections = sections; base.selectedCount = count; base.empty = sections.length === 0;
  return base;
}

// Mutates `p` (a draft project, already deep-cloned by the caller) by
// applying the checked subset of an AI proposal.
export function applyAiToProject(p, T, data, chk, aiFileName) {
  if (!p.library) p.library = [];
  if (chk['meta:0'] && data.projectMeta) {
    const m = data.projectMeta;
    const mc = clean(m.client), me = clean(m.em), mp = clean(m.phase), mt = clean(m.targetDate);
    if (mc && !p.client) { p.client = mc; if (p.baseline && !p.baseline.account) p.baseline.account = mc; }
    if (me && !p.em) { p.em = me; if (p.baseline && !p.baseline.em) p.baseline.em = me; }
    if (mp) p.phase = mp;
    if (mt && /^\d{4}-\d{2}-\d{2}/.test(mt)) p.targetDate = mt.slice(0, 10);
  }
  (data.useCases || []).forEach((u, i) => {
    if (!chk['uc:' + i]) return;
    p.useCases.push({ id: uid('uc'), code: 'UC-' + String(p.useCases.length + 1).padStart(3, '0'), name: u.name || '', problem: u.problem || '', outcome: u.outcome || '', priority: pick(u.priority, ['High', 'Medium', 'Low'], 'Medium'), phase: 'Phase 1', ownerCust: '', ownerAdobe: '', status: pick(u.status, ['Candidate', 'Backlog', 'In discovery', 'In build', 'UAT', 'Live', 'Deprioritized'], 'Candidate'), target: '', metric: u.metric || '', notes: 'From ' + aiFileName });
  });
  (data.kpis || []).forEach((k, i) => {
    if (!chk['kpi:' + i]) return;
    p.kpis.push({ id: uid('kpi'), code: 'KPI-' + String(p.kpis.length + 1).padStart(3, '0'), category: k.category || '', name: k.name || '', useCase: k.useCase || '', unit: k.unit || '', baseline: k.baseline == null ? '' : String(k.baseline), target: k.target == null ? '' : String(k.target), current: k.current == null ? '' : String(k.current), status: 'Baseline pending', notes: '' });
  });
  (data.stakeholders || []).forEach((s, i) => {
    if (!chk['sk:' + i]) return;
    const group = pick(s.group, T.stakeholderGroups, T.stakeholderGroups[0]);
    p.stakeholders.push({ id: uid('sk'), group, name: s.name || '', role: s.role || '', tier: pick(s.tier, ['Decision Authority', 'Network Influencer', 'Impacted Constituency'], 'Network Influencer'), posture: pick(s.posture, ['Champion', 'Supportive', 'Neutral', 'Skeptical', 'Blocker'], 'Neutral'), value: s.value || '' });
  });
  (data.raci || []).forEach((r, i) => {
    if (!chk['raci:' + i]) return;
    let gi = -1, ri = -1;
    T.raciGroups.forEach((g, gx) => g.rows.forEach((row, rx) => { if (norm(row[0]) === norm(r.activity) || norm(row[0]).includes(norm(r.activity)) || norm(r.activity).includes(norm(row[0]))) { if (gi < 0) { gi = gx; ri = rx; } } }));
    if (gi < 0) return;
    (r.assignments || []).forEach(a => {
      const rk = T.raciRoles.findIndex(role => norm(role) === norm(a.role) || norm(role).includes(norm(a.role))); if (rk < 0) return;
      const mk = String(a.mark || '').toUpperCase().replace(/\s/g, ''); if (['R', 'A', 'C', 'I', 'A,R'].includes(mk)) p.raciMarks[gi + '-' + ri + '-' + rk] = mk;
    });
  });
  (data.checklistUpdates || []).forEach((c, i) => {
    if (!chk['cl:' + i]) return;
    const it = matchChecklistItem(p, c.itemQuery); if (!it) return;
    if (c.owner) it.owner = c.owner;
    if (c.due && /^\d{4}-\d{2}-\d{2}/.test(c.due)) it.due = c.due.slice(0, 10);
    if (c.status) it.status = pick(c.status, ['Not started', 'In progress', 'Blocked', 'Done', 'N/A'], it.status || 'Not started');
    if (c.notes) it.notes = (it.notes ? it.notes + ' · ' : '') + c.notes;
  });
  (data.baseline || []).forEach((b, i) => {
    if (!chk['bl:' + i]) return;
    let qi = T.valueBaselineQuestions.findIndex(q => norm(q.topic) === norm(b.topic) || (b.topic || '').toUpperCase().includes(q.id));
    if (qi < 0) qi = T.valueBaselineQuestions.findIndex(q => norm(q.topic).includes(norm(b.topic)) || norm(b.topic).includes(norm(q.topic)));
    if (qi < 0) return;
    if (!p.baseline.answers[qi]) p.baseline.answers[qi] = { answer: '', sources: '', stakeholders: '' };
    if (b.answer) p.baseline.answers[qi].answer = b.answer;
    if (b.sources) p.baseline.answers[qi].sources = b.sources;
  });
}
