export const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const data = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const mesAno = (d) => d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
export const diasEntre = (a, b) => (new Date(b) - new Date(a)) / 86400000
export const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0)
export const contar = (lista, chave) => {
  const c = {}
  lista.forEach((o) => { const k = typeof chave === 'function' ? chave(o) : o[chave]; c[k] = (c[k] || 0) + 1 })
  return Object.entries(c).sort((a, b) => b[1] - a[1])
}
