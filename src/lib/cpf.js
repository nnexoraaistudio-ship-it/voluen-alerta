// CPF da equipe da prefeitura: validação e formato.
// O login por CPF usa uma conta interna no formato <11 dígitos>@cpf.voluen.com.br
// (esse "e-mail" não existe e nunca recebe mensagens; serve só para o Supabase).
export const DOMINIO_CPF = 'cpf.voluen.com.br'

export const soDigitos = (v) => String(v || '').replace(/\D/g, '')

export function cpfValido(v) {
  const c = soDigitos(v)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const dv = (n) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10])
}

export function formatarCpf(v) {
  const c = soDigitos(v).slice(0, 11)
  return c.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
}

// Mostra só o meio do CPF na tela (LGPD): ***.456.789-**
export const cpfMascarado = (v) => { const c = soDigitos(v); return c.length === 11 ? `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**` : '' }

export const emailDoCpf = (v) => `${soDigitos(v)}@${DOMINIO_CPF}`
export const ehContaCpf = (email) => String(email || '').endsWith('@' + DOMINIO_CPF)
