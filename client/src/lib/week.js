import { parseDate, today } from './dates.js';
import { weekTagStyle } from './styleHelpers.js';

// projects: array, me: string, weekOffset: number, onlyMine: bool
export function computeWeek(projects, me, weekOffset, onlyMine) {
  const t0 = today();
  const start = new Date(t0);
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow + weekOffset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const meLower = (me || '').toLowerCase();
  const mine = (owner) => { if (!onlyMine || !meLower) return true; return (owner || '').toLowerCase().includes(meLower); };
  const done = s => s === 'Done', na = s => s === 'N/A';
  const inWeek = [], overdue = []; const projSet = new Set();

  const push = (proj, name, owner, due, status, tab, type) => {
    if (!due || done(status) || na(status)) return;
    const d = parseDate(due); if (!d) return; d.setHours(0, 0, 0, 0);
    if (!mine(owner)) return;
    const rec = { proj: proj.name, projId: proj.id, name, owner, status, tab, type, d };
    if (weekOffset === 0 && d < t0) { overdue.push(rec); projSet.add(proj.id); return; }
    if (d >= start && d < end) { inWeek.push(rec); projSet.add(proj.id); }
  };

  projects.forEach(p => {
    (p.checklist || []).forEach(x => push(p, x.item, x.owner, x.due, x.status, 'checklist', 'Checklist'));
    (p.plan || []).forEach(x => push(p, x.task, x.owner, x.end, x.status, 'plan', 'Plan'));
    (p.useCases || []).forEach(x => push(p, x.name || x.code, x.ownerCust || x.ownerAdobe, x.target, x.status === 'Live' ? 'Done' : '', 'usecases', 'Use case'));
  });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = dayNames.map((label, i) => {
    const dd = new Date(start); dd.setDate(dd.getDate() + i);
    const isToday = dd.getTime() === t0.getTime();
    const its = inWeek.filter(r => r.d.getTime() === dd.getTime()).map(r => ({ proj: r.proj, projId: r.projId, tab: r.tab, name: r.name, tag: (r.status || 'To do') + ' · ' + r.type, tagStyle: weekTagStyle(r.status) }));
    return {
      label, date: dd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), empty: its.length === 0, items: its,
      isToday,
    };
  });

  overdue.sort((a, b) => a.d - b.d);
  const overdueView = overdue.map(r => {
    const late = Math.round((t0 - r.d) / 86400000);
    return { projId: r.projId, tab: r.tab, name: r.name, meta: [r.proj, r.type, r.owner].filter(Boolean).join(' · '), tag: late + (late === 1 ? ' day late' : ' days late') };
  });

  const fmtRange = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + new Date(end.getTime() - 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const whenMap = { '0': 'this week', '1': 'next week', '-1': 'last week' };
  const emptyWhen = whenMap[String(weekOffset)] || 'that week';

  return {
    rangeLabel: fmtRange, me, onlyMine,
    counts: { tasks: inWeek.length, overdue: overdue.length, projects: projSet.size },
    days, overdue: overdueView, hasOverdue: overdueView.length > 0,
    empty: inWeek.length === 0 && overdueView.length === 0, emptyWhen,
  };
}
