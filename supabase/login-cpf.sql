-- =====================================================================
-- Voluen Alerta · login da equipe da prefeitura com CPF e senha
-- Como usar: no Supabase, abra "SQL Editor" → "New query", cole este arquivo
-- inteiro e clique em "Run". Pode rodar de novo sem problema.
-- (Estas mesmas mudanças já estão no schema.sql, para instalações novas.)
-- =====================================================================

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
