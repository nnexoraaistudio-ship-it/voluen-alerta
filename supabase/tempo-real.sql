-- =====================================================================
-- Voluen Alerta · painel em tempo real
-- Como usar: no Supabase, abra "SQL Editor" → "New query", cole e clique em "Run".
-- Pode rodar de novo sem problema.
--
-- Liga o "tempo real" na tabela do histórico: cada ocorrência nova ou mudança de
-- situação avisa o painel na hora. Só quem tem função na equipe recebe, porque o
-- Realtime respeita as mesmas regras de leitura (RLS) do histórico.
-- Sem este arquivo o painel continua funcionando: ele confere sozinho a cada 20 segundos.
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'historico') then
    alter publication supabase_realtime add table public.historico;
  end if;
end $$;
