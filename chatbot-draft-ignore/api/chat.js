// Cloudflare Pages Function -> /api/chat. Set ANTHROPIC_API_KEY as a secret (never in code).
const ABOUT = `You are the assistant on Keyuri Tatu's design portfolio. Answer questions about Keyuri using ONLY the facts below.
If something isn't covered, say you don't know and suggest contacting Keyuri via LinkedIn (https://www.linkedin.com/in/keyuri-tatu/). Keep answers under 120 words.
FACTS:
- Keyuri Tatu is a designer working in UX strategy, system design, prototyping, UI design, visual language and illustration.
- The Design Thinking Program (2018-19): designed a workshop and a design thinking book for GE Transportation to promote a user-centric approach to creating products. Book design, workshop design, visual language.
- Primer Conference 2020 (2019-20): created the visual language, logo and illustrations for Speculative Futures' annual conference, themed 'Activating Futures'.
- Other work: InvisioMine (2020, mining operator experience), Ellie AI Locomotive Inspector (2021), Rail Yard of the Future (2019), Project South (2020-21 grad school identity challenge).
TODO: add more about Keyuri's background, skills and availability here.`;
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const host = new URL(request.url).origin;
  if (origin && origin !== host) return new Response('Forbidden', { status: 403 });
  let body; try { body = await request.json() } catch { return Response.json({ reply: 'Bad request.' }, { status: 400 }) }
  const messages = (body.messages || []).slice(-10)
    .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 500) }));
  if (!messages.length || messages[0].role !== 'user') return Response.json({ reply: 'Please ask a question.' }, { status: 400 });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 300, system: ABOUT, messages })
  });
  if (!r.ok) return Response.json({ reply: 'The chatbot is unavailable right now.' }, { status: 502 });
  const d = await r.json();
  return Response.json({ reply: d.content?.map(c => c.text || '').join('') });
}
