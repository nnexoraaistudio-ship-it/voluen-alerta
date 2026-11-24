-- Assistente do site (balãozinho de chat).
-- Cole este arquivo no SQL Editor do Supabase e clique em Run. Pode rodar de novo sem problema.
--
-- Guarda só uma contagem de mensagens por dia. A "pessoa" é um código embaralhado
-- (hash) feito a partir do endereço de internet: não dá para saber quem é, e as
-- linhas com mais de 7 dias são apagadas sozinhas a cada chamada.

create table if not exists public.assistente_uso (
  chave text not null,          -- hash da pessoa, ou 'total' para o limite geral do site
  dia date not null default (now() at time zone 'America/Fortaleza')::date,
  mensagens int not null default 0,
  primary key (chave, dia)
);

-- Ninguém de fora lê ou escreve nesta tabela: só a função do servidor (com a chave secreta).
alter table public.assistente_uso enable row level security;
revoke all on public.assistente_uso from anon, authenticated;

-- Soma 1 mensagem para a pessoa e para o total do dia, de uma vez só.
-- Devolve 'ok', 'limite_pessoa' ou 'limite_total'. Se passou do limite, não conta.
create or replace function public.assistente_contar(p_chave text, p_limite_pessoa int, p_limite_total int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  hoje date := (now() at time zone 'America/Fortaleza')::date;
  usadas_pessoa int;
  usadas_total int;
begin
  delete from assistente_uso where dia < hoje - 7;

  select mensagens into usadas_total from assistente_uso where chave = 'total' and dia = hoje for update;
  if coalesce(usadas_total, 0) >= p_limite_total then return 'limite_total'; end if;

  select mensagens into usadas_pessoa from assistente_uso where chave = p_chave and dia = hoje for update;
  if coalesce(usadas_pessoa, 0) >= p_limite_pessoa then return 'limite_pessoa'; end if;

  insert into assistente_uso (chave, dia, mensagens) values (p_chave, hoje, 1), ('total', hoje, 1)
  on conflict (chave, dia) do update set mensagens = assistente_uso.mensagens + 1;
  return 'ok';
end;
$$;

revoke all on function public.assistente_contar(text, int, int) from public, anon, authenticated;
grant execute on function public.assistente_contar(text, int, int) to service_role;
