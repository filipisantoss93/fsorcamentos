/* FS Orçamentos — usa public_token no link público enviado ao cliente */
(function(){
  'use strict';

  function linkPublicoOrcamento(orcamento){
    const token = String(orcamento?.public_token || '').trim();
    if(token) return `${location.origin}/ver.html?token=${encodeURIComponent(token)}`;
    if(orcamento?.id) return `${location.origin}/ver.html?id=${encodeURIComponent(orcamento.id)}`;
    return '';
  }

  function montarMensagem(clienteNome, link, veiculo){
    const nome = clienteNome && String(clienteNome).trim() ? String(clienteNome).trim() : 'cliente';
    const textoVeiculo = veiculo && typeof window.fsFormatarVeiculoResumoOrcamento === 'function'
      ? `\n\nVeículo: ${window.fsFormatarVeiculoResumoOrcamento(veiculo)}`
      : '';
    return `Olá, ${nome}! Tudo bem?\n\nSeu orçamento está pronto para visualização.\n\nAcesse o link abaixo para conferir os detalhes e aprovar ou recusar a proposta:\n\n${link}${textoVeiculo}\n\nQualquer dúvida, estou à disposição.`;
  }

  function instalar(){
    if(window.enviarPorWhatsApp?.__fsTokenPublico) return;
    if(typeof window.fsSalvarOrcamentoSePlanoPermitido !== 'function' && typeof fsSalvarOrcamentoSePlanoPermitido !== 'function') return;

    window.enviarPorWhatsApp = async function(){
      if(window.enviandoWhatsappFS) return;
      window.enviandoWhatsappFS = true;
      const botoes = document.querySelectorAll('.btn-whatsapp,.btn-acao-whatsapp,.btn-float-whatsapp');
      botoes.forEach(b => b.disabled = true);

      try{
        if(typeof window.fsPlanoPermiteSalvarOrcamento === 'function' && !window.fsPlanoPermiteSalvarOrcamento()){
          alert('O envio por WhatsApp com link está disponível no Plano Básico.');
          return;
        }

        const dados = typeof window.fsColetarDadosOrcamentoAtual === 'function'
          ? window.fsColetarDadosOrcamentoAtual()
          : fsColetarDadosOrcamentoAtual();

        const telefone = typeof window.fsLimparTelefoneWhatsapp === 'function'
          ? window.fsLimparTelefoneWhatsapp(dados.clienteWhatsapp)
          : String(dados.clienteWhatsapp || '').replace(/\D/g,'');

        if(!dados.clienteNome){ alert('Informe o nome do cliente.'); return; }
        if(!telefone){ alert('Informe o WhatsApp do cliente.'); return; }
        if(!dados.itens?.length){ alert('Adicione pelo menos um item ao orçamento.'); return; }

        const salvar = window.fsSalvarOrcamentoSePlanoPermitido || fsSalvarOrcamentoSePlanoPermitido;
        const orcamentoSalvo = await salvar('whatsapp_manual');
        const link = linkPublicoOrcamento(orcamentoSalvo);

        if(!link){
          alert('Não foi possível gerar o link do orçamento. O orçamento precisa ser salvo na nuvem.');
          return;
        }

        const msg = montarMensagem(dados.clienteNome, link, dados.veiculo);
        const janela = window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(msg)}`, 'fsorcamentos_whatsapp');
        if(!janela){ alert('O navegador bloqueou a abertura do WhatsApp. Permita pop-ups para este site.'); return; }
        janela.focus();
      }catch(e){
        console.error('Erro ao enviar WhatsApp com token público:', e);
        alert('Não foi possível abrir o WhatsApp.');
      }finally{
        window.enviandoWhatsappFS = false;
        botoes.forEach(b => b.disabled = false);
      }
    };
    window.enviarPorWhatsApp.__fsTokenPublico = true;
  }

  window.fsLinkPublicoOrcamento = linkPublicoOrcamento;
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(instalar, 800));
  else setTimeout(instalar, 800);
  setTimeout(instalar, 1800);
  setTimeout(instalar, 3000);
})();
