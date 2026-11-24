// Guarda no próprio aparelho os protocolos que a pessoa registrou, para ela não
// perder o número. Nada disso vai para o servidor; some se a pessoa limpar o navegador.
const CHAVE = 'voluen-meus-protocolos'
const LIMITE = 20

export function lerProtocolos() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE) || '[]')
    return Array.isArray(lista) ? lista.filter((p) => p && typeof p.protocolo === 'string') : []
  } catch { return [] }
}

export function guardarProtocolo(item) {
  try {
    const lista = [item, ...lerProtocolos().filter((p) => p.protocolo !== item.protocolo)].slice(0, LIMITE)
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch { /* navegador sem armazenamento: segue sem guardar */ }
}

export function esquecerProtocolo(protocolo) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lerProtocolos().filter((p) => p.protocolo !== protocolo)))
  } catch { /* nada */ }
}
