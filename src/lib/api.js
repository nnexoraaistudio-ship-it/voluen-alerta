import { MODO_DEMO } from '../config'
import { demoApi } from './demo'

// Escolhe o modo: demonstração (sem banco) ou real (Supabase).
let impl = demoApi
export const pronto = MODO_DEMO
  ? Promise.resolve(demoApi)
  : import('./supabaseApi').then((m) => { impl = m.supabaseApi; return impl })

export const api = new Proxy({}, { get: (_t, k) => impl[k] })
