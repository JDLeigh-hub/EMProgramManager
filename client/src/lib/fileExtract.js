// fileExtract.js — client-side text extraction for Office/PDF/text files.
// Pulls raw text out of uploaded resources so the AI auto-fill endpoint has
// something to read. Pure browser: no server round-trip for extraction itself.

import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';

// ---- ZIP (Office Open XML files are zips) ----
async function unzip(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip');
  const cdOffset = dv.getUint32(eocd + 16, true);
  const cdCount = dv.getUint16(eocd + 10, true);
  let p = cdOffset;
  const entries = [];
  for (let i = 0; i < cdCount; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.slice(p + 46, p + 46 + nameLen));
    entries.push({ name, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const out = {};
  for (const e of entries) {
    let lp = e.localOffset;
    const nameLen = dv.getUint16(lp + 26, true);
    const extraLen = dv.getUint16(lp + 28, true);
    const method = dv.getUint16(lp + 8, true);
    const compSize = dv.getUint32(lp + 18, true);
    const dataStart = lp + 30 + nameLen + extraLen;
    const comp = buf.slice(dataStart, dataStart + compSize);
    let bytes;
    if (method === 0) { bytes = comp; }
    else {
      const ds = new DecompressionStream('deflate-raw');
      bytes = new Uint8Array(await new Response(new Response(comp).body.pipeThrough(ds)).arrayBuffer());
    }
    out[e.name] = bytes;
  }
  return out;
}
const dec = (bytes) => new TextDecoder().decode(bytes);
function unescapeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n').replace(/&#9;/g, '\t')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

// ---- XLSX ----
function colNum(ref) { const c = ref.match(/[A-Z]+/)[0]; let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
async function extractXlsx(file) {
  const z = await unzip(file);
  const shared = [];
  if (z['xl/sharedStrings.xml']) {
    const xml = dec(z['xl/sharedStrings.xml']);
    const siRe = /<si>([\s\S]*?)<\/si>/g; let m;
    while ((m = siRe.exec(xml))) {
      const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g; let tm, s = '';
      while ((tm = tRe.exec(m[1]))) s += tm[1];
      shared.push(unescapeXml(s));
    }
  }
  let sheetNames = {};
  if (z['xl/workbook.xml']) {
    const wb = dec(z['xl/workbook.xml']);
    let sm; const sre = /<sheet[^>]*name="([^"]*)"[^>]*r:id="rId(\d+)"/g; let idx = 0;
    while ((sm = sre.exec(wb))) { idx++; sheetNames[idx] = unescapeXml(sm[1]); }
  }
  const sheetFiles = Object.keys(z).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => (+a.match(/(\d+)/)[1]) - (+b.match(/(\d+)/)[1]));
  let out = '';
  let si = 0;
  for (const sf of sheetFiles) {
    si++;
    const xml = dec(z[sf]);
    out += `\n### Sheet: ${sheetNames[si] || sf}\n`;
    const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g; let rm;
    while ((rm = rowRe.exec(xml))) {
      const cRe = /<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>|<c r="([A-Z]+\d+)"([^>]*)\/>/g; let cm;
      const rowCells = {};
      while ((cm = cRe.exec(rm[2]))) {
        const ref = cm[1] || cm[4]; const attrs = cm[2] || cm[5] || ''; const body = cm[3] || '';
        const t = (attrs.match(/t="([^"]+)"/) || [])[1];
        let val = '';
        const v = body.match(/<v>([\s\S]*?)<\/v>/);
        const is = body.match(/<is>([\s\S]*?)<\/is>/);
        if (t === 's' && v) val = shared[+v[1]] || '';
        else if (t === 'inlineStr' && is) { const tm2 = is[1].match(/<t[^>]*>([\s\S]*?)<\/t>/); val = tm2 ? unescapeXml(tm2[1]) : ''; }
        else if (v) val = unescapeXml(v[1]);
        if (val !== '') rowCells[colNum(ref)] = val;
      }
      const cols = Object.keys(rowCells).map(Number).sort((a, b) => a - b);
      if (cols.length) out += cols.map(c => rowCells[c]).join(' | ') + '\n';
    }
  }
  return out.trim();
}

// ---- DOCX / PPTX ----
// Text nodes get wrapped in sentinel marker characters before all XML tags
// are stripped, so paragraph/slide boundaries survive the strip; the
// sentinels are removed afterward. Using charCodes (not literal control
// characters) keeps this file readable and diff-friendly.
const MARK_START = String.fromCharCode(1);
const MARK_END = String.fromCharCode(2);
const MARK_BREAK = String.fromCharCode(3);
function stripMarks(s) { return s.split(MARK_START).join('').split(MARK_END).join(''); }

async function extractDocx(file) {
  const z = await unzip(file);
  const parts = ['word/document.xml'].concat(Object.keys(z).filter(n => /^word\/(header|footer)\d*\.xml$/.test(n)));
  let out = '';
  for (const part of parts) {
    if (!z[part]) continue;
    let xml = dec(z[part]);
    xml = xml.replace(/<w:tab\b[^>]*\/>/g, '\t').replace(/<w:br\b[^>]*\/>/g, '\n');
    xml = xml.replace(/<\/w:p>/g, '\n').replace(/<\/w:tr>/g, '\n').replace(/<\/w:tc>/g, ' | ');
    xml = xml.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (_, t) => MARK_START + t + MARK_END);
    xml = xml.replace(/<[^>]+>/g, '');
    out += unescapeXml(stripMarks(xml)) + '\n';
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

// ---- PPTX ----
async function extractPptx(file) {
  const z = await unzip(file);
  const slideFiles = Object.keys(z).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => (+a.match(/(\d+)/)[1]) - (+b.match(/(\d+)/)[1]));
  let out = '';
  let n = 0;
  for (const sf of slideFiles) {
    n++;
    out += `\n### Slide ${n}\n`;
    let x2 = dec(z[sf]).replace(/<a:t>([\s\S]*?)<\/a:t>/g, (_, t) => MARK_START + t + MARK_END);
    x2 = x2.replace(/<\/a:p>/g, MARK_BREAK);
    x2 = x2.replace(/<[^>]+>/g, '');
    x2 = stripMarks(x2).split(MARK_BREAK).join('\n');
    out += unescapeXml(x2).replace(/\n{2,}/g, '\n').trim() + '\n';
  }
  return out.trim();
}

// ---- PDF (pdfjs-dist) ----
let pdfjsLibPromise = null;
async function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/build/pdf.js').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
      return lib;
    });
  }
  return pdfjsLibPromise;
}
async function extractPdf(file) {
  const lib = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await lib.getDocument({ data }).promise;
  let out = '';
  const max = Math.min(pdf.numPages, 60);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const parts = [];
    for (const it of tc.items) {
      parts.push(it.str);
      if (it.hasEOL) parts.push('\n');
    }
    out += parts.join(' ').replace(/ \n /g, '\n') + '\n';
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export async function extractText(file) {
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop();
  try {
    if (['txt', 'csv', 'md', 'json', 'html', 'rtf'].includes(ext)) return (await file.text()).slice(0, 200000);
    if (ext === 'xlsx' || ext === 'xlsm') return await extractXlsx(file);
    if (ext === 'docx') return await extractDocx(file);
    if (ext === 'pptx') return await extractPptx(file);
    if (ext === 'pdf') return await extractPdf(file);
    return (await file.text()).slice(0, 200000);
  } catch (e) {
    throw new Error('Could not read ' + (file.name || 'file') + ': ' + (e.message || e));
  }
}

export function fileKind(name) {
  const ext = (name || '').toLowerCase().split('.').pop();
  const map = { xlsx: 'Excel', xlsm: 'Excel', csv: 'CSV', docx: 'Word', pptx: 'PowerPoint', pdf: 'PDF', txt: 'Text', md: 'Markdown', json: 'JSON', html: 'HTML' };
  return map[ext] || (ext ? ext.toUpperCase() : 'File');
}
