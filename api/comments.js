// Comments on the gallery's designs, stored as one private JSON blob each under
// comments/<design>/<id>.json in the project's Vercel Blob store.
//
//   GET    /api/comments                -> { counts: { <design>: n } }
//   GET    /api/comments?design=<slug>  -> { comments: [...] } oldest first
//   POST   /api/comments                {design, route, name, text, key} -> { comment }
//   DELETE /api/comments?design=&id=    {key} -> { ok: true }
//
// `key` is a random string the browser keeps; only its hash is stored, so a
// visitor can delete their own comments and nobody else's.
import { createHash, randomUUID } from 'node:crypto';
import { del, get, list, put } from '@vercel/blob';

const DESIGNS = new Set([
  'statuspage', 'delivery-tracker', 'linear-updates', 'github-roadmap',
  'now-next-later', 'hill-chart', 'portfolio-table',
]);
const hash = (key) => createHash('sha256').update(String(key)).digest('hex');
const clean = (value, max) => String(value ?? '').trim().slice(0, max);

async function readComment(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result) return null;
  return JSON.parse(await new Response(result.stream).text());
}

async function listAll(prefix) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const design = req.query.design;
      if (!design) {
        const counts = {};
        for (const blob of await listAll('comments/')) {
          const slug = blob.pathname.split('/')[1];
          counts[slug] = (counts[slug] ?? 0) + 1;
        }
        return res.status(200).json({ counts });
      }
      if (!DESIGNS.has(design)) return res.status(400).json({ error: 'Unknown design' });
      const blobs = await listAll(`comments/${design}/`);
      const comments = (await Promise.all(blobs.map((b) => readComment(b.pathname))))
        .filter(Boolean)
        .map(({ keyHash, ...comment }) => comment)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return res.status(200).json({ comments });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
      if (body.website) return res.status(200).json({ ok: true }); // honeypot field
      const design = clean(body.design, 40);
      const text = clean(body.text, 2000);
      const key = clean(body.key, 100);
      if (!DESIGNS.has(design)) return res.status(400).json({ error: 'Unknown design' });
      if (!text) return res.status(400).json({ error: 'Write a comment first' });
      if (key.length < 16) return res.status(400).json({ error: 'Missing key' });
      const comment = {
        id: `${Date.now()}-${randomUUID().slice(0, 8)}`,
        design,
        route: clean(body.route, 200),
        name: clean(body.name, 60) || 'Anonymous',
        text,
        createdAt: new Date().toISOString(),
      };
      await put(`comments/${design}/${comment.id}.json`, JSON.stringify({ ...comment, keyHash: hash(key) }), {
        access: 'private', contentType: 'application/json', addRandomSuffix: false,
      });
      return res.status(201).json({ comment });
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
      const design = clean(req.query.design, 40);
      const id = clean(req.query.id, 60);
      if (!DESIGNS.has(design) || !/^[\w-]+$/.test(id)) return res.status(400).json({ error: 'Bad request' });
      const pathname = `comments/${design}/${id}.json`;
      const stored = await readComment(pathname);
      if (!stored) return res.status(404).json({ error: 'Not found' });
      if (stored.keyHash !== hash(body.key)) return res.status(403).json({ error: 'You can only delete your own comments' });
      await del(pathname);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong saving comments' });
  }
}
