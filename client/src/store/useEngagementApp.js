import { useCallback, useMemo, useRef, useState } from 'react';
import { TEMPLATE } from '../data/template.js';
import { uid } from '../lib/id.js';
import { loadProjects, saveProjects, loadMe, saveMe, idbPut, idbGet, idbDel } from '../lib/storage.js';
import { blankProject, ensureTimeline, defaultTimeline } from '../lib/project.js';
import { projectFromWorkbook } from '../lib/workbookImport.js';
import { extractText, fileKind } from '../lib/fileExtract.js';
import { buildAiView, applyAiToProject } from '../lib/aiApply.js';

const DUE_SOON_DAYS = 7;

const initialUi = {
  view: 'home', homeView: 'projects', pid: null, tab: 'dashboard',
  fSection: 'All', fStatus: 'All', q: '', newOpen: false, vhIdx: 0,
  helpOpen: false, integrationsOpen: false, weekOffset: 0, onlyMine: false,
  uploading: [], aiOpen: false, aiFileId: null, aiFileName: '', aiProposal: null, aiChecked: {}, aiBusyId: null, aiErr: '',
  editing: {}, expandBlocked: false, expandDue: false, ucView: 'repo',
};

export function useEngagementApp() {
  const T = TEMPLATE;
  const [projects, setProjectsState] = useState(() => loadProjects());
  const [me, setMeState] = useState(() => loadMe());
  const [ui, setUi] = useState(initialUi);

  const npName = useRef(null); const npClient = useRef(null); const npEm = useRef(null); const npTarget = useRef(null);
  const importRef = useRef(null); const importXlsxRef = useRef(null); const uploadRef = useRef(null);

  const patch = useCallback((p) => setUi(s => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })), []);

  const setProjects = useCallback((next) => { saveProjects(next); setProjectsState(next); }, []);

  const cur = useCallback(() => (projects || []).find(p => p.id === ui.pid) || null, [projects, ui.pid]);

  const mutate = useCallback((fn) => {
    setProjectsState(prev => {
      const next = (prev || []).map(p => {
        if (p.id !== ui.pid) return p;
        const np = JSON.parse(JSON.stringify(p));
        fn(np); np.updatedAt = Date.now();
        return np;
      });
      saveProjects(next);
      return next;
    });
  }, [ui.pid]);

  // ---- nav ----
  const openProject = useCallback((id) => patch({ view: 'project', pid: id, tab: 'dashboard', vhIdx: 0 }), [patch]);
  const openProjectTo = useCallback((id, tab) => patch({ view: 'project', pid: id, tab: tab || 'dashboard', vhIdx: 0 }), [patch]);
  const goHome = useCallback(() => patch({ view: 'home', homeView: 'projects', pid: null }), [patch]);
  const goTab = useCallback((tab) => patch({ tab }), [patch]);
  const openNew = useCallback(() => patch({ newOpen: true }), [patch]);
  const closeNew = useCallback(() => patch({ newOpen: false }), [patch]);
  const goWeek = useCallback(() => patch({ view: 'home', homeView: 'week', pid: null }), [patch]);
  const goProjects = useCallback(() => patch({ homeView: 'projects' }), [patch]);
  const openHelp = useCallback(() => patch({ helpOpen: true }), [patch]);
  const closeHelp = useCallback(() => patch({ helpOpen: false }), [patch]);
  const openIntegrations = useCallback(() => patch({ integrationsOpen: true }), [patch]);
  const closeIntegrations = useCallback(() => patch({ integrationsOpen: false }), [patch]);

  // ---- My Week ----
  const weekPrev = useCallback(() => patch(s => ({ weekOffset: s.weekOffset - 1 })), [patch]);
  const weekNext = useCallback(() => patch(s => ({ weekOffset: s.weekOffset + 1 })), [patch]);
  const weekThis = useCallback(() => patch({ weekOffset: 0 }), [patch]);
  const toggleOnlyMine = useCallback(() => patch(s => ({ onlyMine: !s.onlyMine })), [patch]);
  const editMe = useCallback((v) => { const t = (v || '').trim(); setMeState(t); saveMe(t); }, []);

  // ---- projects CRUD ----
  const createProject = useCallback(({ name, client, em, target }) => {
    if (!name || !name.trim()) return null;
    const proj = blankProject(T, name.trim(), (client || '').trim(), (em || '').trim(), target || '');
    const next = [proj, ...(projects || [])];
    setProjects(next);
    patch({ newOpen: false, view: 'project', pid: proj.id, tab: 'dashboard', vhIdx: 0 });
    return proj;
  }, [T, projects, setProjects, patch]);

  const delProject = useCallback((id) => {
    if (!window.confirm('Delete this project permanently?')) return;
    setProjects((projects || []).filter(p => p.id !== id));
  }, [projects, setProjects]);

  const dupProject = useCallback((id) => {
    const src = (projects || []).find(p => p.id === id); if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid('P'); copy.name = src.name + ' (copy)'; copy.createdAt = Date.now(); copy.updatedAt = Date.now();
    setProjects([copy, ...(projects || [])]);
  }, [projects, setProjects]);

  // ---- Excel workbook import ----
  const importWorkbookFile = useCallback(async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const mod = await import('../lib/xlsxImport.js');
      const { sheets } = await mod.parseWorkbook(buf);
      const proj = projectFromWorkbook(T, sheets, mod, file.name);
      const next = [proj, ...(projects || [])];
      setProjects(next);
      patch({ view: 'project', pid: proj.id, tab: 'dashboard', vhIdx: 0 });
    } catch (err) {
      console.error('Excel import failed', err);
      window.alert('Could not import that Excel file.\n\n' + ((err && err.message) || err));
    }
  }, [T, projects, setProjects, patch]);

  // ---- backup import/export ----
  const download = (fname, text) => {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportAll = useCallback(() => download('engagement-os-backup.json', JSON.stringify(projects || [], null, 2)), [projects]);

  const importBackupFile = useCallback((file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const incoming = Array.isArray(data) ? data : [data];
        const existing = new Set((projects || []).map(p => p.id));
        const merged = [...incoming.map(p => existing.has(p.id) ? { ...p, id: uid('P') } : p), ...(projects || [])];
        setProjects(merged);
      } catch (err) { window.alert('Could not read that file.'); }
    };
    r.readAsText(file);
  }, [projects, setProjects]);

  // ---- filters ----
  const onSearch = useCallback((v) => patch({ q: v }), [patch]);
  const onFilterSection = useCallback((v) => patch({ fSection: v }), [patch]);
  const onFilterStatus = useCallback((v) => patch({ fStatus: v }), [patch]);

  // ---- checklist edits ----
  const editCl = useCallback((id, field, v) => mutate(p => { const it = p.checklist.find(x => x.id === id); if (it) it[field] = v; }), [mutate]);
  const addClItem = useCallback((section) => mutate(p => { p.checklist.push({ id: uid('c'), section, subsection: 'Added', item: '', owner: '', due: '', status: '', notes: '', custom: true }); }), [mutate]);
  const delClItem = useCallback((id) => mutate(p => { p.checklist = p.checklist.filter(x => x.id !== id); }), [mutate]);

  // ---- timeline / gantt edits ----
  const editEngStart = useCallback((v) => mutate(p => { ensureTimeline(p).engagementStart = v; }), [mutate]);
  const editStageDays = useCallback((key, v) => { const n = Math.max(1, Math.min(400, parseInt(v, 10) || 1)); mutate(p => { const s = ensureTimeline(p).stages.find(x => x.key === key); if (s) s.days = n; }); }, [mutate]);
  const editUcStart = useCallback((ucId, v) => mutate(p => { ensureTimeline(p).ucStarts[ucId] = v; }), [mutate]);
  const genTimeline = useCallback(() => mutate(p => { ensureTimeline(p).show = true; }), [mutate]);
  const toggleBusinessDays = useCallback(() => mutate(p => { const t = ensureTimeline(p); t.businessDays = !(t.businessDays !== false); }), [mutate]);

  // ---- plan edits ----
  const editPlan = useCallback((id, field, v) => mutate(p => { const it = p.plan.find(x => x.id === id); if (it) it[field] = field === 'pct' ? Math.max(0, Math.min(100, parseInt(v, 10) || 0)) : v; }), [mutate]);

  // ---- use case edits ----
  const editUc = useCallback((id, field, v) => mutate(p => { const it = p.useCases.find(x => x.id === id); if (it) it[field] = v; }), [mutate]);
  const openEdit = useCallback((id) => patch(s => ({ editing: { ...(s.editing || {}), [id]: true } })), [patch]);
  const addUc = useCallback(() => {
    const id = uid('uc');
    mutate(p => { p.useCases.push({ id, code: 'UC-' + String(p.useCases.length + 1).padStart(3, '0'), name: '', problem: '', outcome: '', priority: 'Medium', phase: 'Phase 1', ownerCust: '', ownerAdobe: '', status: 'Candidate', target: '', metric: '', notes: '' }); });
    openEdit(id);
  }, [mutate, openEdit]);
  const startEdit = useCallback((id) => openEdit(id), [openEdit]);
  const stopEdit = useCallback((id) => patch(s => { const m = { ...(s.editing || {}) }; delete m[id]; return { editing: m }; }), [patch]);
  const toggleBlocked = useCallback(() => patch(s => ({ expandBlocked: !s.expandBlocked })), [patch]);
  const toggleDue = useCallback(() => patch(s => ({ expandDue: !s.expandDue })), [patch]);
  const delUc = useCallback((id) => mutate(p => { p.useCases = p.useCases.filter(x => x.id !== id); }), [mutate]);
  const setUcView = useCallback((v) => patch({ ucView: v }), [patch]);
  const promote = useCallback((potentialId) => {
    const puc = T.potentialUseCases.find(x => x.id === potentialId); if (!puc) return;
    mutate(p => { p.useCases.push({ id: uid('uc'), code: 'UC-' + String(p.useCases.length + 1).padStart(3, '0'), name: puc.name, problem: puc.description, outcome: '', priority: 'Medium', phase: 'Phase 1', ownerCust: '', ownerAdobe: '', status: 'Candidate', target: '', metric: puc.metric, notes: 'From ' + puc.id }); });
    patch({ tab: 'usecases', ucView: 'repo' });
  }, [T, mutate, patch]);

  // ---- kpi edits ----
  const addKpi = useCallback(() => {
    const id = uid('kpi');
    mutate(p => { p.kpis.push({ id, code: 'KPI-' + String(p.kpis.length + 1).padStart(3, '0'), category: '', name: '', useCase: '', unit: '', baseline: '', target: '', current: '', status: 'Baseline pending', notes: '' }); });
    openEdit(id);
  }, [mutate, openEdit]);
  const editKpi = useCallback((id, field, v) => mutate(p => { const it = p.kpis.find(x => x.id === id); if (it) it[field] = v; }), [mutate]);
  const delKpi = useCallback((id) => mutate(p => { p.kpis = p.kpis.filter(x => x.id !== id); }), [mutate]);

  // ---- raci edits ----
  const editRaciName = useCallback((role, v) => mutate(p => { p.raciNames[role] = v; }), [mutate]);
  const editRaciMark = useCallback((key, v) => mutate(p => { if (v) p.raciMarks[key] = v; else delete p.raciMarks[key]; }), [mutate]);

  // ---- value baseline edits ----
  const editBaselineHead = useCallback((field, v) => mutate(p => { p.baseline[field] = v; }), [mutate]);
  const editBaseline = useCallback((idx, field, v) => mutate(p => { if (p.baseline.answers[idx]) p.baseline.answers[idx][field] = v; }), [mutate]);

  // ---- value hypothesis edits ----
  const addVh = useCallback(() => mutate(p => { p.hypotheses.push({ id: uid('vh'), values: {} }); }), [mutate]);
  const selVh = useCallback((idx) => patch({ vhIdx: idx }), [patch]);
  const editVh = useCallback((label, v) => { mutate(p => { if (p.hypotheses[ui.vhIdx]) p.hypotheses[ui.vhIdx].values[label] = v; }); }, [mutate, ui.vhIdx]);
  const delVh = useCallback((idx) => { mutate(p => { p.hypotheses.splice(idx, 1); }); patch({ vhIdx: 0 }); }, [mutate, patch]);

  // ---- stakeholder edits ----
  const addStake = useCallback((group) => {
    const id = uid('sk');
    mutate(p => { p.stakeholders.push({ id, group, name: '', role: '', tier: 'Network Influencer', posture: 'Neutral', value: '' }); });
    openEdit(id);
  }, [mutate, openEdit]);
  const editStake = useCallback((id, field, v) => mutate(p => { const it = p.stakeholders.find(x => x.id === id); if (it) it[field] = v; }), [mutate]);
  const delStake = useCallback((id) => mutate(p => { p.stakeholders = p.stakeholders.filter(x => x.id !== id); }), [mutate]);

  // ---- resource library ----
  const ingestFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList);
    for (const file of files) {
      const fid = uid('f');
      patch(s => ({ uploading: [...s.uploading, { id: fid, name: file.name, status: 'Reading…' }] }));
      let text = '', error = '';
      try { text = await extractText(file); } catch (err) { error = (err && err.message) || String(err); }
      try { await idbPut({ id: fid, blob: file, text }); } catch (err) { error = error || 'Could not store the file (storage limit?).'; }
      const meta = { id: fid, name: file.name, kind: fileKind(file.name), size: file.size, uploadedAt: Date.now(), textLen: (text || '').length, error };
      mutate(p => { if (!p.library) p.library = []; p.library.unshift(meta); });
      patch(s => ({ uploading: s.uploading.filter(u => u.id !== fid) }));
    }
  }, [mutate, patch]);

  const downloadFile = useCallback(async (id) => {
    const proj = cur(); const meta = proj && (proj.library || []).find(f => f.id === id);
    try {
      const rec = await idbGet(id);
      if (!rec || !rec.blob) { window.alert('File data not found on this device.'); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(rec.blob); a.download = (meta && meta.name) || 'file';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) { window.alert('Could not open the file.'); }
  }, [cur]);

  const delFile = useCallback(async (id) => {
    if (!window.confirm('Remove this file from the library?')) return;
    try { await idbDel(id); } catch (err) { /* ignore */ }
    mutate(p => { p.library = (p.library || []).filter(f => f.id !== id); });
  }, [mutate]);

  // ---- AI auto-fill ----
  const aiExtract = useCallback(async (id) => {
    const proj = cur(); if (!proj) return;
    const meta = (proj.library || []).find(f => f.id === id); if (!meta) return;
    patch({ aiBusyId: id, aiErr: '' });
    let text = '';
    try { const rec = await idbGet(id); text = (rec && rec.text) || ''; } catch (err) { /* ignore */ }
    if (!text || text.trim().length < 20) { patch({ aiBusyId: null, aiErr: 'No readable text found in "' + meta.name + '". Scanned PDFs and image-only files can\'t be read.' }); return; }
    const roles = T.raciRoles;
    const activities = [];
    T.raciGroups.forEach(g => g.rows.forEach(r => activities.push(r[0])));
    const groups = T.stakeholderGroups;
    const topics = T.valueBaselineQuestions.map(q => q.id + ' ' + q.topic);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: meta.name, text, context: { roles, activities, groups, topics } }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Auto-fill failed.');
      const data = body.data;
      const checked = {};
      const reg = (key) => { checked[key] = true; };
      (data.useCases || []).forEach((_, i) => reg('uc:' + i));
      (data.kpis || []).forEach((_, i) => reg('kpi:' + i));
      (data.stakeholders || []).forEach((_, i) => reg('sk:' + i));
      (data.raci || []).forEach((_, i) => reg('raci:' + i));
      (data.checklistUpdates || []).forEach((_, i) => reg('cl:' + i));
      (data.baseline || []).forEach((_, i) => reg('bl:' + i));
      if (data.projectMeta && Object.values(data.projectMeta).some(v => v && String(v).trim())) reg('meta:0');
      patch({ aiBusyId: null, aiOpen: true, aiFileId: id, aiFileName: meta.name, aiProposal: data, aiChecked: checked });
    } catch (err) {
      patch({ aiBusyId: null, aiErr: 'Auto-fill failed: ' + ((err && err.message) || err) });
    }
  }, [T, cur, patch]);

  const closeAi = useCallback(() => patch({ aiOpen: false, aiProposal: null, aiChecked: {}, aiFileId: null }), [patch]);
  const toggleAiItem = useCallback((key) => patch(s => ({ aiChecked: { ...s.aiChecked, [key]: !s.aiChecked[key] } })), [patch]);
  const toggleAiSection = useCallback((sec) => {
    setUi(s => {
      const keys = Object.keys(s.aiChecked).filter(k => k.split(':')[0] === sec);
      const allOn = keys.every(k => s.aiChecked[k]);
      const next = { ...s.aiChecked }; keys.forEach(k => next[k] = !allOn);
      return { ...s, aiChecked: next };
    });
  }, []);
  const applyAi = useCallback(() => {
    const data = ui.aiProposal; const chk = ui.aiChecked; if (!data) return;
    mutate(p => applyAiToProject(p, T, data, chk, ui.aiFileName));
    patch({ aiOpen: false, aiProposal: null, aiChecked: {}, aiFileId: null });
  }, [T, ui.aiProposal, ui.aiChecked, ui.aiFileName, mutate, patch]);

  const aiView = useMemo(() => buildAiView(ui), [ui]);

  return {
    T, projects, me, ui, cur,
    npName, npClient, npEm, npTarget, importRef, importXlsxRef, uploadRef,
    // nav
    openProject, openProjectTo, goHome, goTab, openNew, closeNew, goWeek, goProjects, openHelp, closeHelp, openIntegrations, closeIntegrations,
    // week
    weekPrev, weekNext, weekThis, toggleOnlyMine, editMe,
    // projects
    createProject, delProject, dupProject, importWorkbookFile, exportAll, importBackupFile,
    // filters
    onSearch, onFilterSection, onFilterStatus,
    // checklist
    editCl, addClItem, delClItem,
    // timeline
    editEngStart, editStageDays, editUcStart, genTimeline, toggleBusinessDays,
    // plan
    editPlan,
    // use cases
    editUc, addUc, delUc, setUcView, promote, startEdit, stopEdit, toggleBlocked, toggleDue,
    // kpis
    addKpi, editKpi, delKpi,
    // raci
    editRaciName, editRaciMark,
    // baseline
    editBaselineHead, editBaseline,
    // hypothesis
    addVh, selVh, editVh, delVh,
    // stakeholders
    addStake, editStake, delStake,
    // library
    ingestFiles, downloadFile, delFile,
    // ai
    aiExtract, closeAi, toggleAiItem, toggleAiSection, applyAi, aiView,
    // misc
    dueSoonDays: DUE_SOON_DAYS, defaultTimeline,
  };
}
