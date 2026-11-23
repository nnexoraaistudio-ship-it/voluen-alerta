import { createContext, useContext } from 'react'
export const PainelCtx = createContext(null)
export const usePainel = () => useContext(PainelCtx)
