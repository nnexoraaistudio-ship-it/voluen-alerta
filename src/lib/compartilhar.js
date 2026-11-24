// Endereço público do site (sem o # das páginas), usado nos links compartilhados.
export function enderecoSite() {
  return window.location.href.split('#')[0]
}

export function linkWhatsApp(texto) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}

// Usa o menu de compartilhar do celular quando existe; senão, abre o WhatsApp.
export async function compartilhar({ titulo, texto, url }) {
  if (navigator.share) {
    try { await navigator.share({ title: titulo, text: texto, url }); return } catch (e) { if (e?.name === 'AbortError') return }
  }
  window.open(linkWhatsApp(`${texto} ${url}`), '_blank', 'noopener')
}
