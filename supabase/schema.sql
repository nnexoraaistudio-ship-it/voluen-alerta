-- =====================================================================
-- Voluen Alerta · estrutura do banco de dados (Supabase / PostgreSQL)
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro
-- e clique em "Run". Pode rodar de novo sem problema.
-- =====================================================================

-- ---------- Tabelas ----------

create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  email text,
  papel text check (papel in ('moderador', 'prefeitura', 'admin')),
  created_at timestamptz not null default now()
);

create sequence if not exists public.protocolo_seq start 1;

create table if not exists public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  protocolo text unique not null,
  categoria text not null check (categoria in ('alagamento', 'bueiro', 'canal', 'lixo', 'escoamento', 'outro')),
  bairro text not null check (char_length(bairro) between 2 and 80),
  rua text not null check (char_length(rua) between 2 and 120),
  referencia text check (char_length(referencia) <= 160),
  lat double precision not null check (lat between -5.75 and -5.30),
  lng double precision not null check (lng between -47.70 and -47.25),
  descricao text not null check (char_length(descricao) between 5 and 1000),
  foto_path text,
  contato_nome text check (char_length(contato_nome) <= 100),
  contato_telefone text check (char_length(contato_telefone) <= 30),
  contato_email text check (char_length(contato_email) <= 120),
  status text not null default 'moderacao'
    check (status in ('moderacao', 'recebida', 'em_analise', 'encaminhada', 'resolvida', 'recusada')),
  motivo_recusa text,
  consentimento_em timestamptz not null,
  created_at timestamptz not null default now(),
  resolvida_em timestamptz
);

create index if not exists ocorrencias_status_idx on public.ocorrencias (status);
create index if not exists ocorrencias_created_idx on public.ocorrencias (created_at desc);

create table if not exists public.historico (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null references public.ocorrencias (id) on delete cascade,
  status text not null,
  mensagem text check (char_length(mensagem) <= 1000),
  autor uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists historico_ocorrencia_idx on public.historico (ocorrencia_id);

-- ---------- Funções de apoio ----------

create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.perfis where id = auth.uid()
$$;

-- Cria o perfil automaticamente quando alguém da equipe é cadastrado.
-- O papel começa vazio: um administrador precisa definir depois.
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nome', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------- Segurança (quem vê e quem muda o quê) ----------

alter table public.perfis enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.historico enable row level security;

-- Visitantes NÃO acessam as tabelas diretamente. Eles usam só:
--   * a view ocorrencias_publicas (sem dados de contato, só aprovadas)
--   * a função registrar_ocorrencia
--   * a função consultar_protocolo

drop policy if exists "equipe vê ocorrências" on public.ocorrencias;
create policy "equipe vê ocorrências" on public.ocorrencias
  for select to authenticated using (public.meu_papel() is not null);

drop policy if exists "equipe edita ocorrências" on public.ocorrencias;
create policy "equipe edita ocorrências" on public.ocorrencias
  for update to authenticated using (public.meu_papel() in ('moderador', 'admin', 'prefeitura'));

drop policy if exists "admin apaga ocorrências" on public.ocorrencias;
create policy "admin apaga ocorrências" on public.ocorrencias
  for delete to authenticated using (public.meu_papel() = 'admin');

drop policy if exists "equipe vê histórico" on public.historico;
create policy "equipe vê histórico" on public.historico
  for select to authenticated using (public.meu_papel() is not null);

drop policy if exists "cada um vê o próprio perfil" on public.perfis;
create policy "cada um vê o próprio perfil" on public.perfis
  for select to authenticated using (id = auth.uid() or public.meu_papel() = 'admin');

drop policy if exists "admin muda papéis" on public.perfis;
create policy "admin muda papéis" on public.perfis
  for update to authenticated using (public.meu_papel() = 'admin');

-- Impede que a equipe mude colunas sensíveis por fora das funções.
revoke update on public.ocorrencias from authenticated;
grant update (foto_path, contato_nome, contato_telefone, contato_email) on public.ocorrencias to authenticated;
revoke all on public.ocorrencias, public.historico, public.perfis from anon;

-- ---------- O que o público pode ver ----------

create or replace view public.ocorrencias_publicas as
  select id, protocolo, categoria, bairro, rua, referencia, lat, lng, descricao, foto_path, status, created_at, resolvida_em
  from public.ocorrencias
  where status in ('recebida', 'em_analise', 'encaminhada', 'resolvida');

grant select on public.ocorrencias_publicas to anon, authenticated;

-- ---------- Funções usadas pelo site ----------

create or replace function public.registrar_ocorrencia(
  p_categoria text, p_bairro text, p_rua text, p_referencia text,
  p_lat double precision, p_lng double precision, p_descricao text, p_foto_path text,
  p_contato_nome text, p_contato_telefone text, p_contato_email text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_protocolo text;
  v_id uuid;
begin
  v_protocolo := 'VA-' || to_char(now() at time zone 'America/Araguaina', 'YYYY') || '-'
                 || lpad(nextval('public.protocolo_seq')::text, 5, '0');
  insert into public.ocorrencias (protocolo, categoria, bairro, rua, referencia, lat, lng, descricao,
    foto_path, contato_nome, contato_telefone, contato_email, consentimento_em)
  values (v_protocolo, p_categoria, trim(p_bairro), trim(p_rua), nullif(trim(p_referencia), ''), p_lat, p_lng,
    trim(p_descricao), p_foto_path, nullif(trim(p_contato_nome), ''), nullif(trim(p_contato_telefone), ''),
    nullif(trim(p_contato_email), ''), now())
  returning id into v_id;
  insert into public.historico (ocorrencia_id, status) values (v_id, 'moderacao');
  return v_protocolo;
end $$;

create or replace function public.consultar_protocolo(p_protocolo text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', o.id, 'protocolo', o.protocolo, 'categoria', o.categoria, 'bairro', o.bairro, 'rua', o.rua,
    'referencia', o.referencia, 'lat', o.lat, 'lng', o.lng, 'descricao', o.descricao,
    'foto_path', case when o.status = 'recusada' then null else o.foto_path end,
    'status', o.status, 'motivo_recusa', o.motivo_recusa, 'created_at', o.created_at,
    'historico', coalesce((
      select json_agg(json_build_object('status', h.status, 'mensagem', h.mensagem, 'created_at', h.created_at) order by h.created_at)
      from public.historico h where h.ocorrencia_id = o.id), '[]'::json))
  from public.ocorrencias o
  where o.protocolo = upper(trim(p_protocolo))
$$;

create or replace function public.mudar_status(p_id uuid, p_status text, p_mensagem text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_papel text := public.meu_papel();
  v_atual text;
begin
  select status into v_atual from public.ocorrencias where id = p_id;
  if v_atual is null then raise exception 'Ocorrência não encontrada.'; end if;

  if v_atual = 'moderacao' then
    if v_papel not in ('moderador', 'admin') then raise exception 'Sem permissão para moderar.'; end if;
    if p_status not in ('recebida', 'recusada') then raise exception 'Na moderação só é possível aprovar ou recusar.'; end if;
  else
    if v_papel not in ('prefeitura', 'admin') then raise exception 'Sem permissão para mudar a situação.'; end if;
    if p_status not in ('recebida', 'em_analise', 'encaminhada', 'resolvida') then raise exception 'Situação inválida.'; end if;
  end if;

  update public.ocorrencias set
    status = p_status,
    motivo_recusa = case when p_status = 'recusada' then p_motivo else motivo_recusa end,
    resolvida_em = case when p_status = 'resolvida' then now() else resolvida_em end
  where id = p_id;

  insert into public.historico (ocorrencia_id, status, mensagem, autor)
  values (p_id, p_status, coalesce(nullif(trim(p_mensagem), ''), case when p_status = 'recusada' then p_motivo end), auth.uid());
end $$;

revoke all on function public.mudar_status(uuid, text, text, text) from anon;
grant execute on function public.registrar_ocorrencia(text, text, text, text, double precision, double precision, text, text, text, text, text) to anon, authenticated;
grant execute on function public.consultar_protocolo(text) to anon, authenticated;
grant execute on function public.mudar_status(uuid, text, text, text) to authenticated;

-- ---------- Fotos ----------
-- Pasta pública "fotos": qualquer pessoa pode ENVIAR uma foto nova (até 5 MB, só imagem),
-- mas não pode listar, trocar nem apagar fotos. Os nomes dos arquivos são aleatórios.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "qualquer um envia foto" on storage.objects;
create policy "qualquer um envia foto" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'fotos');

drop policy if exists "equipe apaga foto" on storage.objects;
create policy "equipe apaga foto" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.meu_papel() in ('moderador', 'admin'));

-- =====================================================================
-- DEPOIS DE RODAR: para tornar você administrador, cadastre seu usuário em
-- Authentication > Users > Add user, e rode (trocando o e-mail):
--   update public.perfis set papel = 'admin' where email = 'seu-email@exemplo.com';
-- =====================================================================
