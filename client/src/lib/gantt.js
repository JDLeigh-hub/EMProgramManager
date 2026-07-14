import { parseDate, advance, today } from './dates.js';
import { defaultTimeline } from './project.js';
import { phasePctMap } from './stats.js';

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

export function computeGantt(proj) {
  const tl = proj.timeline || defaultTimeline();
  const engStart = parseDate(tl.engagementStart);
  const ucs = proj.useCases || [];
  const base = { ok: false, hasUseCases: ucs.length > 0, show: !!tl.show };
  if (!engStart) return { ...base, render: false, needsStart: !!tl.show, hasToday: false, reason: 'Set an engagement start date above, then generate the timeline.' };

  const shared = tl.stages.filter(s => s.scope === 'shared');
  const perUc = tl.stages.filter(s => s.scope === 'usecase');
  const phasePct = phasePctMap(proj);
  const bd = tl.businessDays !== false;

  let cursor = engStart; const sharedBars = [];
  shared.forEach(s => { const start = cursor; const end = advance(start, Math.max(1, s.days), bd); sharedBars.push({ s, start, end }); cursor = end; });
  const sharedEnd = cursor;

  const ucGroups = ucs.map(uc => {
    let c = parseDate(tl.ucStarts[uc.id]) || sharedEnd;
    const bars = perUc.map(s => { const start = c; const end = advance(start, Math.max(1, s.days), bd); c = end; return { s, start, end }; });
    return { uc, start: parseDate(tl.ucStarts[uc.id]) || sharedEnd, end: c, bars };
  });

  let min = engStart, max = sharedEnd;
  ucGroups.forEach(g => { if (g.start < min) min = g.start; if (g.end > max) max = g.end; });
  const span = Math.max(1, (max - min));
  const totalDays = Math.round(span / 86400000);
  const pctOf = (d) => ((d - min) / span * 100);
  const fmtDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const mkRow = (bar, uc, color) => {
    const left = pctOf(bar.start), w = Math.max(0.5, pctOf(bar.end) - pctOf(bar.start));
    const prog = uc ? ucStageProgress(uc, bar.s.key) : phasePct(bar.s.phase);
    const days = Math.round((bar.end - bar.start) / 86400000);
    return {
      label: bar.s.label, dates: fmtDate(bar.start) + ' – ' + fmtDate(bar.end), daysLabel: days + 'd',
      progPct: prog + '%', title: bar.s.label + ': ' + fmtDate(bar.start) + ' – ' + fmtDate(bar.end) + ' · ' + prog + '% complete',
      barStyle: { position: 'absolute', top: 6, height: 20, left: left.toFixed(2) + '%', width: w.toFixed(2) + '%', background: color.track, border: '1px solid ' + color.fill, overflow: 'hidden' },
      fillStyle: { position: 'absolute', left: 0, top: 0, bottom: 0, width: prog + '%', background: color.fill },
    };
  };

  const headStyleFor = (c) => ({ display: 'grid', gridTemplateColumns: '210px 1fr', background: c.fill, color: '#fff' });
  const groups = [];
  groups.push({ name: 'Engagement setup — one-time', meta: fmtDate(engStart) + ' – ' + fmtDate(sharedEnd), headStyle: headStyleFor(SHARED_COLOR), rows: sharedBars.map(b => mkRow(b, null, SHARED_COLOR)) });
  ucGroups.forEach((g, i) => {
    const c = PALETTE[i % PALETTE.length];
    groups.push({ name: g.uc.name || g.uc.code || 'Use case', meta: 'Starts ' + fmtDate(g.start) + (g.uc.status ? ' · ' + g.uc.status : ''), headStyle: headStyleFor(c), rows: g.bars.map(b => mkRow(b, g.uc, c)) });
  });

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

  return {
    ...base, ok: true, render: !!tl.show, needsStart: false, hasToday: todayLeft != null, groups, months, trackBg, todayLeft,
    rangeLabel: fmtDate(min) + ' – ' + fmtDate(max), totalDaysLabel: totalDays + ' days · ' + (bd ? 'business days' : 'calendar days'),
  };
}
