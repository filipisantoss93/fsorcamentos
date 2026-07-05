import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

function adicionarDias(dataBase: Date, dias: number) {
  const novaData = new Date(dataBase);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

function extrairTxidsDoWebhook(body: any): string[] {
  const txids = new Set<string>();
  if (body?.pix && Array.isArray(body.pix)) {
    for (const item of body.pix) if (item?.txid) txids.add(String(item.txid));
  }
  if (body?.txid) txids.add(String(body.txid));
  return Array.from(txids);
}

async function liberarPremium(supabaseAdmin: any, pagamento: any) {
  const agora = new Date();

  const { error: updatePagamentoError } = await supabaseAdmin
    .from("pagamentos_pix")
    .update({ status: "pago", pago_em: agora.toISOString(), atualizado_em: agora.toISOString() })
    .eq("id", pagamento.id);

  if (updatePagamentoError) throw updatePagamentoError;

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from("perfis")
    .select("id, plano_expira_em")
    .eq("id", pagamento.usuario_id)
    .maybeSingle();

  if (perfilError) throw perfilError;

  const dataExpiracaoAtual = perfil?.plano_expira_em ? new Date(perfil.plano_expira_em) : null;
  const baseExpiracao = dataExpiracaoAtual && dataExpiracaoAtual > agora ? dataExpiracaoAtual : agora;
  const novaExpiracao = adicionarDias(baseExpiracao, Number(pagamento.dias || 30));

  const { error: updatePerfilError } = await supabaseAdmin
    .from("perfis")
    .update({ plano: "premium", plano_status: "ativo", plano_expira_em: novaExpiracao.toISOString() })
    .eq("id", pagamento.usuario_id);

  if (updatePerfilError) throw updatePerfilError;

  return novaExpiracao.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respostaJson({ erro: "Método não permitido." }, 405);

  try {
    const supabaseUrl = getEnvObrigatorio("SUPABASE_URL");
    const supabaseServiceRoleKey = getEnvObrigatorio("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = await req.json().catch(() => ({}));
    const txids = extrairTxidsDoWebhook(body);

    if (!txids.length) {
      return respostaJson({ sucesso: true, mensagem: "Webhook recebido, mas nenhum txid foi encontrado." });
    }

    const resultados = [];

    for (const txid of txids) {
      try {
        const { data: pagamento, error: pagamentoError } = await supabaseAdmin
          .from("pagamentos_pix")
          .select("*")
          .eq("txid", txid)
          .maybeSingle();

        if (pagamentoError) throw pagamentoError;
        if (!pagamento) {
          resultados.push({ txid, sucesso: false, erro: "Pagamento não encontrado." });
          continue;
        }

        if (pagamento.status === "pago") {
          resultados.push({ txid, sucesso: true, mensagem: "Pagamento já estava marcado como pago." });
          continue;
        }

        const planoExpiraEm = await liberarPremium(supabaseAdmin, pagamento);
        resultados.push({ txid, sucesso: true, mensagem: "Pagamento confirmado e Premium liberado.", usuario_id: pagamento.usuario_id, plano_expira_em: planoExpiraEm });
      } catch (error) {
        console.error("Erro ao processar txid:", txid, error);
        resultados.push({ txid, sucesso: false, erro: error instanceof Error ? error.message : "Erro ao processar pagamento." });
      }
    }

    return respostaJson({ sucesso: true, resultados });
  } catch (error) {
    console.error("Erro webhook-efi-pix:", error);
    return respostaJson({ erro: error instanceof Error ? error.message : "Erro interno no webhook." }, 500);
  }
});
