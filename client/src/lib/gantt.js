import { parseDate, advance, today } from './dates.js';
import { defaultTimeline } from './project.js';
import { phasePctMap } from './stats.js';
import { GANTT_PHASE_ORDER, taskPhaseGroup } from './phases.js';

function ucStageProgress(uc, key) {
  const order = ['discovery', 'build', 'uat', 'launch', 'value'];
  const rank = { 'in discovery': 0, 'in build': 1, 'uat': 2, 'live': 4 };
  const st = (uc.status || '').toLowerCase();
  let active = (st in rank) ? rank[st] : -1;
  const idx = order.indexOf(key); if (idx < 0) return 0;
  if (idx < active) return 100; if (idx === active) return 40; return 0;
}

const PALETTE = [
  { fill: '#2A6FDB', track: '#DCE6FA' }, { fill: '#1F8A5B', track: '#D6EBE0' },
  { fill: '#C6552B', track: '#F5E1D6' }, { fill: '#6E4FB0', track: '#E6DFF3' },
  { fill: '#B0870F', track: '#F2E9CF' }, { fill: '#2E8B8B', track: '#D7ECEC' },
];
const SHARED_COLOR = { fill: '#3E3E3E', track: '#E6E6E6' };
const fmtDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Shared date math: every bar (shared stages + every use case's per-use-case
// stages), always computed for the WHOLE project regardless of any Gantt
// view-by filter. Both computeGantt (rows) and computeTimelinePhases
// (summary cards) build on this so the underlying schedule never diverges.
function buildBars(proj) {
  const tl = proj.timeline || defaultTimeline();
  const engStart = parseDate(tl.engagementStart);
  const ucs = proj.useCases || [];
  if (!engStart) return null;

  const shared = tl.stages.filter(s => s.scope === 'shared');
  const perUc = tl.stages.filter(s => s.scope === 'usecase');
  const bd = tl.businessDays !== false;

  let cursor = engStart; const sharedBars = [];
  shared.forEach(s => { const start = cursor; const end = advance(start, Math.max(1, s.days), bd); sharedBars.push({ s, start, end }); cursor = end; });
  const sharedEnd = cursor;

  const ucGroups = ucs.map((uc, i) => {
    let c = parseDate(tl.ucStarts[uc.id]) || sharedEnd;
    const bars = perUc.map(s => { const start = c; const end = advance(start, Math.max(1, s.days), bd); c = end; return { s, start, end }; });
    return { uc, color: PALETTE[i % PALETTE.length], start: parseDate(tl.ucStarts[uc.id]) || sharedEnd, end: c, bars };
  });

  let min = engStart, max = sharedEnd;
  ucGroups.forEach(g => { if (g.start < min) min = g.start; if (g.end > max) max = g.end; });
  const span = Math.max(1, (max - min));
  const totalDays = Math.round(span / 86400000);

  return { tl, engStart, sharedBars, sharedEnd, ucGroups, min, max, span, totalDays, bd };
}

// viewBy: 'all' shows every use case's rows; a use-case id restricts the
// per-use-case bands to just that use case (shared/Kickoff rows always show).
export function computeGantt(proj, viewBy = 'all') {
  const ucs = proj.useCases || [];
  const base = { ok: false, hasUseCases: ucs.length > 0, show: !!(proj.timeline || {}).show };
  const built = buildBars(proj);
  if (!built) return { ...base, render: false, needsStart: !!base.show, hasToday: false, reason: 'Set an engagement start date above, then generate the timeline.' };
  const { tl, sharedBars, ucGroups, min, max, span, totalDays, bd } = built;

  const phasePct = phasePctMap(proj);
  const pctOf = (d) => ((d - min) / span * 100);

  const mkRow = (bar, uc, color) => {
    const left = pctOf(bar.start), w = Math.max(0.5, pctOf(bar.end) - pctOf(bar.start));
    const prog = uc ? ucStageProgress(uc, bar.s.key) : phasePct(bar.s.phase);
    const days = Math.round((bar.end - bar.start) / 86400000);
    const ucLabel = uc ? (uc.name || uc.code || 'Use case') : null;
    return {
      label: bar.s.label, dates: fmtDate(bar.start) + ' – ' + fmtDate(bar.end), daysLabel: days + 'd',
      ucLabel, ucTagStyle: uc ? { color: color.fill, fontWeight: 700 } : null,
      title: bar.s.label + (ucLabel ? ' · ' + ucLabel : '') + ': ' + fmtDate(bar.start) + ' – ' + fmtDate(bar.end) + ' · ' + prog + '% complete',
      barStyle: { position: 'absolute', top: 6, height: 20, left: left.toFixed(2) + '%', width: w.toFixed(2) + '%', background: color.track, border: '1px solid ' + color.fill, overflow: 'hidden' },
      fillStyle: { position: 'absolute', left: 0, top: 0, bottom: 0, width: prog + '%', background: color.fill },
    };
  };

  const bandRows = {};
  GANTT_PHASE_ORDER.forEach(ph => { bandRows[ph] = []; });
  sharedBars.forEach(b => { bandRows[taskPhaseGroup(b.s.phase)].push(mkRow(b, null, SHARED_COLOR)); });
  ucGroups.forEach(g => {
    if (viewBy !== 'all' && viewBy !== g.uc.id) return;
    g.bars.forEach(b => { bandRows[taskPhaseGroup(b.s.phase)].push(mkRow(b, g.uc, g.color)); });
  });

  const groups = GANTT_PHASE_ORDER.map(ph => ({ name: ph, rows: bandRows[ph], empty: bandRows[ph].length === 0 }));

  const months = [];
  let mm = new Date(min.getFullYear(), min.getMonth(), 1);
  while (mm <= max) {
    const l = pctOf(mm);
    if (l >= -2 && l <= 101) months.push({ label: mm.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), leftPct: Math.max(0, l).toFixed(2) + '%' });
    mm = new Date(mm.getFullYear(), mm.getMonth() + 1, 1);
  }
  const weekPct = (7 / totalDays * 100);
  const trackBg = { backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${weekPct.toFixed(3)}%)` };
  const t0 = today();
  const todayLeft = (t0 >= min && t0 <= max) ? pctOf(t0).toFixed(2) + '%' : null;

  const legend = ucGroups.map(g => ({ id: g.uc.id, name: g.uc.name || g.uc.code || 'Use case', color: g.color.fill }));

  return {
    ...base, ok: true, render: !!tl.show, needsStart: false, hasToday: todayLeft != null, groups, months, trackBg, todayLeft, legend,
    rangeLabel: fmtDate(min) + ' – ' + fmtDate(max), totalDaysLabel: totalDays + ' days · ' + (bd ? 'business days' : 'calendar days'),
  };
}

// Per-phase rollup used by the Timeline Planner cards and the Executive
// Summary view: always computed for the whole project (every use case),
// independent of the Gantt's own view-by filter.
export function computeTimelinePhases(proj) {
  const tl = proj.timeline || defaultTimeline();
  const stagesByPhase = {};
  GANTT_PHASE_ORDER.forEach(ph => { stagesByPhase[ph] = []; });
  tl.stages.forEach(s => { stagesByPhase[taskPhaseGroup(s.phase)].push(s); });

  const built = buildBars(proj);
  const phasePct = computePlanPhasePct(proj.plan || []);

  const dateRangeFor = (ph) => {
    if (!built) return null;
    let min = null, max = null;
    built.sharedBars.forEach(b => { if (taskPhaseGroup(b.s.phase) !== ph) return; if (!min || b.start < min) min = b.start; if (!max || b.end > max) max = b.end; });
    built.ucGroups.forEach(g => g.bars.forEach(b => { if (taskPhaseGroup(b.s.phase) !== ph) return; if (!min || b.start < min) min = b.start; if (!max || b.end > max) max = b.end; }));
    return min && max ? { start: min, end: max, label: fmtDate(min) + ' – ' + fmtDate(max) } : null;
  };

  const ucCount = (proj.useCases || []).length;

  return GANTT_PHASE_ORDER.map(ph => {
    const stages = stagesByPhase[ph];
    const totalDays = stages.reduce((a, s) => a + (parseInt(s.days, 10) || 0), 0);
    const perUse = stages.some(s => s.scope === 'usecase');
    const range = dateRangeFor(ph);
    return {
      name: ph, stages, totalDays, perUse,
      ucCount: perUse ? ucCount : null,
      range, rangeLabel: range ? range.label : '—',
      pct: phasePct(ph),
    };
  });
}

function computePlanPhasePct(plan) {
  const sums = {};
  GANTT_PHASE_ORDER.forEach(ph => { sums[ph] = { n: 0, s: 0 }; });
  plan.forEach(t => {
    const ph = taskPhaseGroup(t.phase);
    const o = sums[ph]; o.n++;
    o.s += (parseInt(t.pct, 10) || 0) || (t.status === 'Done' ? 100 : 0);
  });
  return (ph) => (sums[ph] && sums[ph].n) ? Math.round(sums[ph].s / sums[ph].n) : 0;
}
