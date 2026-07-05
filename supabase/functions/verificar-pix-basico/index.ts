import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respostaJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnvObrigatorio(nome: string) {
  const valor = Deno.env.get(nome);
  if (!valor) throw new Error(`Secret ausente: ${nome}`);
  return valor;
}

function base64ToText(base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function extrairCertificadoEChave(pemCompleto: string) {
  const certMatch = pemCompleto.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
  const keyMatch = pemCompleto.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/);
  if (!certMatch || !keyMatch) throw new Error("Certificado ou chave privada ausente no PEM.");
  return { cert: certMatch[0], key: keyMatch[0] };
}

function montarHttpClientEfi() {
  const pemCompleto = base64ToText(getEnvObrigatorio("EFI_CERT_KEY_PEM_BASE64"));
  const { cert, key } = extrairCertificadoEChave(pemCompleto);
  return Deno.createHttpClient({ cert, key });
}

function getBaseUrlEfi() {
  const env = String(Deno.env.get("EFI_ENV") || "homologation").toLowerCase().trim();
  if (["production", "producao", "produção", "prod"].includes(env)) return "https://pix.api.efipay.com.br";
  return "https://pix-h.api.efipay.com.br";
}

async function obterTokenEfi(client: Deno.HttpClient) {
  const clientId = getEnvObrigatorio("EFI_CLIENT_ID");
  const clientSecret = getEnvObrigatorio("EFI_CLIENT_SECRET");
  const basic = btoa(`${clientId}:${clientSecret}`);
  const resposta = await fetch(`${getBaseUrlEfi()}/oauth/token`, {
    method: "POST",
    client,
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`Erro ao autenticar na Efí: ${texto}`);
  const dados = JSON.parse(texto);
  if (!dados.access_token) throw new Error("Token Efí não retornado.");
  return dados.access_token as string;
}

async function consultarCobrancaEfi(params: { client: Deno.HttpClient; accessToken: string; txid: string }) {
  const resposta = await fetch(`${getBaseUrlEfi()}/v2/cob/${params.txid}`, {
    method: "GET",
    client: params.client,
    headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`Erro ao consultar cobrança Pix: ${texto}`);
  return JSON.parse(texto);
}

function adicionarDias(dataBase: Date, dias: number) {
  const novaData = new Date(dataBase);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

async function liberarPremium(supabaseAdmin: any, pagamento: any) {
  const agora = new Date();

  await supabaseAdmin
    .from("pagamentos_pix")
    .update({ status: "pago", pago_em: agora.toISOString(), atualizado_em: agora.toISOString() })
    .eq("id", pagamento.id);

  const { data: perfil } = await supabaseAdmin
    .from("perfis")
    .select("id, plano_expira_em")
    .eq("id", pagamento.usuario_id)
    .maybeSingle();

  const dataExpiracaoAtual = perfil?.plano_expira_em ? new Date(perfil.plano_expira_em) : null;
  const baseExpiracao = dataExpiracaoAtual && dataExpiracaoAtual > agora ? dataExpiracaoAtual : agora;
  const novaExpiracao = adicionarDias(baseExpiracao, Number(pagamento.dias || 30));

  const { error: updatePerfilError } = await supabaseAdmin
    .from("perfis")
    .update({ plano: "premium", plano_status: "ativo", plano_expira_em: novaExpiracao.toISOString() })
    .eq("id", pagamento.usuario_id);

  if (updatePerfilError) throw new Error(`Pagamento confirmado, mas erro ao liberar Premium: ${updatePerfilError.message}`);

  return novaExpiracao.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respostaJson({ erro: "Método não permitido. Use POST." }, 405);

  try {
    const supabaseUrl = getEnvObrigatorio("SUPABASE_URL");
    const supabaseAnonKey = getEnvObrigatorio("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getEnvObrigatorio("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return respostaJson({ erro: "Usuário não autenticado." }, 401);

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) return respostaJson({ erro: "Sessão inválida. Faça login novamente." }, 401);

    const body = await req.json().catch(() => ({}));
    const pagamentoId = body.pagamento_id || body.pagamentoId || body.id;
    if (!pagamentoId) return respostaJson({ erro: "ID do pagamento não informado." }, 400);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
      .from("pagamentos_pix")
      .select("*")
      .eq("id", pagamentoId)
      .eq("usuario_id", userData.user.id)
      .maybeSingle();

    if (pagamentoError) throw pagamentoError;
    if (!pagamento) return respostaJson({ erro: "Pagamento não encontrado." }, 404);

    if (pagamento.status === "pago") {
      return respostaJson({ sucesso: true, status: "pago", plano_liberado: true, plano_expira_em: pagamento.plano_expira_em || null });
    }

    const client = montarHttpClientEfi();
    const accessToken = await obterTokenEfi(client);
    const cobranca = await consultarCobrancaEfi({ client, accessToken, txid: pagamento.txid });
    const statusEfi = String(cobranca?.status || "").toUpperCase();
    const possuiPix = Array.isArray(cobranca?.pix) && cobranca.pix.length > 0;

    if (statusEfi === "CONCLUIDA" || possuiPix) {
      const planoExpiraEm = await liberarPremium(supabaseAdmin, pagamento);
      return respostaJson({ sucesso: true, status: "pago", plano_liberado: true, plano_expira_em: planoExpiraEm });
    }

    return respostaJson({ sucesso: true, status: "pendente", mensagem: "Pagamento ainda não confirmado." });
  } catch (error) {
    console.error("Erro verificar-pix-basico:", error);
    return respostaJson({ erro: error instanceof Error ? error.message : "Erro interno ao verificar Pix." }, 500);
  }
});
