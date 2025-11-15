// Localização: /api/chat.js (ou .ts)

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// SUPABASE_URL é assumida como a URL do seu projeto (pode ser hardcoded ou via process.env)
const SUPABASE_URL = 'https://qkezkaiormdbmknisqdp.supabase.co'; 

// A CHAVE DE SERVIÇO DEVE SER LIDA DO AMBIENTE (Vercel)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa o cliente Supabase com a Service Role Key (Para operações de servidor)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função que o Vercel Edge executa
export default async function handler(request) {
    
    // --- LÓGICA DE LEITURA (GET) ---
    if (request.method === 'GET') {
        try {
            // Usa a Service Role Key para ler o chat (acesso total)
            const { data, error } = await supabase
                .from('chat')
                .select('name, message, created_at') // Seleciona apenas os campos necessários
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (error) throw error;
            
            // Retorna em ordem cronológica (mais antigo primeiro)
            return new Response(JSON.stringify(data.reverse()), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error('Erro ao buscar chat:', error.message);
            return new Response(JSON.stringify({ error: 'Falha ao buscar chat' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

    // --- LÓGICA DE ESCRITA (POST) ---
    } else if (request.method === 'POST') {
        
        // 1. OBTÉM O TOKEN DE AUTORIZAÇÃO DO FRONT-END
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Token de autorização ausente ou inválido' }), {
                status: 401, // Unauthorized
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const token = authHeader.split(' ')[1];
        
        // 2. VERIFICA O TOKEN USANDO A CHAVE DE SERVIÇO
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Sessão expirada. Faça login novamente.' }), {
                status: 401, // Unauthorized
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // 3. PROCESSA O PAYLOAD
        const payload = await request.json();
        const { name, message } = payload; // user_id é opcional, mas o user.id do token é mais seguro
        
        if (!message || !name) {
            return new Response(JSON.stringify({ error: 'Nome e mensagem são obrigatórios' }), {
                status: 400, // Bad Request
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // 4. INSERE NO BANCO DE DADOS
        try {
            const { error } = await supabase
                .from('chat') // Nome da sua tabela
                .insert([{ 
                    name, 
                    message, 
                    user_id: user.id, // Usa o ID do usuário verificado
                    user_email: user.email 
                }]);
                
            if (error) throw error;
            
            return new Response(JSON.stringify({ message: 'Mensagem enviada com sucesso!' }), {
                status: 201, // Created
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error('Erro ao inserir chat no DB:', error.message);
            return new Response(JSON.stringify({ error: 'Falha na inserção no banco de dados' }), {
                status: 500, // Internal Server Error
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
    
    // Método não permitido
    return new Response('Método não permitido', { status: 405 });
}
