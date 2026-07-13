import { uid } from './id.js';

export function defaultTimeline() {
  return {
    engagementStart: '', show: false, businessDays: true, ucStarts: {},
    stages: [
      { key: 'mobilize', label: 'Mobilize & access', days: 10, scope: 'shared', phase: 'Pre-kickoff' },
      { key: 'kickoff', label: 'Kickoff', days: 5, scope: 'shared', phase: 'Kickoff' },
      { key: 'discovery', label: 'Discovery & design', days: 15, scope: 'usecase', phase: 'Discovery' },
      { key: 'build', label: 'Build & configuration', days: 20, scope: 'usecase', phase: 'Implementation' },
      { key: 'uat', label: 'UAT & acceptance', days: 10, scope: 'usecase', phase: 'Implementation' },
      { key: 'launch', label: 'Launch & adoption', days: 10, scope: 'usecase', phase: 'Launch' },
      { key: 'value', label: 'Value realization', days: 20, scope: 'usecase', phase: 'Value' },
    ],
  };
}

export function ensureTimeline(p) {
  if (!p.timeline) p.timeline = defaultTimeline();
  if (!p.timeline.ucStarts) p.timeline.ucStarts = {};
  return p.timeline;
}

export function blankProject(T, name, client, em, target) {
  const checklist = T.checklist.map(c => ({ id: c.id, section: c.section, subsection: c.subsection, item: c.item, owner: '', due: '', status: '', notes: '' }));
  const plan = T.plan.map(p => ({ id: p.id, phase: p.phase, workstream: p.workstream, task: p.task, deps: p.deps || '', owner: '', start: '', end: '', pct: 0, status: 'Not started', notes: p.note || '' }));
  const raciMarks = {};
  T.raciGroups.forEach((g, gi) => g.rows.forEach((r, ri) => { for (let k = 1; k < r.length; k++) { if (r[k]) raciMarks[gi + '-' + ri + '-' + (k - 1)] = r[k]; } }));
  const baseline = { account: client, em, date: '', answers: T.valueBaselineQuestions.map(() => ({ answer: '', sources: '', stakeholders: '' })) };
  return {
    id: uid('P'), name, client, em, phase: 'Pre-kickoff', targetDate: target, createdAt: Date.now(), updatedAt: Date.now(),
    checklist, plan, raciNames: {}, raciMarks, baseline, useCases: [], kpis: [], hypotheses: [], stakeholders: [], library: [],
    timeline: defaultTimeline(),
  };
}
