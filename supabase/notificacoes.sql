-- =====================================================================
-- Voluen Alerta · avisos por e-mail para o morador
-- O morador que informar um e-mail recebe:
--   * a confirmação do registro, com o número de protocolo;
--   * um aviso a cada mudança de situação (aprovada, em análise, encaminhada, resolvida ou recusada).
-- Os e-mails saem pela Brevo (plano gratuito: 300 e-mails por dia).
--
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e clique em "Run".
-- A chave da Brevo NÃO fica neste arquivo: ela é guardada à parte, no cofre do Supabase (Vault).
-- Enquanto a chave não estiver no cofre, nada é enviado e o site funciona normalmente.
-- =====================================================================

create extension if not exists pg_net;

-- Evita que textos digitados virem código dentro do e-mail.
create or replace function public.html_seguro(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

create or replace function public.avisar_morador(p_id uuid, p_status text, p_mensagem text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.ocorrencias%rowtype;
  v_chave text;
  v_remetente text;
  v_link text;
  v_titulo text;
  v_texto text;
  v_html text;
begin
  select * into o from public.ocorrencias where id = p_id;
  if o.id is null or o.contato_email is null or o.contato_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;

  select decrypted_secret into v_chave from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  select decrypted_secret into v_remetente from vault.decrypted_secrets where name = 'email_remetente' limit 1;
  if v_chave is null or v_remetente is null then return; end if;

  v_link := 'https://nnexoraaistudio-ship-it.github.io/voluen-alerta/#/acompanhar/' || o.protocolo;

  v_titulo := case p_status
    when 'moderacao'   then 'Recebemos seu aviso'
    when 'recebida'    then 'Seu aviso foi aprovado'
    when 'em_analise'  then 'Seu aviso está em análise'
    when 'encaminhada' then 'Seu aviso foi encaminhado'
    when 'resolvida'   then 'Problema resolvido'
    when 'recusada'    then 'Seu aviso não foi publicado'
    else 'Atualização do seu aviso' end;

  v_texto := case p_status
    when 'moderacao'   then 'Recebemos o seu aviso. A equipe vai conferir as informações antes de publicar no mapa. Guarde o número de protocolo para acompanhar.'
    when 'recebida'    then 'O seu aviso foi conferido e já aparece no mapa público.'
    when 'em_analise'  then 'A equipe da Prefeitura está analisando o seu aviso.'
    when 'encaminhada' then 'O seu aviso foi encaminhado para o setor responsável.'
    when 'resolvida'   then 'O problema que você informou foi marcado como resolvido. Obrigado por ajudar a cidade!'
    when 'recusada'    then 'O seu aviso não pôde ser publicado.'
    else 'A situação do seu aviso mudou.' end;

  v_html :=
    '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0B2E3A">'
    || '<div style="background:#0F5E6B;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;font-weight:bold">Voluen Alerta · Imperatriz-MA</div>'
    || '<div style="border:1px solid #dfe6e8;border-top:0;padding:20px;border-radius:0 0 12px 12px">'
    || '<h2 style="margin:0 0 12px">' || html_seguro(v_titulo) || '</h2>'
    || '<p>' || html_seguro(v_texto) || '</p>'
    || case when nullif(trim(p_mensagem), '') is not null
         then '<p style="background:#F2F5F6;padding:12px;border-radius:8px"><b>Mensagem da equipe:</b><br>' || html_seguro(p_mensagem) || '</p>' else '' end
    || '<p><b>Protocolo:</b> ' || html_seguro(o.protocolo) || '<br><b>Local:</b> ' || html_seguro(o.rua) || ', ' || html_seguro(o.bairro) || '</p>'
    || '<p><a href="' || v_link || '" style="display:inline-block;background:#3CC6B0;color:#0B2E3A;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:bold">Acompanhar meu aviso</a></p>'
    || '<p style="font-size:12px;color:#5b6b72">Você recebe este e-mail porque informou este endereço ao registrar o aviso. '
    || 'Para não receber mais avisos ou pedir a exclusão dos seus dados, responda a este e-mail.</p>'
    || '</div></div>';

  perform net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', v_chave, 'content-type', 'application/json', 'accept', 'application/json'),
    body := jsonb_build_object(
      'sender', jsonb_build_object('name', 'Voluen Alerta', 'email', v_remetente),
      'replyTo', jsonb_build_object('email', v_remetente),
      'to', jsonb_build_array(jsonb_build_object('email', o.contato_email)),
      'subject', v_titulo || ' · protocolo ' || o.protocolo,
      'htmlContent', v_html)
  );
exception when others then
  -- Se o e-mail falhar, o registro e a mudança de situação continuam valendo.
  raise warning 'Aviso por e-mail não enviado: %', sqlerrm;
end $$;

-- Só o próprio banco chama esta função (nem visitantes nem a equipe podem usá-la direto).
revoke all on function public.avisar_morador(uuid, text, text) from public, anon, authenticated;
revoke all on function public.html_seguro(text) from public, anon, authenticated;

-- Dispara o aviso sempre que entra uma linha nova no histórico (registro ou mudança de situação).
create or replace function public.ao_mudar_historico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.avisar_morador(new.ocorrencia_id, new.status, new.mensagem);
  return new;
end $$;

drop trigger if exists avisar_morador on public.historico;
create trigger avisar_morador after insert on public.historico
  for each row execute function public.ao_mudar_historico();

-- =====================================================================
-- DEPOIS DE RODAR: guarde a chave da Brevo e o e-mail remetente no cofre.
-- Rode isto numa consulta nova (troque os dois textos entre aspas):
--   select vault.create_secret('COLE-AQUI-A-CHAVE-DA-BREVO', 'brevo_api_key');
--   select vault.create_secret('seu-email-verificado-na-brevo@exemplo.com', 'email_remetente');
-- Para trocar a chave depois:
--   select vault.update_secret((select id from vault.secrets where name = 'brevo_api_key'), 'NOVA-CHAVE');
-- Para ver se os envios deram certo (últimos 10):
--   select status_code, content from net._http_response order by created desc limit 10;
-- =====================================================================
