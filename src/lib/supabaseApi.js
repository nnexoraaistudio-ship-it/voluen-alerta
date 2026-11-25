// MODO REAL: dados no Supabase (servidor em São Paulo).
// As regras de quem pode ver e mudar o quê estão no banco (supabase/schema.sql),
// não aqui. Mesmo que alguém mexa neste código, o banco recusa o que não é permitido.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

// flowType 'pkce': depois do login com Google/Apple o Supabase devolve um ?code= no endereço,
// que convive bem com o HashRouter (os endereços com #/...).
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true } })
const CHAVE_VOLTA = 'voluen-login-volta'
const BUCKET = 'fotos'
const urlFoto = (path) => (path ? sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null)
const comFoto = (o) => ({ ...o, foto_url: urlFoto(o.foto_path) })
const COLUNAS_EQUIPE = 'id, protocolo, categoria, bairro, rua, referencia, lat, lng, descricao, foto_path, status, motivo_recusa, consentimento_em, created_at, resolvida_em, tem_contato'
const checar = ({ data, error }) => { if (error) throw new Error(error.message); return data }

let perfil = null
let carregado = false
const ouvintes = new Set()
const nomeDoUsuario = (u) => u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.nome || null

async function carregarPerfil(user) {
  if (!user) { perfil = null } else {
    const { data } = await sb.from('perfis').select('id, nome, email, papel').eq('id', user.id).maybeSingle()
    const nome = nomeDoUsuario(user)
    perfil = { id: user.id, email: user.email, papel: null, ...(data || {}) }
    // O nome que veio do Google/Apple vale mais que o e-mail repetido como nome.
    if (nome && (!perfil.nome || perfil.nome === perfil.email)) perfil.nome = nome
    if (!perfil.nome) perfil.nome = perfil.email
  }
  carregado = true
  ouvintes.forEach((f) => f(perfil))
}

// Volta da tela do Google/Apple: tira o ?code= (ou o erro) do endereço e leva a pessoa
// direto para onde ela estava quando tocou no botão.
let erroLogin = ''
const busca = new URLSearchParams(window.location.search)
if (busca.get('error_description') || busca.get('error')) {
  const msg = busca.get('error_description') || busca.get('error')
  erroLogin = /signup|sign up|not allowed/i.test(msg)
    ? 'Não foi possível criar sua conta agora. Tente de novo mais tarde.'
    : 'Não foi possível entrar. Tente de novo.'
}
function limparEndereco() {
  if (!window.location.search) return
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
}
function irParaVolta() {
  let volta = null
  try { volta = sessionStorage.getItem(CHAVE_VOLTA); sessionStorage.removeItem(CHAVE_VOLTA) } catch { /* nada */ }
  limparEndereco()
  if (volta && volta.startsWith('/')) window.location.hash = '#' + volta
}
if (erroLogin) { try { sessionStorage.removeItem(CHAVE_VOLTA) } catch { /* nada */ } limparEndereco() }

sb.auth.getSession().then(({ data }) => {
  if (data.session && busca.get('code')) irParaVolta()
  carregarPerfil(data.session?.user)
})
sb.auth.onAuthStateChange((e, s) => {
  if (e === 'SIGNED_IN' && busca.get('code')) irParaVolta()
  carregarPerfil(s?.user)
})

// Quais botões mostrar: o próprio Supabase diz quais provedores estão ligados.
// Assim os botões aparecem sozinhos quando o Google (ou a Apple) é ativado no painel do Supabase.
let provedoresCache = null
function lerProvedores() {
  if (!provedoresCache) {
    provedoresCache = fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => ({ google: !!j.external?.google, apple: !!j.external?.apple }))
      .catch(() => ({ google: false, apple: false }))
  }
  return provedoresCache
}

export const supabaseApi = {
  modo: 'real',
  async registrar(d, foto) {
    let foto_path = null
    if (foto) {
      foto_path = `${crypto.randomUUID()}.jpg`
      checar(await sb.storage.from(BUCKET).upload(foto_path, foto.blob, { contentType: 'image/jpeg' }))
    }
    const protocolo = checar(await sb.rpc('registrar_ocorrencia', {
      p_categoria: d.categoria, p_bairro: d.bairro, p_rua: d.rua, p_referencia: d.referencia || null,
      p_lat: d.lat, p_lng: d.lng, p_descricao: d.descricao, p_foto_path: foto_path,
      p_contato_nome: d.contato_nome || null, p_contato_telefone: d.contato_telefone || null, p_contato_email: d.contato_email || null,
    }))
    return { protocolo }
  },
  async listarPublicas() {
    return checar(await sb.from('ocorrencias_publicas').select('*').order('created_at', { ascending: false })).map(comFoto)
  },
  async consultarProtocolo(p) {
    const r = checar(await sb.rpc('consultar_protocolo', { p_protocolo: p.trim().toUpperCase() }))
    return r ? { ...comFoto(r), historico: r.historico || [] } : null
  },
  sessao: () => perfil,
  sessaoCarregada: () => carregado,
  aoMudarSessao(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn) },
  async entrar(email, senha) {
    checar(await sb.auth.signInWithPassword({ email, password: senha }))
  },
  async sair() { await sb.auth.signOut() },
  provedores: lerProvedores,
  erroLogin: () => { const e = erroLogin; erroLogin = ''; return e },
  async entrarCom(provedor, volta) {
    try { sessionStorage.setItem(CHAVE_VOLTA, volta || '/') } catch { /* nada */ }
    checar(await sb.auth.signInWithOAuth({
      provider: provedor,
      options: { redirectTo: window.location.origin + window.location.pathname },
    }))
  },
  async minhasOcorrencias() { return checar(await sb.rpc('minhas_ocorrencias')) || [] },
  async listarTodas() {
    return checar(await sb.from('ocorrencias').select(COLUNAS_EQUIPE).order('created_at', { ascending: false })).map(comFoto)
  },
  async historico(id) {
    return checar(await sb.from('historico').select('*').eq('ocorrencia_id', id).order('created_at'))
  },
  async mudarStatus(id, status, mensagem, motivo) {
    checar(await sb.rpc('mudar_status', { p_id: id, p_status: status, p_mensagem: mensagem || null, p_motivo: motivo || null }))
  },
  async removerFoto(id) {
    const { data } = await sb.from('ocorrencias').select('foto_path').eq('id', id).single()
    if (data?.foto_path) checar(await sb.storage.from(BUCKET).remove([data.foto_path]))
    checar(await sb.rpc('remover_foto', { p_id: id }))
  },
  async verContato(id) { return checar(await sb.rpc('ver_contato', { p_id: id })) },
  async apagarContato(id) { checar(await sb.rpc('apagar_contato', { p_id: id })) },
  async listarEquipe() { return checar(await sb.from('perfis').select('id, nome, email, papel').not('papel', 'is', null).order('nome')) },
  async acharPorEmail(email) {
    return checar(await sb.from('perfis').select('id, nome, email, papel').ilike('email', email.trim().replace(/[%_\\]/g, '\\$&')).limit(1).maybeSingle())
  },
  async mudarPapel(uid, papel) { checar(await sb.from('perfis').update({ papel }).eq('id', uid)) },
}
