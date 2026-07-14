import { parseDate, today, fmt } from './dates.js';

export function kpiPct(k) {
  const b = parseFloat(k.baseline), t = parseFloat(k.target), c = parseFloat(k.current);
  if ([b, t, c].some(isNaN) || t === b) return null;
  return Math.round((c - b) / (t - b) * 100);
}

export function phasePctMap(proj) {
  const done = s => s === 'Done';
  const m = {};
  (proj.plan || []).forEach(x => { const k = x.phase; (m[k] = m[k] || { n: 0, s: 0 }); m[k].n++; m[k].s += (parseInt(x.pct, 10) || 0) || (done(x.status) ? 100 : 0); });
  return (k) => (m[k] && m[k].n) ? Math.round(m[k].s / m[k].n) : 0;
}

// Returns the full derived stats/dashboard view-model for one project.
// dueSoonDays mirrors the original component's configurable prop (default 7).
export function computeStats(p, dueSoonDays = 7) {
  const done = s => s === 'Done', na = s => s === 'N/A', blk = s => s === 'Blocked', ip = s => s === 'In progress';
  const cl = p.checklist, pl = p.plan;
  const cActive = cl.filter(x => !na(x.status));
  const cDone = cl.filter(x => done(x.status)).length;
  const cBlk = cl.filter(x => blk(x.status)).length;
  const cIp = cl.filter(x => ip(x.status)).length;
  const cPct = cActive.length ? Math.round(cDone / cActive.length * 100) : 0;

  const secMap = {};
  cl.forEach(x => { const k = x.section; (secMap[k] = secMap[k] || { section: k, total: 0, done: 0, ip: 0, blk: 0, na: 0 }); const o = secMap[k]; o.total++; if (done(x.status)) o.done++; else if (ip(x.status)) o.ip++; else if (blk(x.status)) o.blk++; else if (na(x.status)) o.na++; });
  const sections = Object.values(secMap).map(s => { const den = s.total - s.na; const pct = den ? Math.round(s.done / den * 100) : 0; return { section: s.section, pct, pctStr: pct + '%', barW: pct + '%', tally: s.done + '/' + den + (s.blk ? ' · ' + s.blk + ' blk' : '') }; });

  const pActive = pl.filter(x => !na(x.status));
  const pDone = pl.filter(x => done(x.status)).length;
  const pBlk = pl.filter(x => blk(x.status)).length;
  const pIp = pl.filter(x => ip(x.status)).length;
  const pPct = pActive.length ? Math.round(pDone / pActive.length * 100) : 0;

  const phMap = {};
  pl.forEach(x => { const k = x.phase; (phMap[k] = phMap[k] || { phase: k, total: 0, pctSum: 0 }); phMap[k].total++; phMap[k].pctSum += (parseInt(x.pct, 10) || 0) || (done(x.status) ? 100 : 0); });
  const phases = Object.values(phMap).map(s => { const pct = s.total ? Math.round(s.pctSum / s.total) : 0; return { phase: s.phase, pct, pctStr: pct + '%', barW: pct + '%' }; });

  const t0 = today();
  const soon = new Date(t0); soon.setDate(soon.getDate() + dueSoonDays);
  const dueItems = [];
  const consider = (src, name, meta, due, status) => {
    if (!due || done(status) || na(status)) return;
    const d = parseDate(due); if (!d) return; d.setHours(0, 0, 0, 0);
    const overdue = d < t0; const dueSoon = !overdue && d <= soon;
    if (overdue || dueSoon) dueItems.push({ src, name, meta, due, overdue });
  };
  cl.forEach(x => consider('Checklist', x.item, x.section + (x.owner ? ' · ' + x.owner : ''), x.due, x.status));
  pl.forEach(x => consider('Task', x.task, x.phase + (x.owner ? ' · ' + x.owner : ''), x.end, x.status));
  dueItems.sort((a, b) => new Date(a.due) - new Date(b.due));
  const overdue = dueItems.filter(x => x.overdue);

  const blocked = [];
  cl.forEach(x => { if (blk(x.status)) blocked.push({ src: 'Checklist', name: x.item, meta: x.section + (x.owner ? ' · ' + x.owner : '') + (x.due ? ' · due ' + fmt(x.due) : ''), notes: x.notes }); });
  pl.forEach(x => { if (blk(x.status)) blocked.push({ src: 'Task', name: x.task, meta: x.phase + (x.owner ? ' · ' + x.owner : ''), notes: x.notes }); });

  const ucStages = ['Candidate', 'Backlog', 'In discovery', 'In build', 'UAT', 'Live', 'Deprioritized'];
  const ucCounts = ucStages.map(s => ({ stage: s, count: p.useCases.filter(u => u.status === s).length }));
  const kpiPcts = p.kpis.map(k => kpiPct(k)).filter(v => v != null);
  const avgKpi = kpiPcts.length ? Math.round(kpiPcts.reduce((a, b) => a + b, 0) / kpiPcts.length) : 0;

  // ---- blended overall progress ----
  const ucStatusPct = { 'Candidate': 0, 'Backlog': 5, 'In discovery': 25, 'In build': 55, 'UAT': 80, 'Live': 100 };
  const ucVals = (p.useCases || []).filter(u => u.status !== 'Deprioritized').map(u => (u.status in ucStatusPct) ? ucStatusPct[u.status] : 0);
  const ucProg = ucVals.length ? Math.round(ucVals.reduce((a, b) => a + b, 0) / ucVals.length) : null;
  const comps = [
    { key: 'Use cases', w: 0.35, v: ucProg },
    { key: 'KPIs', w: 0.30, v: kpiPcts.length ? avgKpi : null },
    { key: 'Checklist', w: 0.20, v: cActive.length ? cPct : null },
    { key: 'Plan', w: 0.15, v: pActive.length ? pPct : null },
  ];
  const avail = comps.filter(c => c.v != null);
  const wsum = avail.reduce((a, c) => a + c.w, 0) || 1;
  const overall = avail.length ? Math.round(avail.reduce((a, c) => a + c.v * c.w, 0) / wsum) : 0;
  const overallBreakdown = comps.map(c => c.key + ' ' + (c.v == null ? '—' : c.v + '%')).join('  ·  ');
  const overallParts = comps.map(c => ({ key: c.key, val: c.v == null ? '—' : c.v + '%', weight: Math.round(c.w * 100) + '%' }));

  let health = 'On track';
  if (cBlk > 0 || overdue.length > 0) health = 'At risk';
  if (overdue.length >= 3 || cBlk >= 3) health = 'Off track';
  if (overall >= 100) health = 'On track';

  return {
    cTotal: cl.length, cActive: cActive.length, cDone, cBlk, cIp, cPct, cPctStr: cPct + '%', sections,
    pTotal: pl.length, pDone, pBlk, pIp, pPct, pPctStr: pPct + '%', phases,
    blockedTotal: cBlk + pBlk,
    dueItems, overdue, overdueCount: overdue.length, blocked, ucCounts, ucTotal: p.useCases.length,
    avgKpi, avgKpiStr: avgKpi + '%', kpiTotal: p.kpis.length, health,
    ucProg, overall, overallStr: overall + '%', overallBreakdown, overallParts,
  };
}
