import { ASSISTENTE_URL, SUPABASE_ANON_KEY } from '../config'

const CHAVE_CONVERSA = 'voluen-assistente-conversa'
const CHAVE_RASCUNHO = 'voluen-assistente-rascunho'

// Manda a conversa para a função do servidor e devolve { texto, rascunho }.
export async function perguntar(mensagens) {
  let r
  try {
    r = await fetch(ASSISTENTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ mensagens: mensagens.map(({ role, content }) => ({ role, content })) }),
    })
  } catch {
    return { erro: true, texto: 'Não consegui me conectar. Confira sua internet e tente de novo.' }
  }
  const corpo = await r.json().catch(() => ({}))
  if (r.ok && corpo.texto) return { texto: corpo.texto, rascunho: corpo.rascunho || null }
  if (r.status === 429 && corpo.texto) return { erro: true, limite: true, texto: corpo.texto }
  return { erro: true, texto: 'O assistente está indisponível agora. Você pode registrar o problema direto pelo botão Registrar.' }
}

const ler = (chave) => { try { return JSON.parse(sessionStorage.getItem(chave) || 'null') } catch { return null } }
const gravar = (chave, valor) => { try { sessionStorage.setItem(chave, JSON.stringify(valor)) } catch { /* nada */ } }

export const lerConversa = () => ler(CHAVE_CONVERSA) || []
export const gravarConversa = (m) => gravar(CHAVE_CONVERSA, m.slice(-30))
export const apagarConversa = () => { try { sessionStorage.removeItem(CHAVE_CONVERSA) } catch { /* nada */ } }

// Rascunho do formulário preparado pelo assistente. O formulário lê uma vez e apaga.
export const gravarRascunho = (r) => gravar(CHAVE_RASCUNHO, r)
export function pegarRascunho() {
  const r = ler(CHAVE_RASCUNHO)
  try { sessionStorage.removeItem(CHAVE_RASCUNHO) } catch { /* nada */ }
  return r
}
