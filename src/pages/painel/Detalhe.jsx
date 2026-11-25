import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { CATEGORIAS, STATUS, FLUXO, MOTIVOS_RECUSA, OUTRO_MOTIVO, pode } from '../../lib/constants'
import { dataHora } from '../../lib/format'
import { Icone, StatusPill } from '../../components/ui'
import Mapa from '../../components/Mapa'
import { usePainel } from './contexto'

export default function Detalhe({ id, fechar }) {
  const { lista, perfil, recarregar } = usePainel()
  const o = lista.find((x) => x.id === id)
  const [hist, setHist] = useState([])
  const [novo, setNovo] = useState('')
  const [msg, setMsg] = useState('')
  const [recusando, setRecusando] = useState(false)
  const [motivoLivre, setMotivoLivre] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS_RECUSA[0])
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState('')
  const [contato, setContato] = useState(null)

  useEffect(() => { setAviso(''); setRecusando(false); setContato(null) }, [id])
  useEffect(() => { if (o) { api.historico(o.id).then(setHist); setNovo(o.status); setMsg('') } }, [o?.id, o?.status]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = (e) => e.key === 'Escape' && fechar(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [fechar])
  if (!o) return null

  async function fazer(fn, texto) {
    setOcupado(true); setAviso('')
    try { await fn(); await recarregar(); setAviso(texto) } catch (e) { setAviso('Erro: ' + e.message) } finally { setOcupado(false) }
  }
  const temContato = o.tem_contato
  const ehAdmin = perfil.papel === 'admin'

  return (
    <div className="fixed inset-0 z-[2000] no-print">
      <div className="absolute inset-0 bg-deep/40" onClick={fechar} />
      <aside role="dialog" aria-label="Detalhes da ocorrência" className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <div className="font-mono text-xs text-slate-500">{o.protocolo}</div>
            <h2 className="mt-1 text-xl font-semibold">{CATEGORIAS[o.categoria]?.nome}</h2>
            <div className="mt-1.5"><StatusPill status={o.status} /></div>
          </div>
          <button onClick={fechar} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100" aria-label="Fechar"><Icone.x /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {aviso && <div className={`rounded-xl p-3 text-sm ${aviso.startsWith('Erro') ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>{aviso}</div>}

          {o.status === 'moderacao' && pode.moderar(perfil.papel) && (
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="font-semibold text-amber-900">Moderação</div>
              <p className="mt-1 text-sm text-amber-900/80">Confira se a ocorrência é real, não está repetida e se a foto não mostra rostos ou placas.</p>
              {!recusando ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={ocupado} onClick={() => fazer(() => api.mudarStatus(o.id, 'recebida'), 'Aprovada e publicada no mapa.')} className="btn bg-emerald-600 text-white hover:bg-emerald-700">Aprovar e publicar</button>
                  <button disabled={ocupado} onClick={() => setRecusando(true)} className="btn bg-rose-100 text-rose-800 hover:bg-rose-200">Recusar</button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <label className="label" htmlFor="mot">Motivo (o morador verá)</label>
                  <select id="mot" className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}>{[...MOTIVOS_RECUSA, OUTRO_MOTIVO].map((m) => <option key={m}>{m}</option>)}</select>
                  <label className="label" htmlFor="just">{motivo === OUTRO_MOTIVO ? 'Escreva o motivo (obrigatório)' : 'Justificativa para o morador (opcional)'}</label>
                  <textarea id="just" className="input min-h-[80px]" maxLength={400} placeholder={motivo === OUTRO_MOTIVO ? 'Explique com educação por que o aviso não foi publicado.' : 'Ex.: Já existe o protocolo VA-2026-00012 para este mesmo bueiro.'} value={motivoLivre} onChange={(e) => setMotivoLivre(e.target.value)} />
                  <p className="text-xs text-amber-900/80">Se o morador deixou e-mail, ele recebe um aviso com este motivo.</p>
                  <div className="flex gap-2">
                    <button disabled={ocupado || (motivo === OUTRO_MOTIVO && motivoLivre.trim().length < 5)} onClick={() => fazer(() => api.mudarStatus(o.id, 'recusada', null, motivo === OUTRO_MOTIVO ? motivoLivre.trim() : [motivo, motivoLivre.trim()].filter(Boolean).join(' ')), 'Ocorrência recusada. O morador vê o motivo no protocolo e recebe por e-mail, se deixou um.')} className="btn bg-rose-600 text-white hover:bg-rose-700">Confirmar recusa</button>
                    <button onClick={() => setRecusando(false)} className="btn-ghost">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {o.status === 'moderacao' && !pode.moderar(perfil.papel) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Aguardando um moderador aprovar.</p>}

          {FLUXO.includes(o.status) && pode.atualizar(perfil.papel) && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="font-semibold">Atualizar andamento</div>
              <label className="label mt-3" htmlFor="ns">Situação</label>
              <select id="ns" className="input" value={novo} onChange={(e) => setNovo(e.target.value)}>{FLUXO.map((k) => <option key={k} value={k}>{STATUS[k].nome}</option>)}</select>
              <label className="label mt-3" htmlFor="nm">Recado para o morador (opcional)</label>
              <textarea id="nm" className="input min-h-[80px]" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} placeholder="Ex.: equipe enviada para limpeza do bueiro amanhã pela manhã." />
              <button disabled={ocupado || (novo === o.status && !msg.trim())} onClick={() => fazer(() => api.mudarStatus(o.id, novo, msg), 'Atualização salva. O morador já vê no protocolo.')} className="btn-brand mt-3">Salvar atualização</button>
            </div>
          )}

          {o.foto_url ? (
            <div>
              <img src={o.foto_url} alt="Foto enviada pelo morador" className="max-h-72 w-full rounded-2xl object-cover" />
              {pode.moderar(perfil.papel) && <button disabled={ocupado} onClick={() => fazer(() => api.removerFoto(o.id), 'Foto removida.')} className="mt-2 text-xs font-semibold text-rose-700">Remover foto (rosto, placa ou imprópria)</button>}
            </div>
          ) : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Sem foto.</div>}

          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-slate-500">Bairro</dt><dd>{o.bairro}</dd>
            <dt className="text-slate-500">Rua</dt><dd>{o.rua}</dd>
            {o.referencia && <><dt className="text-slate-500">Referência</dt><dd>{o.referencia}</dd></>}
            <dt className="text-slate-500">Registrada</dt><dd>{dataHora(o.created_at)}</dd>
            <dt className="text-slate-500">Descrição</dt><dd className="whitespace-pre-wrap">{o.descricao}</dd>
            <dt className="text-slate-500">Contato</dt>
            <dd>{temContato ? (<>
              {contato ? (<>
                <div>{contato.nome}</div><div className="select-all">{contato.telefone}</div><div className="select-all">{contato.email}</div>
              </>) : ehAdmin ? (
                <button disabled={ocupado} onClick={() => api.verContato(o.id).then(setContato, (e) => setAviso('Erro: ' + e.message))} className="text-xs font-semibold text-brand">Mostrar contato</button>
              ) : <span className="text-slate-500">Informado (visível só para administradores)</span>}
              {pode.moderar(perfil.papel) && <div><button disabled={ocupado} onClick={() => fazer(async () => { await api.apagarContato(o.id); setContato(null) }, 'Dados de contato apagados.')} className="mt-1 text-xs font-semibold text-rose-700">Apagar dados de contato</button></div>}
            </>) : <span className="text-slate-400">Anônimo ou já apagado</span>}</dd>
            <dt className="text-slate-500">Consentimento</dt><dd>{o.consentimento_em ? dataHora(o.consentimento_em) : '–'}</dd>
          </dl>

          <div className="overflow-hidden rounded-2xl border border-slate-200"><Mapa pontos={[o]} foco={[o.lat, o.lng]} className="h-48" interativo={false} /></div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Histórico</div>
            <ol className="space-y-2">
              {hist.map((h) => (
                <li key={h.id || h.created_at} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between gap-2"><b>{STATUS[h.status]?.nome || h.status}</b><span className="text-xs text-slate-400">{dataHora(h.created_at)}</span></div>
                  {h.mensagem && <p className="mt-1 text-slate-600">{h.mensagem}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  )
}
