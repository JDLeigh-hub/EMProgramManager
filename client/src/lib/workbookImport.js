import { uid } from './id.js';
import { blankProject } from './project.js';

export function normStatus(s) {
  const n = String(s == null ? '' : s).trim().toLowerCase();
  if (!n) return '';
  if (n.includes('block')) return 'Blocked';
  if (n.includes('progress') || n === 'wip') return 'In progress';
  if (n.includes('done') || n.includes('complete')) return 'Done';
  if (n === 'na' || n.includes('n/a')) return 'N/A';
  return 'Not started';
}

export function pick(v, opts, def) {
  if (v == null || v === '') return def;
  const n = String(v).trim().toLowerCase();
  const exact = opts.find(o => o.toLowerCase() === n);
  if (exact) return exact;
  const partial = opts.find(o => o.toLowerCase().includes(n) || n.includes(o.toLowerCase()));
  return partial || def;
}

// mod = the xlsxImport module ({ norm, excelSerialToISO })
export function projectFromWorkbook(T, sheets, mod, fname) {
  const S = (name) => { const key = Object.keys(sheets).find(k => k.trim().toLowerCase() === name.toLowerCase()); return key ? sheets[key] : null; };
  const cell = (sh, r, c) => (sh && sh[r] && sh[r][c] != null) ? sh[r][c] : '';
  const rowsOf = (sh, from) => sh ? Object.keys(sh).map(Number).filter(r => r >= from).sort((a, b) => a - b) : [];

  const readme = S('READ ME') || S('README');
  const client = readme ? String(cell(readme, 2, 2) || '').trim() : '';
  const name = client ? (client + ' — Engagement') : fname.replace(/\.[^.]+$/, '');
  const proj = blankProject(T, name, client, '', '');

  // Checklist — overlay onto template items by section+item (fallback: item text)
  const clSheet = S('EM Checklist') || S('Checklist');
  if (clSheet) {
    const lookup = {}, byItem = {};
    proj.checklist.forEach(it => { lookup[mod.norm(it.section) + '||' + mod.norm(it.item)] = it; if (!byItem[mod.norm(it.item)]) byItem[mod.norm(it.item)] = it; });
    rowsOf(clSheet, 5).forEach(r => {
      const row = clSheet[r]; const item = row[3]; if (!item) return;
      const it = lookup[mod.norm(row[1]) + '||' + mod.norm(item)] || byItem[mod.norm(item)]; if (!it) return;
      if (row[4] && isNaN(+row[4])) it.owner = String(row[4]);
      const due = mod.excelSerialToISO(row[5]); if (due) it.due = due; else if (row[5] && /^\d{4}-\d{2}-\d{2}/.test(String(row[5]))) it.due = String(row[5]).slice(0, 10);
      if (row[6]) it.status = normStatus(row[6]);
      if (row[7]) it.notes = String(row[7]);
    });
  }

  // Project Plan — overlay by task text
  const pSheet = S('Project Plan');
  if (pSheet) {
    const byTask = {};
    proj.plan.forEach(t => { byTask[mod.norm(t.task)] = t; });
    rowsOf(pSheet, 4).forEach(r => {
      const row = pSheet[r]; const task = row[3]; if (!task) return;
      const t = byTask[mod.norm(task)]; if (!t) return;
      if (row[4] && isNaN(+row[4])) t.owner = String(row[4]);
      const s = mod.excelSerialToISO(row[5]); if (s) t.start = s;
      const en = mod.excelSerialToISO(row[6]); if (en) t.end = en;
      if (row[8] != null && !isNaN(+row[8])) { let v = +row[8]; if (v <= 1) v = v * 100; t.pct = Math.max(0, Math.min(100, Math.round(v))); }
      if (row[10]) t.status = normStatus(row[10]);
      if (row[11] && isNaN(+row[11])) t.notes = String(row[11]);
    });
  }

  // Use Case Repository
  const ucSheet = S('Use Case Repository');
  if (ucSheet) {
    rowsOf(ucSheet, 5).forEach(r => {
      const row = ucSheet[r]; const nm = row[2]; if (!nm) return;
      const target = mod.excelSerialToISO(row[10]);
      proj.useCases.push({
        id: uid('uc'), code: (row[1] && String(row[1]).trim()) || ('UC-' + String(proj.useCases.length + 1).padStart(3, '0')),
        name: String(nm), problem: String(row[3] || ''), outcome: String(row[4] || ''),
        priority: pick(row[5], ['High', 'Medium', 'Low'], 'Medium'), phase: String(row[6] || 'Phase 1'),
        ownerCust: String(row[7] || ''), ownerAdobe: String(row[8] || ''),
        status: pick(row[9], ['Candidate', 'Backlog', 'In discovery', 'In build', 'UAT', 'Live', 'Deprioritized'], 'Candidate'),
        target: target || (row[10] && /^\d{4}-\d{2}-\d{2}/.test(String(row[10])) ? String(row[10]).slice(0, 10) : ''),
        metric: String(row[11] || ''), notes: String(row[12] || ''),
      });
    });
  }

  // KPIs & Value
  const kSheet = S('KPIs & Value') || S('KPIs and Value') || S('KPIs');
  if (kSheet) {
    const kRows = rowsOf(kSheet, 5);
    for (const r of kRows) {
      const row = kSheet[r];
      const idc = String(row[1] || '');
      if (/qualitative/i.test(idc) || /^(date|source)$/i.test(idc.trim())) break;
      const nm = row[3]; if (!nm) continue;
      if (row[1] && !/^kpi/i.test(idc.trim())) continue;
      proj.kpis.push({
        id: uid('kpi'), code: (row[1] && String(row[1]).trim()) || ('KPI-' + String(proj.kpis.length + 1).padStart(3, '0')),
        category: String(row[2] || ''), name: String(nm), useCase: String(row[4] || ''), unit: String(row[5] || ''),
        baseline: row[6] != null ? String(row[6]) : '', target: row[7] != null ? String(row[7]) : '', current: row[8] != null ? String(row[8]) : '',
        status: pick(row[10], ['Baseline pending', 'On track', 'At risk', 'Off track', 'Target met', 'N/A'], 'Baseline pending'), notes: String(row[11] || ''),
      });
    }
  }

  // Value Baseline
  const vbSheet = S('Value Baseline');
  if (vbSheet) {
    const acc = cell(vbSheet, 3, 2); if (acc) proj.baseline.account = String(acc);
    for (let i = 0; i < 10; i++) {
      const row = vbSheet[6 + i]; if (!row) continue; const a = proj.baseline.answers[i]; if (!a) continue;
      if (row[4]) a.answer = String(row[4]); if (row[5]) a.sources = String(row[5]); if (row[6]) a.stakeholders = String(row[6]);
    }
  }

  // Stakeholder Value Map
  const skSheet = S('Stakeholder Value Map');
  if (skSheet) {
    const groups = T.stakeholderGroups;
    let currentGroup = null;
    const skRows = rowsOf(skSheet, 7);
    for (const r of skRows) {
      const row = skSheet[r];
      const label = String(row[1] || '').trim();
      if (label) {
        const g = groups.find(x => mod.norm(x) === mod.norm(label));
        if (g) { currentGroup = g; }
        else if (/influence-tier|definition/i.test(label)) break;
        else if (!currentGroup) continue;
      }
      const nm = row[2]; if (!nm || !currentGroup) continue;
      proj.stakeholders.push({
        id: uid('sk'), group: currentGroup, name: String(nm), role: String(row[3] || ''),
        tier: pick(row[4], ['Decision Authority', 'Network Influencer', 'Impacted Constituency'], 'Network Influencer'),
        posture: pick(row[7], ['Champion', 'Supportive', 'Neutral', 'Skeptical', 'Blocker'], 'Neutral'),
        value: String(row[5] || ''),
      });
    }
  }

  // RACI — names + marks
  const raSheet = S('RACI');
  if (raSheet) {
    const nameRow = raSheet[8];
    if (nameRow) { for (let k = 0; k < T.raciRoles.length; k++) { const v = nameRow[2 + k]; if (v && isNaN(+v)) proj.raciNames[k] = String(v).replace(/[\r\n]+/g, ' — ').trim(); } }
    const actMap = {};
    T.raciGroups.forEach((g, gi) => g.rows.forEach((rw, ri) => { actMap[mod.norm(rw[0])] = [gi, ri]; }));
    Object.keys(raSheet).map(Number).forEach(r => {
      const row = raSheet[r]; const act = row[1]; if (!act) return;
      const pos = actMap[mod.norm(act)]; if (!pos) return;
      for (let k = 0; k < T.raciRoles.length; k++) { const v = row[2 + k]; if (v && /^(a|r|c|i|a,r|r,a)$/i.test(String(v).trim())) proj.raciMarks[pos[0] + '-' + pos[1] + '-' + k] = String(v).trim().toUpperCase().replace('R,A', 'A,R'); }
    });
  }

  proj.updatedAt = Date.now();
  return proj;
}
