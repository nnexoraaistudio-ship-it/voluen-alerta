-- =====================================================================
-- Voluen Alerta · login com Google e Apple
-- Como usar: no Supabase, abra "SQL Editor" → "New query", cole este arquivo
-- inteiro e clique em "Run". Pode rodar de novo sem problema.
--
-- O que ele faz:
--   1. Liga cada ocorrência à conta do morador que entrou com Google/Apple,
--      para ele ver "Minhas ocorrências" em qualquer aparelho.
--   2. Usa o nome que vem do Google/Apple no perfil.
--   3. SEGURANÇA: fecha uma brecha em que uma conta SEM função (por exemplo,
--      um morador que entrou com Google) conseguiria mudar a situação de uma
--      ocorrência. Agora só quem tem função na equipe consegue.
-- (Estas mesmas mudanças já estão no schema.sql, para instalações novas.)
-- =====================================================================

-- Conta do morador que registrou (quando ele entrou com Google/Apple). Fica vazio para quem registra sem conta.
alter table public.ocorrencias add column if not exists cidadao_id uuid references auth.users (id) on delete set null;
create index if not exists ocorrencias_cidadao_idx on public.ocorrencias (cidadao_id) where cidadao_id is not null;

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

-- Apagar contato a pedido do morador: administradores e moderadores.
create or replace function public.apagar_contato(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.meu_papel(), '') not in ('admin', 'moderador') then raise exception 'Sem permissão.'; end if;
  update public.ocorrencias set contato_nome = null, contato_telefone = null, contato_email = null where id = p_id;
end $$;

revoke all on function public.minhas_ocorrencias() from public, anon;
grant execute on function public.minhas_ocorrencias() to authenticated;
