import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PeriodoPlano = "mensal" | "semestral" | "anual";

const PLANOS_PIX: Record<PeriodoPlano, { label: string; valor: number; dias: number }> = {
  mensal: { label: "Plano Premium - 1 mês", valor: 29.9, dias: 30 },
  semestral: { label: "Plano Premium - 6 meses", valor: 149.9, dias: 180 },
  anual: { label: "Plano Premium - 12 meses", valor: 299.9, dias: 365 },
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

function gerarTxid() {
  const agora = Date.now().toString();
  const aleatorio = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `FS${agora}${aleatorio}`.slice(0, 35);
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
  const baseUrl = getBaseUrlEfi();
  const basic = btoa(`${clientId}:${clientSecret}`);

  const resposta = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    client,
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`Erro ao autenticar na Efí: ${texto}`);

  const dados = JSON.parse(texto);
  if (!dados.access_token) throw new Error(`Token Efí não retornado: ${texto}`);
  return dados.access_token as string;
}

async function criarCobrancaPixEfi(params: { client: Deno.HttpClient; accessToken: string; txid: string; valor: number; descricao: string }) {
  const baseUrl = getBaseUrlEfi();
  const chavePix = getEnvObrigatorio("EFI_PIX_KEY");

  const resposta = await fetch(`${baseUrl}/v2/cob/${params.txid}`, {
    method: "PUT",
    client: params.client,
    headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      calendario: { expiracao: 3600 },
      valor: { original: params.valor.toFixed(2) },
      chave: chavePix,
      solicitacaoPagador: params.descricao.slice(0, 140),
    }),
  });

  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`Erro ao criar cobrança Pix na Efí: ${texto}`);
  return JSON.parse(texto);
}

async function gerarQrCodeEfi(params: { client: Deno.HttpClient; accessToken: string; locId: number | string }) {
  const baseUrl = getBaseUrlEfi();
  const resposta = await fetch(`${baseUrl}/v2/loc/${params.locId}/qrcode`, {
    method: "GET",
    client: params.client,
    headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
  });

  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`Erro ao gerar QR Code Pix: ${texto}`);
  return JSON.parse(texto);
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
    const periodo = String(body.periodo || "mensal") as PeriodoPlano;
    const plano = PLANOS_PIX[periodo] || PLANOS_PIX.mensal;
    const txid = gerarTxid();
    const descricao = `${plano.label} FS Orçamentos`;
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const efiClient = montarHttpClientEfi();
    const accessToken = await obterTokenEfi(efiClient);
    const cobranca = await criarCobrancaPixEfi({ client: efiClient, accessToken, txid, valor: plano.valor, descricao });
    const locId = cobranca?.loc?.id;

    if (!locId) throw new Error(`A cobrança Pix foi criada, mas não retornou loc.id: ${JSON.stringify(cobranca)}`);

    const qr = await gerarQrCodeEfi({ client: efiClient, accessToken, locId });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: pagamento, error: insertError } = await supabaseAdmin
      .from("pagamentos_pix")
      .insert({
        usuario_id: userData.user.id,
        plano: "premium",
        periodo,
        dias: plano.dias,
        valor: plano.valor,
        status: "pendente",
        gateway: "efi",
        txid,
        efi_id: cobranca?.loc?.id ? String(cobranca.loc.id) : null,
        pix_copia_cola: qr?.qrcode || null,
        qr_code: qr?.imagemQrcode || null,
        link_pagamento: qr?.linkVisualizacao || null,
        expira_em: expiraEm,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Pix gerado, mas não foi possível salvar no banco: ${insertError.message}`);

    return respostaJson({
      sucesso: true,
      pagamento_id: pagamento.id,
      periodo,
      plano: "premium",
      label: plano.label,
      dias: plano.dias,
      valor: plano.valor,
      txid,
      expira_em: expiraEm,
      pix_copia_cola: qr?.qrcode || "",
      qr_code: qr?.imagemQrcode || "",
      link_pagamento: qr?.linkVisualizacao || "",
    });
  } catch (error) {
    console.error("Erro criar-pix-basico:", error);
    return respostaJson({ erro: error instanceof Error ? error.message : "Erro interno ao gerar Pix.", detalhe: String(error) }, 500);
  }
});
