// /api/chat.js (Nova Versão com Supabase)

import { supabase } from '../supabaseClient'; // Garanta que o caminho para a conexão está correto

export default async function handler(req, res) { 
  try {
    // ===========================
    // GET LISTAR MENSAGENS
    // ===========================
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from('chat')
        .select(`
          message,
          created_at,
          users (
            name      // Puxa o nome do usuário da tabela 'users'
          )
        `)
        .order('created_at', { ascending: true }) 
        .limit(100);

      if (error) throw error;

      // Formata a lista para retornar { name, message, time }
      const messages = data.map(item => ({
        name: item.users.name,
        message: item.message, 
        at: new Date(item.created_at).getTime()
      }));

      return res.status(200).json(messages);
    }

    // ===========================
    // POST ENVIAR MENSAGEM
    // ===========================
    if (req.method === "POST") {
      // Agora esperamos o user_id e a mensagem
      const { user_id, message } = req.body || {}; 
      
      if (!user_id || !message) {
        return res.status(400).json({ error: "missing fields (user_id, message)" });
      }

      // 1. INSERE a nova mensagem na tabela 'chat'
      const { data, error } = await supabase
        .from('chat')
        .insert([
          { 
            user_id: user_id, // Usamos a coluna correta user_id
            message: message 
          }
        ]);

      if (error) throw error;
      
      return res.status(200).json({ ok: true, data });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });

  } catch (err) {
    console.error("chat error", err);
    return res.status(500).json({ error: "internal", detail: err.message });
  }
}
