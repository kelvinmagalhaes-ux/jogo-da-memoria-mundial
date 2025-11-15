import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente (VARS) são a forma segura de conectar
// Elas devem estar configuradas no seu painel do Vercel e no ambiente local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// Se você estiver no Vercel, use a chave de serviço para acesso total (mais seguro para Serverless)
// Se você estiver no Front-end (o que não parece ser o caso), usaria a chave anon.
export const supabase = createClient(supabaseUrl, supabaseKey);
