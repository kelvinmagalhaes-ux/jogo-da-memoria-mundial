// /api/ranking.js
// Ranking global simples + nome exclusivo por IP

let scores = [];           // { name, time, at }
let nameToIP = {};         // { name: ip }

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
    // GET LISTAR RANKING
    // ===========================
    if (req.method === "GET") {
      const top = scores
        .sort((a, b) => a.time - b.time)
        .slice(0, 100);

      return res.status(200).json(top);
    }

    // ===========================
    // POST REGISTRAR TEMPO
    // ===========================
    if (req.method === "POST") {
      const { name, time } = req.body || {};
      if (!name || time == null) {
        return res.status(400).json({ error: "missing fields" });
      }

      const cleanName = String(name).trim().slice(0, 30);
      const ip = getIP(req);

      // conferir se o nome já pertence a outro IP
      const existingIP = nameToIP[cleanName];
      if (existingIP && existingIP !== ip) {
        return res.status(409).json({
          error: "name_taken",
          msg: "Esse nome já está sendo usado."
        });
      }

      // registrar nome → ip
      if (!existingIP) {
        nameToIP[cleanName] = ip;
      }

      scores.push({
        name: cleanName,
        time,
        at: Date.now()
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });

  } catch (err) {
    console.error("ranking error", err);
    return res.status(500).json({ error: "internal" });
  }
}
