import Anthropic from '@anthropic-ai/sdk';

function buildPrompt({ fileName, text, context }) {
  const roles = (context?.roles || []).join(', ');
  const activities = (context?.activities || []).join(' | ');
  const groups = (context?.groups || []).join(', ');
  const topics = (context?.topics || []).join('; ');
  const clip = String(text || '').slice(0, 48000);

  const system = 'You are an engagement-management analyst. Extract only information explicitly supported by the document. Never invent people, numbers, dates, or commitments. Omit any field you cannot ground in the text. Respond with ONLY a single JSON object, no prose, no code fences.';

  const prompt = 'From the document below, extract structured data for a client engagement "project book". Return JSON with this exact shape (include a key only if you have real content for it):\n' +
    '{\n' +
    '"docSummary": "one sentence describing what this document is",\n' +
    '"projectMeta": {"client":"","em":"","phase":"","targetDate":"YYYY-MM-DD"},\n' +
    '"useCases": [{"name":"","problem":"","outcome":"","priority":"High|Medium|Low","metric":"","status":"Candidate|Backlog|In discovery|In build|UAT|Live"}],\n' +
    '"kpis": [{"category":"","name":"","useCase":"","unit":"","baseline":"","target":"","current":""}],\n' +
    '"stakeholders": [{"group":"one of: ' + groups + '","name":"","role":"","tier":"Decision Authority|Network Influencer|Impacted Constituency","posture":"Champion|Supportive|Neutral|Skeptical|Blocker","value":""}],\n' +
    '"raci": [{"activity":"prefer one of: ' + activities + '","assignments":[{"role":"one of: ' + roles + '","mark":"R|A|C|I|A,R"}]}],\n' +
    '"checklistUpdates": [{"itemQuery":"a few keywords identifying the checklist task","owner":"","due":"YYYY-MM-DD","status":"Not started|In progress|Blocked|Done|N/A","notes":""}],\n' +
    '"baseline": [{"topic":"one of: ' + topics + '","answer":"","sources":""}]\n' +
    '}\n\nDOCUMENT (' + (fileName || 'upload') + '):\n"""\n' + clip + '\n"""';

  return { system, prompt };
}

function parseJson(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch (e) { return null; }
}

// Thrown by runExtract to carry an HTTP status alongside a user-facing message.
export class ExtractError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Shared logic behind the AI auto-fill endpoint, used by both the local
// Express server (dev) and the Vercel serverless function (production).
export async function runExtract({ fileName, text, context }) {
  if (!text || String(text).trim().length < 20) {
    throw new ExtractError(400, 'No readable text provided.');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ExtractError(503, 'Server is missing ANTHROPIC_API_KEY.');
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { system, prompt } = buildPrompt({ fileName, text, context });
  let msg;
  try {
    msg = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    throw new ExtractError(500, (err && err.message) || 'Auto-fill failed.');
  }
  const raw = (msg.content || []).map(b => (b.type === 'text' ? b.text : '')).join('');
  const data = parseJson(raw);
  if (!data) throw new ExtractError(502, 'Could not parse the model response.');
  return data;
}
