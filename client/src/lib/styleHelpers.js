// Shared inline-style objects, ported from the design prototype's dynamic
// style strings. Kept as plain objects so components can spread/merge them.

export const STATUS_BASE = {
  fontFamily: 'var(--font-sans)', fontSize: 12, border: '1px solid rgba(0,0,0,0.25)',
  padding: '5px 6px', width: '100%', borderRadius: 0,
};

const STATUS_MAP = {
  'Blocked': { background: '#000', color: '#fff', fontWeight: 700 },
  'In progress': { background: '#d6d6d6', color: '#000' },
  'Done': { background: '#fff', color: '#000' },
  'N/A': { background: '#fff', color: '#b0b0b0', fontStyle: 'italic' },
  'Not started': { background: '#f2f2f2', color: '#777' },
  '': { background: '#f2f2f2', color: '#999' },
};

export function statusStyle(s) {
  return { ...STATUS_BASE, ...(STATUS_MAP[s] || STATUS_MAP['']) };
}

const HEALTH_BASE = {
  display: 'inline-block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
  fontWeight: 700, padding: '3px 9px', border: '1px solid #000',
};

export function healthStyle(h) {
  if (h === 'Off track') return { ...HEALTH_BASE, background: '#000', color: '#fff' };
  if (h === 'At risk') return { ...HEALTH_BASE, background: '#d6d6d6', color: '#000' };
  return { ...HEALTH_BASE, background: '#fff', color: '#000' };
}

export function srcTagStyle(src) {
  return {
    display: 'inline-block', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
    fontWeight: 700, padding: '2px 6px', marginRight: 8, border: '1px solid #000',
    ...(src === 'Task' ? { background: '#000', color: '#fff' } : { background: '#fff', color: '#000' }),
  };
}

export function dueTagStyle(overdue) {
  return {
    flexShrink: 0, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
    padding: '3px 8px', border: '1px solid #000',
    ...(overdue ? { background: '#000', color: '#fff' } : { background: '#fff', color: '#000' }),
  };
}

export function ucChipStyle(s) {
  const base = { display: 'inline-block', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '3px 8px', border: '1px solid #000' };
  if (s === 'Live') return { ...base, background: '#000', color: '#fff' };
  if (s === 'Deprioritized') return { ...base, color: '#999' };
  return { ...base, background: '#fff', color: '#000' };
}

export function segBtnStyle(on) {
  return {
    border: '1px solid #000', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
    fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700,
    ...(on ? { background: '#000', color: '#fff' } : { background: '#fff', color: '#000' }),
  };
}

export function weekTagStyle(status) {
  const base = { display: 'inline-block', marginTop: 5, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '2px 6px', border: '1px solid #000' };
  if (status === 'Blocked') return { ...base, background: '#000', color: '#fff' };
  if (status === 'In progress') return { ...base, background: '#d6d6d6' };
  return { ...base, background: '#fff' };
}
