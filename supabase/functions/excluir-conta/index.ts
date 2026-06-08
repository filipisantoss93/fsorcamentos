import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Método não permitido.'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Variáveis SUPABASE_URL, SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
    }

    const authHeader = req.headers.get('Authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Usuário não autenticado.'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);

    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({
        error: 'Sessão inválida ou expirada.'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.confirmar !== 'EXCLUIR') {
      return new Response(JSON.stringify({
        error: 'Confirmação inválida.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const userId = userData.user.id;

    // Remove logos do Storage. Se o bucket não existir, a exclusão dos dados continua.
    try {
      const { data: arquivosLogo } = await supabaseAdmin
        .storage
        .from('logos')
        .list(userId);

      if (arquivosLogo?.length) {
        const caminhos = arquivosLogo.map((arquivo) => `${userId}/${arquivo.name}`);

        await supabaseAdmin
          .storage
          .from('logos')
          .remove(caminhos);
      }
    } catch (storageError) {
      console.warn('Não foi possível remover logos:', storageError);
    }

    // Remove dados do aplicativo vinculados ao usuário.
    // Se alguma tabela ainda não existir, o erro é ignorado para não travar a exclusão da conta.
const tabelas = [
  ['notificacoes', 'usuario_id'],
  ['responsaveis_orcamento', 'usuario_id'],
  ['pagamentos_pix', 'usuario_id'],
  ['orcamentos', 'usuario_id'],
  ['perfis', 'id']
];

    for (const [tabela, coluna] of tabelas) {
      const { error } = await supabaseAdmin
        .from(tabela)
        .delete()
        .eq(coluna, userId);

      if (error) {
        console.warn(`Não foi possível limpar ${tabela}:`, error.message);
      }
    }

    // Remove o usuário do Supabase Auth.
    // Esta chamada exige service_role/secret key e nunca deve rodar no navegador.
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return new Response(JSON.stringify({
      ok: true,
      message: 'Conta excluída com sucesso.'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro ao excluir conta:', error);

    return new Response(JSON.stringify({
      error: error?.message || 'Erro ao excluir conta.'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
