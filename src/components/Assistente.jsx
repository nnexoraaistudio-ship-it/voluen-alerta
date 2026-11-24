import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { VoluenIcone } from './Marca'
import { Icone } from './ui'
import { CATEGORIAS } from '../lib/constants'
import { perguntar, lerConversa, gravarConversa, apagarConversa, gravarRascunho } from '../lib/assistente'
import { TEL_DEFESA_CIVIL, TEL_BOMBEIROS } from '../config'

const BOAS_VINDAS = 'Olá! Sou o assistente do Imperatriz em Alerta. Posso tirar dúvidas sobre o site e ajudar você a registrar um problema de alagamento ou drenagem, passo a passo.'
const SUGESTOES = [
  'Quero avisar sobre um alagamento',
  'Como registro um problema?',
  'Como acompanho meu protocolo?',
  'Isso é da Prefeitura?',
]

const Balao = (p) => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg>
const Enviar = (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>

// Mostra o texto do assistente: parágrafos e listas com "- ".
function Texto({ texto }) {
  const blocos = []
  for (const linha of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const item = linha.match(/^[-•*]\s+(.*)$/) || linha.match(/^\d+[.)]\s+(.*)$/)
    const ultimo = blocos[blocos.length - 1]
    if (item) { if (ultimo?.lista) ultimo.itens.push(item[1]); else blocos.push({ lista: true, itens: [item[1]] }) }
    else blocos.push({ lista: false, texto: linha })
  }
  const limpar = (t) => t.replace(/\*\*(.+?)\*\*/g, '$1')
  return (
    <div className="space-y-2">
      {blocos.map((b, i) => b.lista
        ? <ul key={i} className="ml-4 list-disc space-y-1">{b.itens.map((t, j) => <li key={j}>{limpar(t)}</li>)}</ul>
        : <p key={i}>{limpar(b.texto)}</p>)}
    </div>
  )
}

function CartaoRascunho({ rascunho, abrir }) {
  const cat = CATEGORIAS[rascunho.categoria]?.nome
  return (
    <div className="mt-2 rounded-2xl border border-brand/20 bg-brand-50 p-3 text-[13px] text-deep">
      <div className="font-semibold">Rascunho do registro</div>
      <div className="mt-1 text-slate-600">{[cat, rascunho.bairro, rascunho.rua].filter(Boolean).join(' · ')}</div>
      {rascunho.referencia && <div className="text-slate-600">Ref.: {rascunho.referencia}</div>}
      <button type="button" onClick={abrir} className="btn-brand mt-3 w-full !py-2 text-[13px]">Abrir formulário preenchido <Icone.seta /></button>
      <p className="mt-2 text-[11.5px] leading-snug text-slate-500">Você confere, marca o ponto no mapa e envia. Nada é enviado sem você.</p>
    </div>
  )
}

export default function Assistente() {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState(lerConversa)
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const lista = useRef(null)
  const campo = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const noFormulario = pathname === '/registrar'

  useEffect(() => { gravarConversa(mensagens) }, [mensagens])
  useEffect(() => { lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' }) }, [mensagens, pensando, aberto])

  // No celular o painel ocupa a tela toda: trava a rolagem da página por trás.
  useEffect(() => {
    if (!aberto) return
    const telaPequena = window.matchMedia('(max-width: 639px)').matches
    const antes = document.body.style.overflow
    if (telaPequena) document.body.style.overflow = 'hidden'
    else campo.current?.focus()
    const esc = (e) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', esc) }
  }, [aberto])

  async function mandar(conteudo) {
    const t = conteudo.trim()
    if (!t || pensando || bloqueado) return
    const nova = [...mensagens, { role: 'user', content: t.slice(0, 600) }]
    setMensagens(nova); setTexto(''); setPensando(true)
    const r = await perguntar(nova.filter((m) => !m.local))
    setPensando(false)
    if (r.limite) setBloqueado(true)
    setMensagens((m) => [...m, r.erro ? { role: 'assistant', content: r.texto, local: true } : { role: 'assistant', content: r.texto, rascunho: r.rascunho || undefined }])
  }

  function abrirFormulario(rascunho) {
    gravarRascunho(rascunho)
    if (window.matchMedia('(max-width: 639px)').matches) setAberto(false)
    navigate('/registrar', { state: { rascunho: Date.now() } })
  }

  function recomecar() { apagarConversa(); setMensagens([]); setBloqueado(false) }

  return (
    <div className="no-print">
      {!aberto && (
        <button type="button" onClick={() => setAberto(true)} aria-label="Abrir o assistente de dúvidas"
          className={`fixed right-4 z-[1050] flex items-center gap-2 rounded-full bg-destaque p-3 text-white shadow-[0_10px_30px_rgba(7,43,90,.35)] ring-4 ring-white transition hover:brightness-110 active:scale-95 sm:bottom-6 sm:right-6 sm:px-5 ${noFormulario ? 'bottom-[calc(9.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'}`}>
          <Balao />
          <span className="hidden text-sm font-semibold sm:inline">Tirar dúvidas</span>
        </button>
      )}

      {aberto && (
        <section role="dialog" aria-label="Assistente do Imperatriz em Alerta"
          className="fixed inset-0 z-[1200] flex h-[100dvh] flex-col bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100dvh-3rem))] sm:w-[390px] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-[0_24px_60px_rgba(7,43,90,.25)]">
          <header className="flex items-center gap-3 bg-destaque px-4 py-3 text-white" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <VoluenIcone size={40} className="shrink-0 rounded-[10px] ring-2 ring-white/40" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="font-display text-[16px] font-semibold">Assistente</div>
              <div className="truncate text-xs text-white/80">Imperatriz em Alerta</div>
            </div>
            {mensagens.length > 0 && <button type="button" onClick={recomecar} className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15">Recomeçar</button>}
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar o assistente" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"><Icone.x /></button>
          </header>

          <div ref={lista} className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-mist px-4 py-4 text-[15px] leading-relaxed" aria-live="polite">
            <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[13px] leading-snug text-rose-900">
              <Icone.alerta className="mt-0.5 shrink-0" width="16" height="16" />
              <span>Emergência? Ligue <a href={`tel:${TEL_DEFESA_CIVIL}`} className="font-bold underline">{TEL_DEFESA_CIVIL}</a> (Defesa Civil) ou <a href={`tel:${TEL_BOMBEIROS}`} className="font-bold underline">{TEL_BOMBEIROS}</a> (Bombeiros).</span>
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-deep shadow-soft">{BOAS_VINDAS}</div>
            {mensagens.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGESTOES.map((s) => <button key={s} type="button" onClick={() => mandar(s)} className="rounded-full border border-brand/25 bg-white px-3 py-1.5 text-left text-[13px] font-medium text-brand hover:bg-brand-50">{s}</button>)}
              </div>
            )}
            {mensagens.map((m, i) => m.role === 'user'
              ? <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-brand px-3.5 py-2.5 text-white">{m.content}</div>
              : (
                <div key={i} className={`max-w-[88%] break-words rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-soft ${m.local ? 'bg-amber-50 text-amber-900' : 'bg-white text-deep'}`}>
                  <Texto texto={m.content} />
                  {m.rascunho && <CartaoRascunho rascunho={m.rascunho} abrir={() => abrirFormulario(m.rascunho)} />}
                </div>
              ))}
            {pensando && (
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3.5 shadow-soft" role="status" aria-label="O assistente está escrevendo">
                {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-brand/60" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); mandar(texto) }} className="border-t border-slate-200 bg-white px-3 pt-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-end gap-2">
              <label htmlFor="assistente-texto" className="sr-only">Sua mensagem</label>
              <textarea id="assistente-texto" ref={campo} rows={1} value={texto} maxLength={600} disabled={bloqueado}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mandar(texto) } }}
                placeholder={bloqueado ? 'Limite de hoje atingido' : 'Escreva sua dúvida…'}
                className="input max-h-32 min-h-[44px] flex-1 resize-none !rounded-2xl !text-base" />
              <button type="submit" disabled={!texto.trim() || pensando || bloqueado} aria-label="Enviar mensagem" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-700 active:scale-95 disabled:opacity-40"><Enviar /></button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-snug text-slate-400">Assistente automático, pode errar. Não fala pela Prefeitura. Não escreva dados pessoais.</p>
          </form>
        </section>
      )}
    </div>
  )
}
