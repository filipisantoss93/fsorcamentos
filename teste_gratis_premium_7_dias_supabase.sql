-- =========================================================
-- FS ORÇAMENTOS - Teste grátis Premium por 7 dias
-- Regra:
-- 1) Apenas usuário autenticado com Plano Básico ativo pode ativar.
-- 2) Cada conta pode usar o teste Premium uma única vez.
-- 3) Durante o teste: plano = premium, plano_status = teste_gratis.
-- 4) Ao vencer: volta automaticamente para o plano anterior, normalmente basico.
-- =========================================================

alter table public.perfis
add column if not exists teste_premium_usado boolean not null default false,
add column if not exists teste_premium_inicio timestamptz,
add column if not exists teste_premium_fim timestamptz,
add column if not exists teste_premium_plano_anterior text,
add column if not exists teste_premium_status_anterior text,
add column if not exists teste_premium_expira_anterior timestamptz;

create or replace function public.ativar_teste_gratis_premium()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario uuid;
  perfil public.perfis%rowtype;
  fim_teste timestamptz;
begin
  usuario := auth.uid();

  if usuario is null then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Usuário não autenticado.'
    );
  end if;

  select *
  into perfil
  from public.perfis
  where id = usuario
  limit 1;

  if not found then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Perfil não encontrado.'
    );
  end if;

  if coalesce(perfil.teste_premium_usado, false) = true then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Você já utilizou o teste grátis do Premium nesta conta.'
    );
  end if;

  if lower(coalesce(perfil.plano, 'gratis')) = 'premium'
     and lower(coalesce(perfil.plano_status, 'ativo')) <> 'teste_gratis' then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Sua conta já está no Plano Premium.'
    );
  end if;

  if lower(coalesce(perfil.plano, 'gratis')) <> 'basico' then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'O teste grátis do Premium está disponível para usuários com Plano Básico ativo.'
    );
  end if;

  if lower(coalesce(perfil.plano_status, 'ativo')) in ('cancelado', 'expirado') then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Seu Plano Básico não está ativo. Renove o Básico antes de testar o Premium.'
    );
  end if;

  if perfil.plano_expira_em is not null and perfil.plano_expira_em < now() then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Seu Plano Básico está expirado. Renove o Básico antes de testar o Premium.'
    );
  end if;

  fim_teste := now() + interval '7 days';

  update public.perfis
  set
    teste_premium_usado = true,
    teste_premium_inicio = now(),
    teste_premium_fim = fim_teste,
    teste_premium_plano_anterior = coalesce(perfil.plano, 'basico'),
    teste_premium_status_anterior = coalesce(perfil.plano_status, 'ativo'),
    teste_premium_expira_anterior = perfil.plano_expira_em,
    plano = 'premium',
    plano_status = 'teste_gratis',
    plano_expira_em = fim_teste
  where id = usuario;

  return json_build_object(
    'sucesso', true,
    'mensagem', 'Teste grátis do Premium ativado por 7 dias.',
    'plano', 'premium',
    'plano_status', 'teste_gratis',
    'teste_premium_fim', fim_teste,
    'plano_expira_em', fim_teste
  );
end;
$$;

create or replace function public.verificar_expiracao_teste_premium()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario uuid;
  perfil public.perfis%rowtype;
  plano_restaurado text;
  status_restaurado text;
  expira_restaurado timestamptz;
begin
  usuario := auth.uid();

  if usuario is null then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Usuário não autenticado.'
    );
  end if;

  select *
  into perfil
  from public.perfis
  where id = usuario
  limit 1;

  if not found then
    return json_build_object(
      'sucesso', false,
      'mensagem', 'Perfil não encontrado.'
    );
  end if;

  if lower(coalesce(perfil.plano, 'gratis')) = 'premium'
     and lower(coalesce(perfil.plano_status, 'ativo')) = 'teste_gratis'
     and perfil.teste_premium_fim is not null
     and perfil.teste_premium_fim < now() then

    plano_restaurado := coalesce(nullif(perfil.teste_premium_plano_anterior, ''), 'basico');
    status_restaurado := coalesce(nullif(perfil.teste_premium_status_anterior, ''), 'ativo');
    expira_restaurado := perfil.teste_premium_expira_anterior;

    update public.perfis
    set
      plano = plano_restaurado,
      plano_status = status_restaurado,
      plano_expira_em = expira_restaurado,
      teste_premium_inicio = null,
      teste_premium_fim = null
    where id = usuario;

    return json_build_object(
      'sucesso', true,
      'expirado', true,
      'mensagem', 'Seu teste grátis do Premium expirou. Sua conta voltou para o Plano Básico.',
      'plano', plano_restaurado,
      'plano_status', status_restaurado,
      'plano_expira_em', expira_restaurado
    );
  end if;

  return json_build_object(
    'sucesso', true,
    'expirado', false,
    'plano', perfil.plano,
    'plano_status', perfil.plano_status,
    'plano_expira_em', perfil.plano_expira_em,
    'teste_premium_usado', perfil.teste_premium_usado,
    'teste_premium_inicio', perfil.teste_premium_inicio,
    'teste_premium_fim', perfil.teste_premium_fim
  );
end;
$$;

grant execute on function public.ativar_teste_gratis_premium() to authenticated;
grant execute on function public.verificar_expiracao_teste_premium() to authenticated;
