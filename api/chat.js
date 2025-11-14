// /api/chat.js
// Chat + sistema de nomes exclusivos (IP-based)

let messages = []; // array of { name, msg, at }
let nameToIP = {}; // { name: ip }
const lastPost = new Map(); // ip -> timestamp ms

const RATE_MS = 1500;
const MAX_MESSAGES = 500;

function getIP(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export default function handler(req, res) {
  try {

    // ===========================
    // GET MENSAGENS
    // ===========================
    if (req.method === "GET") {
      const out = messages.slice(-200);
      return res.status(200).json(out);
    }

    // ===========================
    // POST ENVIAR MENSAGEM
    // ===========================
    if (req.method === "POST") {
      const { name, msg } = req.body || {};

      if (!name || !msg) {
        return res.status(400).json({ error: "missing fields" });
      }

      const cleanName = String(name).trim().slice(0, 30);
      const ip = getIP(req);
      const now = Date.now();

      // rate limit
      const last = lastPost.get(ip) || 0;
      if (now - last < RATE_MS) {
        return res.status(429).json({ error: "rate limit" });
      }
      lastPost.set(ip, now);

      // ===========================
      // VERIFICAR SE O NOME JÁ TEM DONO
      // ===========================
      const existingIP = nameToIP[cleanName];

      if (existingIP && existingIP !== ip) {
        return res.status(409).json({
          error: "name_taken",
          msg: "Esse nome já está sendo usado."
        });
      }

      // se não existe dono, registrar
      if (!existingIP) {
        nameToIP[cleanName] = ip;
      }

      // registrar mensagem
      messages.push({
        name: cleanName,
        msg: String(msg).slice(0, 400),
        at: now
      });

      if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });

  } catch (err) {
    console.error("chat error", err);
    return res.status(500).json({ error: "internal" });
  }
}
