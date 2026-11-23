export default function Barras({ itens, rotulo = (k) => k, cor = '#0B4DA2' }) {
  const max = Math.max(1, ...itens.map((i) => i[1]))
  if (!itens.length) return <p className="text-sm text-slate-500">Sem dados no período.</p>
  return (
    <ul className="space-y-2.5">
      {itens.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,140px)_1fr_32px] items-center gap-3 text-sm">
          <span className="truncate text-slate-700">{rotulo(k)}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: typeof cor === 'function' ? cor(k) : cor }} /></span>
          <b className="num text-right">{v}</b>
        </li>
      ))}
    </ul>
  )
}
