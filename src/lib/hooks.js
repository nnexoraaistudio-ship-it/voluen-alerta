import { useEffect, useState, useCallback } from 'react'
import { api } from './api'

export function useSessao() {
  const [perfil, setPerfil] = useState(() => api.sessao())
  const [carregado, setCarregado] = useState(() => api.sessaoCarregada())
  useEffect(() => api.aoMudarSessao((p) => { setPerfil(p); setCarregado(true) }), [])
  return { perfil, carregado }
}

// Carrega dados com estados de "carregando" e "erro" e permite recarregar.
export function useCarregar(fn, deps = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })
  const recarregar = useCallback(() => {
    setEstado((e) => ({ ...e, carregando: true, erro: null }))
    return fn().then(
      (dados) => setEstado({ dados, carregando: false, erro: null }),
      (erro) => setEstado({ dados: null, carregando: false, erro: erro.message || 'Algo deu errado.' }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { recarregar() }, [recarregar])
  return { ...estado, recarregar }
}
