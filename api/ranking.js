// /api/ranking.js
// In-memory ranking (not persistent across cold restarts).
let ranking = []; // array of { name, time (seconds), at }

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { name, time } = req.body || {};
      if (!name || (typeof time !== 'number' && typeof time !== 'string')) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      const tnum = Math.round(Number(time));
      const entry = { name: String(name).slice(0,40), time: tnum, at: Date.now() };
      ranking.push(entry);
      // keep sorted ascending by time, limit top 100
      ranking.sort((a,b)=>a.time - b.time || a.at - b.at);
      if (ranking.length > 200) ranking = ranking.slice(0,200);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      // return top 100
      const top = ranking.slice(0,100);
      return res.status(200).json(top);
    }

    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('ranking error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
