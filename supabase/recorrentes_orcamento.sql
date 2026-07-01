-- FS Orçamentos - Recorrentes Premium
-- Execute este SQL no Supabase SQL Editor.
-- Ele cria uma tabela para salvar mão de obra e itens/produtos recorrentes por usuário.

create extension if not exists pgcrypto;

create table if not exists public.recorrentes_orcamento (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('mao_obra', 'produto')),
  descricao text not null,
  qtd numeric(12,2) not null default 1 check (qtd > 0),
  valor numeric(12,2) not null default 0 check (valor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recorrentes_orcamento_usuario_tipo_descricao_valor_key unique (usuario_id, tipo, descricao, valor)
);

create index if not exists idx_recorrentes_orcamento_usuario_tipo
  on public.recorrentes_orcamento (usuario_id, tipo, created_at desc);

create or replace function public.fs_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_recorrentes_orcamento_updated_at on public.recorrentes_orcamento;
create trigger trg_recorrentes_orcamento_updated_at
before update on public.recorrentes_orcamento
for each row execute function public.fs_set_updated_at();

alter table public.recorrentes_orcamento enable row level security;

drop policy if exists "recorrentes_select_owner" on public.recorrentes_orcamento;
drop policy if exists "recorrentes_insert_premium" on public.recorrentes_orcamento;
drop policy if exists "recorrentes_update_premium" on public.recorrentes_orcamento;
drop policy if exists "recorrentes_delete_owner" on public.recorrentes_orcamento;

create policy "recorrentes_select_owner"
on public.recorrentes_orcamento
for select
to authenticated
using (auth.uid() = usuario_id);

create policy "recorrentes_insert_premium"
on public.recorrentes_orcamento
for insert
to authenticated
with check (
  auth.uid() = usuario_id
  and exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and lower(coalesce(p.plano, 'gratis')) in ('premium', 'basico', 'gestao')
  )
);

create policy "recorrentes_update_premium"
on public.recorrentes_orcamento
for update
to authenticated
using (auth.uid() = usuario_id)
with check (
  auth.uid() = usuario_id
  and exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and lower(coalesce(p.plano, 'gratis')) in ('premium', 'basico', 'gestao')
  )
);

create policy "recorrentes_delete_owner"
on public.recorrentes_orcamento
for delete
to authenticated
using (auth.uid() = usuario_id);
