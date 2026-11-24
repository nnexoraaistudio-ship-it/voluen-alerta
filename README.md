# Voluen Alerta · Imperatriz-MA

Canal para moradores avisarem sobre alagamentos, bueiros entupidos e problemas de drenagem,
e painel para a equipe da Prefeitura moderar, acompanhar e gerar o relatório mensal.

Desenvolvido pela **Voluen** · Tecnologia para cidades que evoluem.

## Como funciona

| Parte | O que faz |
| --- | --- |
| Site do morador | Registrar ocorrência (5 passos), mapa público, consulta por protocolo, política de privacidade |
| Painel da equipe (`#/equipe`) | Login, moderação, mudança de situação com recado ao morador, relatório mensal, gestão da equipe |
| Banco de dados | Supabase (servidor em São Paulo). Regras de segurança em `supabase/schema.sql` |
| Hospedagem | GitHub Pages, publicado automaticamente a cada mudança na branch `main` |

### Perfis da equipe

- **Moderador**: aprova ou recusa ocorrências novas.
- **Prefeitura**: atualiza o andamento e envia recados ao morador.
- **Administrador**: tudo, inclusive definir a função de cada pessoa.

## Modo demonstração

Sem as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`, o site roda com dados de exemplo guardados só no
navegador. O painel deixa escolher um perfil de exemplo para entrar.

## Ligar o banco de dados

1. Crie um projeto no [Supabase](https://supabase.com) na região **South America (São Paulo)**.
2. Em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Authentication → Sign In / Providers**, desligue "Allow new users to sign up" (só a equipe tem login).
4. Em **Authentication → Users → Add user**, crie seu usuário e depois rode no SQL Editor:
   `update public.perfis set papel = 'admin' where email = 'seu-email';`
5. No GitHub, em **Settings → Secrets and variables → Actions → Variables**, crie
   `SUPABASE_URL` e `SUPABASE_ANON_KEY` (Project Settings → API no Supabase).
6. Rode de novo o workflow **Publicar site** (aba Actions).

## Assistente (balãozinho de conversa)

Um assistente de IA no canto do site tira dúvidas dos moradores e ajuda a preencher o registro.
Ele usa o Claude (modelo `claude-haiku-5-5`, o mais barato) por meio de uma função no Supabase,
então a chave da IA nunca fica no site.

| Peça | Onde |
| --- | --- |
| Função do servidor (guarda a chave, limita mensagens, fala com o Claude) | `supabase/functions/assistente/index.ts` |
| Contador de mensagens por pessoa e por dia | `supabase/assistente.sql` |
| Balãozinho | `src/components/Assistente.jsx` |
| Ligar ou desligar | `ASSISTENTE_LIGADO` em `src/config.js` |

Limites padrão: 20 mensagens por pessoa por dia e 1.500 no total por dia. Dá para mudar sem
mexer no código, criando os segredos `ASSISTENTE_LIMITE_PESSOA` e `ASSISTENTE_LIMITE_TOTAL` no Supabase.
O assistente não envia nada sozinho: ele monta um rascunho e o morador confere e envia no formulário.

Para ligar: rode `supabase/assistente.sql` no SQL Editor, crie o segredo `ANTHROPIC_API_KEY` em
**Edge Functions → Secrets** e publique a função `assistente` com a verificação de JWT desligada
(o site usa a chave pública `sb_publishable_`, que não é um JWT).

## Rodar no computador

```bash
npm install
npm run dev
```
