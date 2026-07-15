/* FS ORÇAMENTOS — correção do link público enviado pelo gerador */
(function () {
  const TOKEN_RE = /^[a-f0-9]{48}$/i;
  let enviando = false;

  function limparTelefone(valor) {
    let telefone = String(valor || '').replace(/\D/g, '');
    if (!telefone) return '';
    if (telefone.startsWith('00')) telefone = telefone.slice(2);
    if (telefone.length === 10 || telefone.length === 11) telefone = `55${telefone}`;
    return telefone;
  }

  function obterIdOrcamento(salvo) {
    return salvo?.id ||
      window.orcamentoAtualSalvoId ||
      window.orcamentoSalvoAtualId ||
      localStorage.getItem('fs_gerador_orcamento_nuvem_id_v1') ||
      null;
  }

  function linkPorToken(token) {
    const valor = String(token || '').trim().toLowerCase();
    return TOKEN_RE.test(valor)
      ? `${window.location.origin}/ver.html?token=${encodeURIComponent(valor)}`
      : '';
  }

  function linkAindaAtivo(orcamento) {
    if (!TOKEN_RE.test(String(orcamento?.public_token || '').trim())) return false;
    if (orcamento?.public_link_revogado_em) return false;
    if (!orcamento?.public_link_expira_em) return true;
    const expira = new Date(orcamento.public_link_expira_em).getTime();
    return Number.isFinite(expira) && expira >= Date.now();
  }

  async function garantirLinkPublico(orcamentoId) {
    if (!window._supabase || !orcamentoId) return '';

    const { data: atual, error: erroBusca } = await _supabase
      .from('orcamentos')
      .select('id,public_token,public_link_expira_em,public_link_revogado_em')
      .eq('id', orcamentoId)
      .maybeSingle();

    if (!erroBusca && linkAindaAtivo(atual)) {
      return linkPorToken(atual.public_token);
    }

    const { data, error } = await _supabase.rpc('fs_renovar_link_orcamento', {
      p_orcamento_id: orcamentoId,
      p_dias: 90
    });

    if (error || !data?.sucesso || !TOKEN_RE.test(String(data.public_token || ''))) {
      console.error('Não foi possível gerar link público do orçamento:', error || data);
      return '';
    }

    return linkPorToken(data.public_token);
  }

  function montarMensagem(clienteNome, link) {
    const nome = String(clienteNome || '').trim() || 'cliente';
    return `Olá, ${nome}! Tudo bem?\n\nSeu orçamento está pronto para visualização.\n\nAcesse o link abaixo para conferir os detalhes e aprovar ou recusar a proposta:\n\n${link}\n\nQualquer dúvida, estou à disposição.`;
  }

  window.fsGarantirLinkPublicoOrcamento = garantirLinkPublico;

  window.enviarPorWhatsApp = async function enviarPorWhatsAppComToken() {
    if (enviando) return;
    enviando = true;

    const botoes = document.querySelectorAll('.btn-whatsapp, .btn-acao-whatsapp, .btn-float-whatsapp');
    botoes.forEach(btn => { btn.disabled = true; });

    try {
      if (typeof window.fsColetarDadosOrcamentoAtual !== 'function' ||
          typeof window.fsSalvarOrcamentoSePlanoPermitido !== 'function') {
        throw new Error('O gerador ainda não terminou de carregar.');
      }

      const dados = window.fsColetarDadosOrcamentoAtual();
      const telefone = limparTelefone(dados.clienteWhatsapp);

      if (!dados.clienteNome) return alert('Informe o nome do cliente.');
      if (!telefone) return alert('Informe o WhatsApp do cliente.');
      if (!Array.isArray(dados.itens) || !dados.itens.length) return alert('Adicione pelo menos um item ao orçamento.');

      const salvo = await window.fsSalvarOrcamentoSePlanoPermitido('whatsapp_manual');
      const id = obterIdOrcamento(salvo);
      if (!id) return alert('Não foi possível salvar o orçamento na nuvem.');

      const link = await garantirLinkPublico(id);
      if (!link) return alert('Não foi possível gerar o link seguro do orçamento.');

      const url = `https://wa.me/${telefone}?text=${encodeURIComponent(montarMensagem(dados.clienteNome, link))}`;
      const janela = window.open(url, 'fsorcamentos_whatsapp');
      if (!janela) return alert('O navegador bloqueou a abertura do WhatsApp. Permita pop-ups para este site.');
      janela.focus();
    } catch (error) {
      console.error('Erro ao enviar orçamento por WhatsApp:', error);
      alert(error?.message || 'Não foi possível abrir o WhatsApp.');
    } finally {
      enviando = false;
      botoes.forEach(btn => { btn.disabled = false; });
    }
  };
})();
