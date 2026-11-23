// MODO REAL: dados no Supabase (servidor em São Paulo).
// As regras de quem pode ver e mudar o quê estão no banco (supabase/schema.sql),
// não aqui. Mesmo que alguém mexa neste código, o banco recusa o que não é permitido.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const BUCKET = 'fotos'
const urlFoto = (path) => (path ? sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null)
const comFoto = (o) => ({ ...o, foto_url: urlFoto(o.foto_path) })
const checar = ({ data, error }) => { if (error) throw new Error(error.message); return data }

let perfil = null
let carregado = false
const ouvintes = new Set()
async function carregarPerfil(user) {
  if (!user) { perfil = null } else {
    const { data } = await sb.from('perfis').select('id, nome, email, papel').eq('id', user.id).maybeSingle()
    perfil = data || { id: user.id, email: user.email, nome: user.email, papel: null }
  }
  carregado = true
  ouvintes.forEach((f) => f(perfil))
}
sb.auth.getSession().then(({ data }) => carregarPerfil(data.session?.user))
sb.auth.onAuthStateChange((_e, s) => { carregarPerfil(s?.user) })

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
  async listarTodas() {
    return checar(await sb.from('ocorrencias').select('*').order('created_at', { ascending: false })).map(comFoto)
  },
  async historico(id) {
    return checar(await sb.from('historico').select('*').eq('ocorrencia_id', id).order('created_at'))
  },
  async mudarStatus(id, status, mensagem, motivo) {
    checar(await sb.rpc('mudar_status', { p_id: id, p_status: status, p_mensagem: mensagem || null, p_motivo: motivo || null }))
  },
  async removerFoto(id) {
    const { data } = await sb.from('ocorrencias').select('foto_path').eq('id', id).single()
    if (data?.foto_path) await sb.storage.from(BUCKET).remove([data.foto_path])
    checar(await sb.from('ocorrencias').update({ foto_path: null }).eq('id', id))
  },
  async apagarContato(id) {
    checar(await sb.from('ocorrencias').update({ contato_nome: null, contato_telefone: null, contato_email: null }).eq('id', id))
  },
  async listarEquipe() { return checar(await sb.from('perfis').select('id, nome, email, papel').order('nome')) },
  async mudarPapel(uid, papel) { checar(await sb.from('perfis').update({ papel }).eq('id', uid)) },
}
