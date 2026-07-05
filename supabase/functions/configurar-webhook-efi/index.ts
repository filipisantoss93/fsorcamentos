import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respostaJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function getEnvObrigatorio(nome: string) {
  const valor = Deno.env.get(nome);
  if (!valor) throw new Error(`Secret ausente: ${nome}`);
  return valor;
}

function base64ToText(base64: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
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

async function configurarWebhookPixEfi(params: { client: Deno.HttpClient; accessToken: string; chavePix: string; webhookUrl: string }) {
  const resposta = await fetch(`${getBaseUrlEfi()}/v2/webhook/${encodeURIComponent(params.chavePix)}`, {
    method: "PUT",
    client: params.client,
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
      "x-skip-mtls-checking": "true",
    },
    body: JSON.stringify({ webhookUrl: params.webhookUrl }),
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(texto || "Erro ao configurar webhook Pix na Efí.");
  if (!texto) return null;
  try { return JSON.parse(texto); } catch { return texto; }
}

async function consultarWebhookPixEfi(params: { client: Deno.HttpClient; accessToken: string; chavePix: string }) {
  const resposta = await fetch(`${getBaseUrlEfi()}/v2/webhook/${encodeURIComponent(params.chavePix)}`, {
    method: "GET",
    client: params.client,
    headers: { Authorization: `Bearer ${params.accessToken}`, "Content-Type": "application/json" },
  });
  const texto = await resposta.text();
  if (!resposta.ok) return null;
  if (!texto) return null;
  try { return JSON.parse(texto); } catch { return texto; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respostaJson({ sucesso: false, erro: "Método não permitido. Use POST." }, 405);

  try {
    const chavePix = getEnvObrigatorio("EFI_PIX_KEY");
    const webhookUrl = "https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1/webhook-efi-pix";
    const ambiente = String(Deno.env.get("EFI_ENV") || "homologation");
    const efiClient = montarHttpClientEfi();
    const accessToken = await obterTokenEfi(efiClient);
    const configuracao = await configurarWebhookPixEfi({ client: efiClient, accessToken, chavePix, webhookUrl });
    const consulta = await consultarWebhookPixEfi({ client: efiClient, accessToken, chavePix });

    return respostaJson({ sucesso: true, mensagem: "Webhook Efí configurado com sucesso.", ambiente, chavePix, webhookUrl, configuracao, consulta });
  } catch (error) {
    console.error("Erro configurar-webhook-efi:", error);
    return respostaJson({ sucesso: false, erro: error instanceof Error ? error.message : "Erro interno ao configurar webhook." }, 500);
  }
});
