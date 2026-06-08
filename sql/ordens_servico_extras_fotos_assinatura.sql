-- =========================================================
-- FS ORÇAMENTOS - Extras da Ordem de Serviço
-- Fotos antes do serviço e assinatura do cliente
-- Rode no SQL Editor do Supabase.
-- =========================================================

alter table public.ordens_servico
add column if not exists fotos_antes jsonb not null default '[]'::jsonb,
add column if not exists assinatura_cliente_data_url text,
add column if not exists assinatura_cliente_nome text,
add column if not exists assinatura_cliente_em timestamptz;

comment on column public.ordens_servico.fotos_antes is 'Array JSON com até 5 fotos otimizadas antes do serviço. Cada item: id, nome, dataUrl, criado_em.';
comment on column public.ordens_servico.assinatura_cliente_data_url is 'Assinatura do cliente/responsável em data URL PNG.';
comment on column public.ordens_servico.assinatura_cliente_nome is 'Nome de quem assinou a OS.';
comment on column public.ordens_servico.assinatura_cliente_em is 'Data/hora em que a assinatura foi salva.';

-- Garante que o array de fotos não passe de 5 itens quando salvo direto no banco.
alter table public.ordens_servico
drop constraint if exists ordens_servico_fotos_antes_max_5;

alter table public.ordens_servico
add constraint ordens_servico_fotos_antes_max_5
check (jsonb_typeof(fotos_antes) = 'array' and jsonb_array_length(fotos_antes) <= 5);

create index if not exists idx_ordens_servico_assinatura_cliente_em
on public.ordens_servico (user_id, assinatura_cliente_em desc);
