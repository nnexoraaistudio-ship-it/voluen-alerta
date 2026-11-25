# Voluen Alerta · Imperatriz-MA

Canal para moradores avisarem sobre alagamentos, bueiros entupidos e problemas de drenagem,
e painel para a equipe da Prefeitura moderar, acompanhar e gerar relatórios em PDF (mensal, trimestral, semestral e anual).

Desenvolvido pela **Voluen** · Tecnologia para cidades que evoluem.

## Como funciona

| Parte | O que faz |
| --- | --- |
| Site do morador | Registrar ocorrência (5 passos), mapa público, consulta por protocolo, política de privacidade |
| Painel da equipe (`#/equipe`) | Login, moderação, mudança de situação com recado ao morador, relatórios em PDF (mensal, trimestral, semestral e anual), gestão da equipe |
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

## Rodar no computador

```bash
npm install
npm run dev
```
