create or replace function public.fs_estornar_cota_efex(p_usuario_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usadas integer;
  v_limite integer;
begin
  update public.assinaturas
     set consultas_ia_usadas = greatest(consultas_ia_usadas - 1, 0),
         atualizado_em = timezone('utc', now())
   where usuario_id = p_usuario_id
   returning consultas_ia_usadas, limite_ia_mensal
        into v_usadas, v_limite;

  if not found then
    return jsonb_build_object('estornado', false, 'motivo', 'assinatura_nao_encontrada');
  end if;

  return jsonb_build_object(
    'estornado', true,
    'usadas', v_usadas,
    'restantes', greatest(v_limite - v_usadas, 0),
    'limite', v_limite
  );
end;
$$;

revoke execute on function public.fs_estornar_cota_efex(uuid) from public, anon, authenticated;
grant execute on function public.fs_estornar_cota_efex(uuid) to service_role;
