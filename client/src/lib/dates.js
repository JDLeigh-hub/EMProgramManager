export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function fmt(d) {
  if (!d) return '';
  const dt = parseDate(d);
  if (!dt) return d;
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtUpdated(ts) {
  if (!ts) return '';
  return 'Updated ' + new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtBytes(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

export function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

export function advance(d, n, businessDays) {
  if (!businessDays) return addDays(d, n);
  const x = new Date(d.getTime());
  let added = 0;
  while (added < n) {
    x.setDate(x.getDate() + 1);
    const dow = x.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return x;
}
