// Conexão com o banco de dados (Supabase).
// Enquanto estes dois campos estiverem vazios, o site roda em MODO DEMONSTRAÇÃO,
// com dados de exemplo guardados só no navegador de quem estiver usando.
// A "anon key" é pública por natureza: ela foi feita para ficar no site.
// Quem protege os dados são as regras de segurança do banco (supabase/schema.sql).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jpkmbxubifxzcekzsspt.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2A06J-BfBKJxOZ52wg8ZnA_rckp2AGj'

export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === '1' || !SUPABASE_URL || !SUPABASE_ANON_KEY

export const CONTATO_EMAIL = 'contato@voluen.com.br'
export const RESPONSAVEL = 'Filipe Assunção'
export const CIDADE = 'Imperatriz-MA'
export const CENTRO_MAPA = [-5.5235, -47.4735]

// Avisos por e-mail ao morador (Brevo). Enquanto estiver false, o site NÃO promete
// enviar e-mails. Quando os avisos forem ligados no banco (supabase/notificacoes.sql),
// troque para true e publique de novo: o texto do registro volta a prometer os avisos.
export const AVISOS_EMAIL_LIGADOS = true

// Telefones de emergência mostrados no site.
export const TEL_DEFESA_CIVIL = '199'
export const TEL_BOMBEIROS = '193'
