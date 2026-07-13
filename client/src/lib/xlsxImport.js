// xlsx-import.js — minimal in-browser .xlsx reader.
// Unzips the workbook with DecompressionStream, parses sharedStrings + sheets,
// and returns { sheets: { <sheetName>: { <rowNum>: { <colNum>: value } } } }.
// No external dependencies.

function u16(b, o) { return b[o] | (b[o + 1] << 8); }
function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot unzip Excel files (DecompressionStream unavailable). Try a recent Chrome, Edge or Safari.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const ab = await new Response(new Response(bytes).body.pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(ab);
}

async function unzip(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  // locate End Of Central Directory
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) { if (u32(bytes, i) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('Not a valid .xlsx file.');
  const cdOffset = u32(bytes, eocd + 16);
  const cdCount = u16(bytes, eocd + 10);
  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < cdCount; i++) {
    const nameLen = u16(bytes, p + 28), extraLen = u16(bytes, p + 30), commentLen = u16(bytes, p + 32);
    const localOffset = u32(bytes, p + 42);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    entries.push({ name, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const files = {};
  for (const e of entries) {
    const lp = e.localOffset;
    const nameLen = u16(bytes, lp + 26), extraLen = u16(bytes, lp + 28);
    const method = u16(bytes, lp + 8), compSize = u32(bytes, lp + 18);
    const start = lp + 30 + nameLen + extraLen;
    const comp = bytes.slice(start, start + compSize);
    let data;
    if (method === 0) data = comp;
    else if (method === 8) data = await inflateRaw(comp);
    else continue;
    files[e.name] = new TextDecoder().decode(data);
  }
  return files;
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#10;/g, '\n').replace(/&#9;/g, '\t').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
}

function colNum(ref) {
  const c = ref.match(/[A-Z]+/)[0];
  let n = 0;
  for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function parseSharedStrings(xml) {
  const out = [];
  if (!xml) return out;
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm, s = '';
    while ((tm = tRe.exec(m[1]))) s += tm[1];
    out.push(decodeEntities(s));
  }
  return out;
}

function parseSheet(xml, shared) {
  const rows = {};
  if (!xml) return rows;
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const rn = +rm[1];
    const cells = {};
    // Match a cell as either self-closing (<c .../>) or with a body (<c ...>…</c>).
    // The lazy attr capture + explicit (?:/>|>…</c>) branch prevents an empty
    // self-closing cell from swallowing the following cell.
    const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm;
    while ((cm = cRe.exec(rm[2]))) {
      const attrs = cm[1] || '';
      const body = cm[2] || '';
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
      if (!ref) continue;
      const t = (attrs.match(/t="([^"]+)"/) || [])[1];
      let val = '';
      const vMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      const isMatch = body.match(/<is>([\s\S]*?)<\/is>/);
      if (t === 's' && vMatch) val = shared[+vMatch[1]] || '';
      else if (t === 'inlineStr' && isMatch) { const im = isMatch[1].match(/<t[^>]*>([\s\S]*?)<\/t>/); val = im ? decodeEntities(im[1]) : ''; }
      else if (vMatch) val = decodeEntities(vMatch[1]);
      if (val !== '') cells[colNum(ref)] = val;
    }
    if (Object.keys(cells).length) rows[rn] = cells;
  }
  return rows;
}

export async function parseWorkbook(arrayBuffer) {
  const files = await unzip(arrayBuffer);
  const shared = parseSharedStrings(files['xl/sharedStrings.xml']);
  // sheet name -> r:id
  const wb = files['xl/workbook.xml'] || '';
  const rels = files['xl/_rels/workbook.xml.rels'] || '';
  const relMap = {};
  const relRe = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let rr;
  while ((rr = relRe.exec(rels))) relMap[rr[1]] = rr[2];
  // also handle attribute order variance
  const relRe2 = /<Relationship[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"/g;
  while ((rr = relRe2.exec(rels))) if (!relMap[rr[2]]) relMap[rr[2]] = rr[1];

  const sheets = {};
  const sheetRe = /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"|<sheet[^>]*r:id="([^"]+)"[^>]*name="([^"]+)"/g;
  let sm;
  while ((sm = sheetRe.exec(wb))) {
    const name = decodeEntities(sm[1] || sm[4]);
    const rid = sm[2] || sm[3];
    let target = relMap[rid];
    if (!target) continue;
    if (!target.startsWith('xl/')) target = 'xl/' + target.replace(/^\//, '');
    const xml = files[target];
    sheets[name] = parseSheet(xml, shared);
  }
  return { sheets };
}

// ---- date helpers ----
export function excelSerialToISO(n) {
  const serial = parseFloat(n);
  if (isNaN(serial) || serial < 20000 || serial > 90000) return null; // ~1954..2146
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}

export function norm(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
