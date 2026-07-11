revoke execute on function public.fs_aplicar_pagamento_pix_plano() from public, anon, authenticated;
grant execute on function public.fs_aplicar_pagamento_pix_plano() to postgres, service_role;
