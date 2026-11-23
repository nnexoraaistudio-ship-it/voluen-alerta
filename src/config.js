// Conexão com o banco de dados (Supabase).
// Enquanto estes dois campos estiverem vazios, o site roda em MODO DEMONSTRAÇÃO,
// com dados de exemplo guardados só no navegador de quem estiver usando.
// A "anon key" é pública por natureza: ela foi feita para ficar no site.
// Quem protege os dados são as regras de segurança do banco (supabase/schema.sql).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jpkmbxubifxzcekzsspt.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2A06J-BfBKJxOZ52wg8ZnA_rckp2AGj'

export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === '1' || !SUPABASE_URL || !SUPABASE_ANON_KEY

export const CONTATO_EMAIL = 'nnexora.ai.studio@gmail.com'
export const RESPONSAVEL = 'Filipe Assunção'
export const CIDADE = 'Imperatriz-MA'
export const CENTRO_MAPA = [-5.5235, -47.4735]
