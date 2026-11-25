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

-- Diz se a pessoa deixou contato, sem revelar qual (a equipe vê isso; o contato em si, só o admin).
alter table public.ocorrencias add column if not exists tem_contato boolean
  generated always as (coalesce(contato_nome, contato_telefone, contato_email) is not null) stored;

-- Conta do morador que registrou (quando ele entrou com Google/Apple). Fica vazio para quem registra sem conta.
alter table public.ocorrencias add column if not exists cidadao_id uuid references auth.users (id) on delete set null;
create index if not exists ocorrencias_cidadao_idx on public.ocorrencias (cidadao_id) where cidadao_id is not null;

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

-- Controle anti-abuso: guarda por 1 dia um código embaralhado da conexão (não o endereço IP em si).
create table if not exists public.limites (
  chave text not null,
  criado timestamptz not null default now()
);
create index if not exists limites_idx on public.limites (chave, criado);
alter table public.limites enable row level security;

-- ---------- Funções de apoio ----------

create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.perfis where id = auth.uid()
$$;

-- Cria o perfil automaticamente quando alguém entra pela primeira vez (equipe ou morador).
-- O papel começa vazio = sem acesso ao painel. Só um administrador libera, na tela Equipe.
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name', new.email))
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

-- Permissões explícitas (funcionam mesmo com "Grant API access automatically" desligado).
grant usage on schema public to anon, authenticated;
grant delete on public.ocorrencias to authenticated;
-- A equipe lê tudo MENOS nome, telefone e e-mail do morador (esses só pela função ver_contato, para admin).
revoke select on public.ocorrencias from authenticated;
grant select (id, protocolo, categoria, bairro, rua, referencia, lat, lng, descricao, foto_path, status,
  motivo_recusa, consentimento_em, created_at, resolvida_em, tem_contato) on public.ocorrencias to authenticated;
grant select on public.historico to authenticated;
grant select, update (papel) on public.perfis to authenticated;

-- Impede que a equipe mude colunas sensíveis por fora das funções.
revoke update on public.ocorrencias from authenticated;
revoke all on public.ocorrencias, public.historico, public.perfis, public.limites from anon;
revoke all on public.limites from authenticated;
revoke all on sequence public.protocolo_seq from anon, authenticated;

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
  v_ip text;
  v_chave text;
  v_email text := nullif(lower(trim(p_contato_email)), '');
begin
  -- Anti-abuso: no máximo 5 registros a cada 10 minutos por conexão e 120 por hora no total.
  v_ip := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  v_chave := case when trim(v_ip) <> '' then md5('voluen-alerta:' || trim(v_ip)) end;
  delete from public.limites where criado < now() - interval '1 day';
  if v_chave is not null and (select count(*) from public.limites where chave = v_chave and criado > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos registros seguidos. Aguarde alguns minutos e tente de novo.';
  end if;
  if (select count(*) from public.ocorrencias where created_at > now() - interval '1 hour') >= 120 then
    raise exception 'O sistema recebeu muitos registros agora. Tente de novo em alguns minutos.';
  end if;
  if v_chave is not null then insert into public.limites (chave) values (v_chave); end if;

  -- A foto precisa ser uma que acabou de ser enviada para a pasta de fotos.
  if p_foto_path is not null and (p_foto_path !~ '^[0-9a-f-]{36}\.jpg$'
     or not exists (select 1 from storage.objects where bucket_id = 'fotos' and name = p_foto_path)
     or exists (select 1 from public.ocorrencias where foto_path = p_foto_path)) then
    raise exception 'Foto inválida. Envie a foto de novo.';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.';
  end if;

  -- Protocolo com final aleatório, para ninguém conseguir adivinhar o protocolo de outra pessoa.
  v_protocolo := 'VA-' || to_char(now() at time zone 'America/Araguaina', 'YYYY') || '-'
                 || lpad(nextval('public.protocolo_seq')::text, 5, '0') || '-'
                 || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  insert into public.ocorrencias (protocolo, categoria, bairro, rua, referencia, lat, lng, descricao,
    foto_path, contato_nome, contato_telefone, contato_email, consentimento_em, cidadao_id)
  values (v_protocolo, p_categoria, trim(p_bairro), trim(p_rua), nullif(trim(p_referencia), ''), p_lat, p_lng,
    trim(p_descricao), p_foto_path, nullif(trim(p_contato_nome), ''), nullif(trim(p_contato_telefone), ''),
    v_email, now(), case when public.meu_papel() is null then auth.uid() end)
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

-- Ocorrências do morador que entrou com Google/Apple (só as dele).
create or replace function public.minhas_ocorrencias() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('protocolo', protocolo, 'categoria', categoria, 'bairro', bairro,
    'rua', rua, 'status', status, 'created_at', created_at) order by created_at desc), '[]'::json)
  from public.ocorrencias
  where auth.uid() is not null and cidadao_id = auth.uid()
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
    if coalesce(v_papel, '') not in ('moderador', 'admin') then raise exception 'Sem permissão para moderar.'; end if;
    if p_status not in ('recebida', 'recusada') then raise exception 'Na moderação só é possível aprovar ou recusar.'; end if;
  else
    if coalesce(v_papel, '') not in ('prefeitura', 'admin') then raise exception 'Sem permissão para mudar a situação.'; end if;
    if p_status not in ('recebida', 'em_analise', 'encaminhada', 'resolvida') then raise exception 'Situação inválida.'; end if;
  end if;

  update public.ocorrencias set
    status = p_status,
    motivo_recusa = case when p_status = 'recusada' then p_motivo else motivo_recusa end,
    resolvida_em = case when p_status = 'resolvida' then now() else resolvida_em end
  where id = p_id;

  insert into public.historico (ocorrencia_id, status, mensagem, autor)
  values (p_id, p_status, coalesce(nullif(trim(p_mensagem), ''), case when p_status = 'recusada' then p_motivo end), auth.uid());

  -- Política de privacidade: contato é apagado quando a ocorrência é encerrada.
  if p_status in ('resolvida', 'recusada') then
    update public.ocorrencias set contato_nome = null, contato_telefone = null, contato_email = null where id = p_id;
  end if;
end $$;

-- Tirar a foto de uma ocorrência (moderadores e administradores). O arquivo é apagado pelo site.
create or replace function public.remover_foto(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.meu_papel(), '') not in ('admin', 'moderador') then raise exception 'Sem permissão.'; end if;
  update public.ocorrencias set foto_path = null where id = p_id;
end $$;

-- Só administradores veem nome, telefone e e-mail do morador.
create or replace function public.ver_contato(p_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if public.meu_papel() is distinct from 'admin' then raise exception 'Somente administradores veem os dados de contato.'; end if;
  return (select json_build_object('nome', contato_nome, 'telefone', contato_telefone, 'email', contato_email)
          from public.ocorrencias where id = p_id);
end $$;

-- Apagar contato a pedido do morador: administradores e moderadores.
create or replace function public.apagar_contato(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.meu_papel(), '') not in ('admin', 'moderador') then raise exception 'Sem permissão.'; end if;
  update public.ocorrencias set contato_nome = null, contato_telefone = null, contato_email = null where id = p_id;
end $$;

revoke all on function public.mudar_status(uuid, text, text, text) from public, anon;
revoke all on function public.ver_contato(uuid) from public, anon;
revoke all on function public.apagar_contato(uuid) from public, anon;
grant execute on function public.ver_contato(uuid) to authenticated;
grant execute on function public.apagar_contato(uuid) to authenticated;
revoke all on function public.remover_foto(uuid) from public, anon;
grant execute on function public.remover_foto(uuid) to authenticated;
grant execute on function public.registrar_ocorrencia(text, text, text, text, double precision, double precision, text, text, text, text, text) to anon, authenticated;
grant execute on function public.consultar_protocolo(text) to anon, authenticated;
revoke all on function public.minhas_ocorrencias() from public, anon;
grant execute on function public.minhas_ocorrencias() to authenticated;
grant execute on function public.mudar_status(uuid, text, text, text) to authenticated;

-- ---------- Login da equipe da prefeitura com CPF e senha ----------
-- Cada pessoa da prefeitura tem uma conta interna <CPF>@cpf.voluen.com.br (esse e-mail não existe
-- e nunca recebe mensagens). Só administradores cadastram pessoas, pela tela Equipe do painel.

alter table public.perfis add column if not exists cpf text;
alter table public.perfis add column if not exists trocar_senha boolean not null default false;
create unique index if not exists perfis_cpf_idx on public.perfis (cpf) where cpf is not null;

create or replace function public.cpf_valido(p text) returns boolean
language plpgsql immutable set search_path = public as $$
declare
  c text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
  s int; d1 int; d2 int; i int;
begin
  if length(c) <> 11 or c ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(c, i, 1)::int * (11 - i); end loop;
  d1 := (s * 10) % 11; if d1 = 10 then d1 := 0; end if;
  s := 0; for i in 1..10 loop s := s + substr(c, i, 1)::int * (12 - i); end loop;
  d2 := (s * 10) % 11; if d2 = 10 then d2 := 0; end if;
  return d1 = substr(c, 10, 1)::int and d2 = substr(c, 11, 1)::int;
end $$;

-- Administrador cadastra uma pessoa: nome, CPF, função e senha provisória.
create or replace function public.criar_membro(p_nome text, p_cpf text, p_papel text, p_senha text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_email text;
  v_id uuid := gen_random_uuid();
begin
  if public.meu_papel() is distinct from 'admin' then raise exception 'Somente administradores cadastram pessoas.'; end if;
  if not public.cpf_valido(v_cpf) then raise exception 'CPF inválido.'; end if;
  if coalesce(p_papel, '') not in ('moderador', 'prefeitura', 'admin') then raise exception 'Função inválida.'; end if;
  if length(coalesce(p_senha, '')) < 8 then raise exception 'A senha precisa ter pelo menos 8 caracteres.'; end if;
  if length(trim(coalesce(p_nome, ''))) < 2 then raise exception 'Informe o nome.'; end if;
  v_email := v_cpf || '@cpf.voluen.com.br';
  if exists (select 1 from auth.users where email = v_email) or exists (select 1 from public.perfis where cpf = v_cpf) then
    raise exception 'Esse CPF já está cadastrado.';
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nome', trim(p_nome)), now(), now(),
    '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());

  -- O perfil é criado pelo gatilho ao_criar_usuario; aqui completamos CPF, função e a troca de senha.
  insert into public.perfis (id, email, nome) values (v_id, v_email, trim(p_nome)) on conflict (id) do nothing;
  update public.perfis set nome = trim(p_nome), cpf = v_cpf, papel = p_papel, trocar_senha = true where id = v_id;
  return v_id;
end $$;

-- Administrador cria uma senha provisória nova para quem esqueceu.
create or replace function public.redefinir_senha(p_uid uuid, p_senha text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.meu_papel() is distinct from 'admin' then raise exception 'Somente administradores trocam senhas.'; end if;
  if length(coalesce(p_senha, '')) < 8 then raise exception 'A senha precisa ter pelo menos 8 caracteres.'; end if;
  if not exists (select 1 from public.perfis where id = p_uid and cpf is not null) then
    raise exception 'Só dá para trocar a senha de quem entra com CPF.';
  end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now() where id = p_uid;
  update public.perfis set trocar_senha = true where id = p_uid;
end $$;

-- A própria pessoa avisa que já trocou a senha provisória.
create or replace function public.senha_trocada() returns void
language sql security definer set search_path = public as $$
  update public.perfis set trocar_senha = false where id = auth.uid()
$$;

revoke all on function public.criar_membro(text, text, text, text) from public, anon;
revoke all on function public.redefinir_senha(uuid, text) from public, anon;
revoke all on function public.senha_trocada() from public, anon;
grant execute on function public.criar_membro(text, text, text, text) to authenticated;
grant execute on function public.redefinir_senha(uuid, text) to authenticated;
grant execute on function public.senha_trocada() to authenticated;

-- ---------- Fotos ----------
-- Pasta pública "fotos": qualquer pessoa pode ENVIAR uma foto nova (até 3 MB, só JPEG, nome aleatório),
-- mas não pode listar, trocar nem apagar fotos. Os nomes dos arquivos são aleatórios.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 3145728, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg'];

drop policy if exists "qualquer um envia foto" on storage.objects;
create policy "qualquer um envia foto" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'fotos' and name ~ '^[0-9a-f-]{36}\.jpg$');

drop policy if exists "equipe apaga foto" on storage.objects;
create policy "equipe apaga foto" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.meu_papel() in ('moderador', 'admin'));

-- =====================================================================
-- DEPOIS DE RODAR: para tornar você administrador, cadastre seu usuário em
-- Authentication > Users > Add user, e rode (trocando o e-mail):
--   update public.perfis set papel = 'admin' where email = 'seu-email@exemplo.com';
-- =====================================================================
