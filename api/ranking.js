// ranking.js (Nova Versão com Supabase)

// Altere o caminho se o seu arquivo supabaseClient.js estiver em outro lugar
import { supabase } from '../lib/supabaseClient'; 

export default async function handler(req, res) { 
  try {
    // ===========================
    // GET LISTAR RANKING
    // ===========================
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from('ranking')
        .select(`
          score,
          users (
            name      // Puxa o nome do usuário da tabela 'users'
          )
        `)
        .order('score', { ascending: true }) 
        .limit(100);

      if (error) throw error;

      // Formata a lista para retornar { name, time }
      const top = data.map(item => ({
        name: item.users.name,
        time: item.score, 
        at: new Date().getTime() // A data exata pode ser ajustada
      }));

      return res.status(200).json(top);
    }

    // ===========================
    // POST REGISTRAR TEMPO
    // ===========================
    if (req.method === "POST") {
      // ATENÇÃO: Seu jogo AGORA precisa enviar o 'user_id' do Supabase no corpo da requisição POST
      const { name, time, user_id } = req.body || {}; 
      
      if (!name || time == null || !user_id) {
        // Agora exigimos o user_id para registrar no Supabase
        return res.status(400).json({ error: "missing fields (name, time, user_id)" });
      }

      // 1. INSERE/ATUALIZA o registro na tabela 'ranking'
      const { data, error } = await supabase
        .from('ranking')
        .upsert([
          { 
            user_id: user_id, // Usamos a coluna correta user_id
            score: time 
          }
        ], { onConflict: 'user_id' }); // Atualiza se já existir pontuação para este usuário

      if (error) throw error;
      
      return res.status(200).json({ ok: true, data });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });

  } catch (err) {
    console.error("ranking error", err);
    return res.status(500).json({ error: "internal", detail: err.message });
  }
}
