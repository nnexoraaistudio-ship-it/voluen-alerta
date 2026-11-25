export const CATEGORIAS = {
  alagamento: { nome: 'Alagamento', desc: 'Pontos que alagam quando chove.', cor: '#2563EB' },
  bueiro: { nome: 'Bueiro ou boca de lobo entupido', desc: 'Bueiros e bocas de lobo obstruídos ou quebrados.', cor: '#7C3AED' },
  canal: { nome: 'Riacho ou canal transbordando', desc: 'Riachos, canais e valas saindo do leito.', cor: '#0891B2' },
  lixo: { nome: 'Lixo ou entulho no canal', desc: 'Lixo ou entulho bloqueando a passagem da água.', cor: '#B45309' },
  escoamento: { nome: 'Rua sem escoamento', desc: 'Ruas onde a água da chuva fica parada.', cor: '#0F766E' },
  outro: { nome: 'Outro problema de drenagem', desc: 'Outras situações ligadas à água da chuva.', cor: '#475569' },
}

export const STATUS = {
  moderacao: { nome: 'Aguardando moderação', curto: 'Em moderação', cls: 'bg-amber-100 text-amber-800 ring-amber-200', dot: '#D97706', desc: 'A equipe está conferindo as informações antes de publicar.' },
  recebida: { nome: 'Recebida', curto: 'Recebida', cls: 'bg-sky-100 text-sky-800 ring-sky-200', dot: '#0284C7', desc: 'A ocorrência foi conferida e publicada no mapa.' },
  em_analise: { nome: 'Em análise', curto: 'Em análise', cls: 'bg-orange-100 text-orange-800 ring-orange-200', dot: '#EA580C', desc: 'A equipe está avaliando o local e a solução.' },
  encaminhada: { nome: 'Encaminhada', curto: 'Encaminhada', cls: 'bg-violet-100 text-violet-800 ring-violet-200', dot: '#7C3AED', desc: 'O caso foi enviado ao setor responsável pelo serviço.' },
  resolvida: { nome: 'Resolvida', curto: 'Resolvida', cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200', dot: '#059669', desc: 'O problema foi resolvido no local.' },
  recusada: { nome: 'Recusada', curto: 'Recusada', cls: 'bg-rose-100 text-rose-800 ring-rose-200', dot: '#E11D48', desc: 'A ocorrência não foi publicada.' },
}

export const FLUXO = ['recebida', 'em_analise', 'encaminhada', 'resolvida']
export const PUBLICOS = ['recebida', 'em_analise', 'encaminhada', 'resolvida']

export const MOTIVOS_RECUSA = [
  'Ocorrência repetida: já existe um aviso para este local.',
  'Não é um problema de drenagem. Procure o setor responsável.',
  'Informações insuficientes para localizar o problema.',
  'Conteúdo impróprio ou que não respeita outras pessoas.',
  'O local informado fica fora de Imperatriz.',
  'A foto não mostra o problema ou mostra rostos e placas de veículos.',
]
export const OUTRO_MOTIVO = 'Outro motivo (escrever)'

export const PAPEIS = {
  moderador: { nome: 'Moderador', desc: 'Confere e aprova ou recusa as ocorrências novas.' },
  prefeitura: { nome: 'Prefeitura', desc: 'Atualiza o andamento e envia mensagens ao morador.' },
  admin: { nome: 'Administrador', desc: 'Faz tudo, inclusive gerenciar a equipe.' },
}

export const pode = {
  moderar: (p) => p === 'moderador' || p === 'admin',
  atualizar: (p) => p === 'prefeitura' || p === 'admin',
  equipe: (p) => p === 'admin',
}

// Lista de bairros de Imperatriz. Pode ser ampliada; o morador também pode digitar outro.
export const BAIRROS = [
  'Bacuri', 'Beira Rio', 'Bom Jesus', 'Bom Sucesso', 'Cafeteira', 'Camaçari', 'Centro', 'Centro Novo',
  'Conjunto Vitória', 'Entroncamento', 'Jardim América', 'Jardim Cristo Rei', 'Jardim Lagoa', 'Jardim Oriental',
  'Jardim Planalto', 'Jardim São Luís', 'Juçara', 'Maranhão Novo', 'Mercadinho', 'Nova Imperatriz',
  'Parque Alvorada', 'Parque Amazonas', 'Parque Anhanguera', 'Parque das Palmeiras', 'Parque do Buriti',
  'Parque Sanharol', 'Parque Santa Lúcia', 'Parque São José', 'Santa Inês', 'Santa Rita', 'São José do Egito',
  'Três Poderes', 'Vila Cafeteira', 'Vila Fiquene', 'Vila JK', 'Vila Lobão', 'Vila Machado', 'Vila Nova',
  'Vila Redenção', 'Vila São João', 'Vila Zenira',
]
