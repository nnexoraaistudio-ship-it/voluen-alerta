// Reduz a foto antes de enviar: economiza internet do morador e remove
// os dados escondidos do arquivo (como a localização GPS da câmera).
export async function comprimirFoto(arquivo, max = 1600, qualidade = 0.8) {
  const url = URL.createObjectURL(arquivo)
  try {
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url })
    const escala = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * escala)
    c.height = Math.round(img.height * escala)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', qualidade))
    return { blob, previa: c.toDataURL('image/jpeg', 0.7) }
  } finally {
    URL.revokeObjectURL(url)
  }
}
