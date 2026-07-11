create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.fs_proteger_campos_plano_perfis()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existente public.perfis%rowtype;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select * into v_existente
    from public.perfis
    where id = new.id
    limit 1;

    if found then
      new.plano := v_existente.plano;
      new.plano_status := v_existente.plano_status;
      new.plano_expira_em := v_existente.plano_expira_em;
      new.teste_premium_usado := v_existente.teste_premium_usado;
      new.teste_premium_inicio := v_existente.teste_premium_inicio;
      new.teste_premium_fim := v_existente.teste_premium_fim;
      new.teste_premium_plano_anterior := v_existente.teste_premium_plano_anterior;
      new.teste_premium_status_anterior := v_existente.teste_premium_status_anterior;
      new.teste_premium_expira_anterior := v_existente.teste_premium_expira_anterior;
      new.plano_anterior := v_existente.plano_anterior;
    else
      new.plano := 'gratis';
      new.plano_status := 'ativo';
      new.plano_expira_em := null;
      new.teste_premium_usado := false;
      new.teste_premium_inicio := null;
      new.teste_premium_fim := null;
      new.teste_premium_plano_anterior := null;
      new.teste_premium_status_anterior := null;
      new.teste_premium_expira_anterior := null;
      new.plano_anterior := 'gratis';
    end if;

    return new;
  end if;

  if new.plano is distinct from old.plano
     or new.plano_status is distinct from old.plano_status
     or new.plano_expira_em is distinct from old.plano_expira_em
     or new.teste_premium_usado is distinct from old.teste_premium_usado
     or new.teste_premium_inicio is distinct from old.teste_premium_inicio
     or new.teste_premium_fim is distinct from old.teste_premium_fim
     or new.teste_premium_plano_anterior is distinct from old.teste_premium_plano_anterior
     or new.teste_premium_status_anterior is distinct from old.teste_premium_status_anterior
     or new.teste_premium_expira_anterior is distinct from old.teste_premium_expira_anterior
     or new.plano_anterior is distinct from old.plano_anterior then
    raise exception using
      errcode = '42501',
      message = 'Os campos de assinatura não podem ser alterados pelo cliente.';
  end if;

  return new;
end;
$$;

revoke execute on function private.fs_proteger_campos_plano_perfis() from public, anon, authenticated;

drop trigger if exists trg_fs_proteger_campos_plano_perfis on public.perfis;
create trigger trg_fs_proteger_campos_plano_perfis
before insert or update on public.perfis
for each row
execute function private.fs_proteger_campos_plano_perfis();

create table if not exists public.assinaturas (
  usuario_id uuid primary key references public.perfis(id) on delete cascade,
  plano text not null default 'gratis'
    check (plano in ('gratis', 'premium')),
  status text not null default 'ativo'
    check (status in ('ativo', 'pago', 'teste_gratis', 'pendente', 'cancelado', 'expirado')),
  expira_em timestamptz,
  limite_ia_mensal integer not null default 0
    check (limite_ia_mensal >= 0),
  consultas_ia_usadas integer not null default 0
    check (consultas_ia_usadas >= 0),
  competencia_ia date not null default (date_trunc('month', now() at time zone 'utc'))::date,
  criado_em timestamptz not null default timezone('utc', now()),
  atualizado_em timestamptz not null default timezone('utc', now())
);

alter table public.assinaturas enable row level security;
revoke all on table public.assinaturas from anon, authenticated;
grant select on table public.assinaturas to authenticated;
grant select, insert, update, delete on table public.assinaturas to service_role;

drop policy if exists "Usuarios podem ver a propria assinatura" on public.assinaturas;
create policy "Usuarios podem ver a propria assinatura"
on public.assinaturas
for select
to authenticated
using ((select auth.uid()) = usuario_id);

insert into public.assinaturas (
  usuario_id,
  plano,
  status,
  expira_em,
  limite_ia_mensal,
  atualizado_em
)
select
  p.id,
  case when lower(coalesce(p.plano, 'gratis')) in ('premium', 'basico', 'gestao') then 'premium' else 'gratis' end,
  case
    when lower(coalesce(p.plano_status, 'ativo')) in ('ativo', 'pago', 'teste_gratis', 'pendente', 'cancelado', 'expirado')
      then lower(coalesce(p.plano_status, 'ativo'))
    else 'ativo'
  end,
  p.plano_expira_em,
  case when lower(coalesce(p.plano, 'gratis')) in ('premium', 'basico', 'gestao') then 100 else 0 end,
  timezone('utc', now())
from public.perfis p
on conflict (usuario_id) do update
set plano = excluded.plano,
    status = excluded.status,
    expira_em = excluded.expira_em,
    limite_ia_mensal = excluded.limite_ia_mensal,
    atualizado_em = timezone('utc', now());

create or replace function private.fs_sincronizar_assinatura_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plano text;
  v_status text;
begin
  v_plano := case
    when lower(coalesce(new.plano, 'gratis')) in ('premium', 'basico', 'gestao') then 'premium'
    else 'gratis'
  end;

  v_status := case
    when lower(coalesce(new.plano_status, 'ativo')) in ('ativo', 'pago', 'teste_gratis', 'pendente', 'cancelado', 'expirado')
      then lower(coalesce(new.plano_status, 'ativo'))
    else 'ativo'
  end;

  insert into public.assinaturas (
    usuario_id,
    plano,
    status,
    expira_em,
    limite_ia_mensal,
    atualizado_em
  ) values (
    new.id,
    v_plano,
    v_status,
    new.plano_expira_em,
    case when v_plano = 'premium' then 100 else 0 end,
    timezone('utc', now())
  )
  on conflict (usuario_id) do update
  set plano = excluded.plano,
      status = excluded.status,
      expira_em = excluded.expira_em,
      limite_ia_mensal = excluded.limite_ia_mensal,
      atualizado_em = timezone('utc', now());

  return new;
end;
$$;

revoke execute on function private.fs_sincronizar_assinatura_perfil() from public, anon, authenticated;

drop trigger if exists trg_fs_sincronizar_assinatura_perfil on public.perfis;
create trigger trg_fs_sincronizar_assinatura_perfil
after insert or update of plano, plano_status, plano_expira_em on public.perfis
for each row
execute function private.fs_sincronizar_assinatura_perfil();

create or replace function public.fs_consumir_cota_efex(p_usuario_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assinatura public.assinaturas%rowtype;
  v_competencia date := (date_trunc('month', now() at time zone 'utc'))::date;
begin
  if p_usuario_id is null then
    return jsonb_build_object('permitido', false, 'motivo', 'usuario_invalido');
  end if;

  select * into v_assinatura
  from public.assinaturas
  where usuario_id = p_usuario_id
  for update;

  if not found then
    return jsonb_build_object('permitido', false, 'motivo', 'assinatura_nao_encontrada');
  end if;

  if v_assinatura.competencia_ia is distinct from v_competencia then
    update public.assinaturas
    set consultas_ia_usadas = 0,
        competencia_ia = v_competencia,
        atualizado_em = timezone('utc', now())
    where usuario_id = p_usuario_id
    returning * into v_assinatura;
  end if;

  if v_assinatura.plano <> 'premium'
     or v_assinatura.status not in ('ativo', 'pago', 'teste_gratis')
     or (v_assinatura.expira_em is not null and v_assinatura.expira_em < now()) then
    return jsonb_build_object(
      'permitido', false,
      'motivo', 'premium_inativo',
      'plano', v_assinatura.plano,
      'status', v_assinatura.status
    );
  end if;

  if v_assinatura.limite_ia_mensal <= 0
     or v_assinatura.consultas_ia_usadas >= v_assinatura.limite_ia_mensal then
    return jsonb_build_object(
      'permitido', false,
      'motivo', 'cota_esgotada',
      'usadas', v_assinatura.consultas_ia_usadas,
      'limite', v_assinatura.limite_ia_mensal
    );
  end if;

  update public.assinaturas
  set consultas_ia_usadas = consultas_ia_usadas + 1,
      atualizado_em = timezone('utc', now())
  where usuario_id = p_usuario_id
  returning * into v_assinatura;

  return jsonb_build_object(
    'permitido', true,
    'usadas', v_assinatura.consultas_ia_usadas,
    'restantes', greatest(v_assinatura.limite_ia_mensal - v_assinatura.consultas_ia_usadas, 0),
    'limite', v_assinatura.limite_ia_mensal
  );
end;
$$;

revoke execute on function public.fs_consumir_cota_efex(uuid) from public, anon, authenticated;
grant execute on function public.fs_consumir_cota_efex(uuid) to service_role;

alter table public.orcamentos
drop constraint if exists orcamentos_status_check;

alter table public.orcamentos
add constraint orcamentos_status_check
check (status = any (array['rascunho'::text, 'pendente'::text, 'aprovado'::text, 'recusado'::text, 'em_servico'::text, 'finalizado'::text]));

alter table public.orcamentos
add column if not exists atualizado_em timestamptz not null default timezone('utc', now());

create or replace function private.fs_atualizar_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := timezone('utc', now());
  return new;
end;
$$;

revoke execute on function private.fs_atualizar_atualizado_em() from public, anon, authenticated;

drop trigger if exists trg_fs_orcamentos_atualizado_em on public.orcamentos;
create trigger trg_fs_orcamentos_atualizado_em
before update on public.orcamentos
for each row
execute function private.fs_atualizar_atualizado_em();

drop policy if exists "Usuarios podem ver seus proprios orcamentos" on public.orcamentos;
drop policy if exists "Usuarios podem criar seus proprios orcamentos" on public.orcamentos;
drop policy if exists "Usuarios podem atualizar seus proprios orcamentos" on public.orcamentos;
drop policy if exists "Usuarios podem excluir seus proprios orcamentos" on public.orcamentos;

create policy "Usuarios podem ver seus proprios orcamentos"
on public.orcamentos
for select
to authenticated
using ((select auth.uid()) = usuario_id);

create policy "Usuarios podem criar seus proprios orcamentos"
on public.orcamentos
for insert
to authenticated
with check ((select auth.uid()) = usuario_id);

create policy "Usuarios podem atualizar seus proprios orcamentos"
on public.orcamentos
for update
to authenticated
using ((select auth.uid()) = usuario_id)
with check ((select auth.uid()) = usuario_id);

create policy "Usuarios podem excluir seus proprios orcamentos"
on public.orcamentos
for delete
to authenticated
using ((select auth.uid()) = usuario_id);

create or replace function public.ativar_teste_premium()
returns json
language sql
security invoker
set search_path = ''
as $$
  select public.ativar_teste_gratis_premium();
$$;

revoke execute on function public.ativar_teste_premium() from public, anon;
grant execute on function public.ativar_teste_premium() to authenticated, service_role;

alter function public.ativar_teste_gratis_premium() set search_path = '';
alter function public.verificar_expiracao_teste_premium() set search_path = '';
alter function public.fs_aplicar_pagamento_pix_plano() set search_path = '';
