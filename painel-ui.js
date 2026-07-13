/* FS Orçamentos — robustez, acessibilidade e hotfixes do painel */
(function painelUiFixes(){
  'use strict';

  const seletoresFoco = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let ultimoFoco = null;

  function elemento(id){ return document.getElementById(id); }
  function conteudoProtegido(){ return elemento('conteudo-protegido'); }
  function authArea(){ return elemento('auth-area'); }
  function statusLogo(mensagem, tipo = 'sucesso'){
    const status = elemento('status-logo');
    if (!status) return;
    status.className = `status-msg ${tipo}`;
    status.textContent = mensagem;
  }

  window.mostrarConteudoProtegidoPainel = function mostrarConteudoProtegidoPainelSeguro(){
    const conteudo = conteudoProtegido();
    const loading = authArea();
    if (loading) loading.style.display = 'none';
    if (conteudo) {
      conteudo.hidden = false;
      conteudo.removeAttribute('hidden');
      conteudo.style.display = 'block';
    }
  };

  window.mostrarAreaLoginPainel = function mostrarAreaLoginPainelSeguro(){
    const conteudo = conteudoProtegido();
    const loading = authArea();
    if (conteudo) {
      conteudo.hidden = true;
      conteudo.style.display = 'none';
    }
    if (loading) loading.style.display = 'grid';
  };

  function removerAtalhoClientes(){
    document.querySelectorAll('.acao-rapida[href="/clientes.html"],.acao-rapida[href="clientes.html"]').forEach(link => link.remove());
  }

  function marcarKpisCarregando(){
    ['dash-total-orcamentos','dash-pendentes','dash-aprovados-mes','dash-valor-aprovado-mes'].forEach(id => {
      const el = elemento(id);
      if (el) el.dataset.loading = 'true';
    });
  }

  function observarKpis(){
    ['dash-total-orcamentos','dash-pendentes','dash-aprovados-mes','dash-valor-aprovado-mes'].forEach(id => {
      const el = elemento(id);
      if (!el) return;
      const observer = new MutationObserver(() => {
        delete el.dataset.loading;
        observer.disconnect();
      });
      observer.observe(el, { childList:true, characterData:true, subtree:true });
    });
  }

  function obterModalAberto(){
    return Array.from(document.querySelectorAll('.modal-overlay-painel,.modal-pix-overlay')).find(modal => {
      const style = getComputedStyle(modal);
      return style.display !== 'none' && modal.getAttribute('aria-hidden') !== 'true';
    });
  }

  function sincronizarModal(modal, aberto){
    if (!modal) return;
    modal.setAttribute('aria-hidden', aberto ? 'false' : 'true');
    if (aberto) {
      ultimoFoco = document.activeElement;
      document.body.classList.add('modal-aberto');
      requestAnimationFrame(() => modal.querySelector(seletoresFoco)?.focus());
    } else {
      if (!obterModalAberto()) document.body.classList.remove('modal-aberto');
      if (ultimoFoco instanceof HTMLElement && document.contains(ultimoFoco)) ultimoFoco.focus();
    }
  }

  function fecharModalAtual(){
    const modal = obterModalAberto();
    if (!modal) return;
    const mapa = {
      'modal-editar-perfil':'fecharModalEditarPerfil',
      'modal-senha':'fecharModalSenha',
      'modal-excluir-conta':'fecharModalExcluirConta',
      'modal-pix-basico':'fecharModalPixBasico'
    };
    const funcao = mapa[modal.id] && window[mapa[modal.id]];
    if (typeof funcao === 'function') funcao();
    else modal.style.display = 'none';
    sincronizarModal(modal, false);
  }

  function instalarAcessibilidadeModais(){
    document.querySelectorAll('.modal-overlay-painel,.modal-pix-overlay').forEach(modal => {
      modal.setAttribute('aria-hidden', 'true');
      modal.addEventListener('mousedown', event => {
        if (event.target === modal) fecharModalAtual();
      });
      new MutationObserver(() => {
        sincronizarModal(modal, getComputedStyle(modal).display !== 'none');
      }).observe(modal, { attributes:true, attributeFilter:['style','class'] });
    });

    document.addEventListener('keydown', event => {
      const modal = obterModalAberto();
      if (!modal) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        fecharModalAtual();
        return;
      }
      if (event.key !== 'Tab') return;
      const focaveis = Array.from(modal.querySelectorAll(seletoresFoco)).filter(el => el.offsetParent !== null);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    });
  }

  function instalarValidacoes(){
    const empresa = elemento('nome_empresa');
    const telefone = elemento('telefone_empresa');
    const documento = elemento('cnpj_empresa');
    const endereco = elemento('endereco_empresa');
    const responsavel = elemento('novo-responsavel-nome');
    const novaSenha = elemento('nova_senha');
    const confirmarSenha = elemento('confirmar_senha');

    if (empresa) { empresa.maxLength = 120; empresa.autocomplete = 'organization'; }
    if (telefone) { telefone.maxLength = 20; telefone.inputMode = 'tel'; telefone.autocomplete = 'tel'; }
    if (documento) { documento.maxLength = 18; documento.inputMode = 'numeric'; }
    if (endereco) { endereco.maxLength = 220; endereco.autocomplete = 'street-address'; }
    if (responsavel) responsavel.maxLength = 100;
    if (novaSenha) novaSenha.minLength = 8;
    if (confirmarSenha) confirmarSenha.minLength = 8;
  }

  function extensaoPorMime(tipo){
    if (tipo === 'image/png') return 'png';
    if (tipo === 'image/webp') return 'webp';
    return 'jpg';
  }

  async function obterSessaoLogo(){
    if (!window._supabase?.auth) return null;
    const { data:{ session }, error } = await window._supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  window.enviarLogoPerfil = async function enviarLogoPerfilSeguro(file){
    const tipos = new Set(['image/png','image/jpeg','image/jpg','image/webp']);
    if (!file || !tipos.has(file.type)) {
      statusLogo('Formato inválido. Use PNG, JPG, JPEG ou WEBP.', 'erro');
      return false;
    }
    if (file.size > 700 * 1024) {
      statusLogo('A imagem deve ter no máximo 700 KB.', 'erro');
      return false;
    }

    try {
      statusLogo('Enviando logo...', '');
      const session = await obterSessaoLogo();
      if (!session?.user?.id) throw new Error('Sessão não encontrada. Entre novamente na sua conta.');

      const userId = session.user.id;
      const extensao = extensaoPorMime(file.type);
      const caminho = `${userId}/logo.${extensao}`;
      const caminhosAntigos = ['png','jpg','jpeg','webp']
        .map(ext => `${userId}/logo.${ext}`)
        .filter(item => item !== caminho);

      await window._supabase.storage.from('logos').remove(caminhosAntigos);

      const { error: uploadError } = await window._supabase.storage
        .from('logos')
        .upload(caminho, file, {
          upsert: true,
          contentType: file.type === 'image/jpg' ? 'image/jpeg' : file.type,
          cacheControl: '3600'
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = window._supabase.storage.from('logos').getPublicUrl(caminho);
      const logoUrl = publicUrlData?.publicUrl;
      if (!logoUrl) throw new Error('O Storage não retornou a URL pública da logo.');

      const { data: perfilSalvo, error: perfilError } = await window._supabase
        .from('perfis')
        .update({ foto_url: logoUrl, atualizado_em: new Date().toISOString() })
        .eq('id', userId)
        .select('id,foto_url')
        .maybeSingle();
      if (perfilError) throw perfilError;
      if (!perfilSalvo?.id) throw new Error('O perfil do usuário não foi encontrado para salvar a logo.');

      const campoUrl = elemento('foto_url');
      if (campoUrl) campoUrl.value = logoUrl;
      if (typeof window.atualizarPreviewLogo === 'function') window.atualizarPreviewLogo(logoUrl);
      if (typeof window.atualizarLogoEstatica === 'function') window.atualizarLogoEstatica(logoUrl);

      window.perfilAtual = { ...(window.perfilAtual || {}), foto_url: logoUrl };
      try { localStorage.setItem('foto_url', logoUrl); } catch (_) {}
      statusLogo('Logo salva com sucesso.', 'sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar logo:', error);
      statusLogo(`Não foi possível salvar a logo: ${error?.message || 'erro desconhecido'}`, 'erro');
      return false;
    }
  };

  function instalarUploadLogoSeguro(){
    const input = elemento('logo_file');
    if (!input) return;

    /* Substitui o input para remover listeners antigos e evitar upload duplicado. */
    const novoInput = input.cloneNode(true);
    input.replaceWith(novoInput);
    novoInput.dataset.configurado = 'sim';
    novoInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      novoInput.disabled = true;
      await window.enviarLogoPerfil(file);
      novoInput.value = '';
      novoInput.disabled = false;
    });
  }

  function configurarPlanoRecolhivel(){
    const secao = elemento('renovar-plano-pix-painel');
    const badge = elemento('perfil-plano');
    if (!secao || !badge) return;
    const atualizar = () => {
      const texto = (badge.textContent || '').toLowerCase();
      const pago = !texto.includes('grátis') && !texto.includes('gratuito');
      secao.classList.toggle('plano-vendas-recolhido', pago);
    };
    atualizar();
    new MutationObserver(atualizar).observe(badge, { childList:true, subtree:true, characterData:true });
    secao.querySelector('.painel-card-topo')?.addEventListener('click', () => secao.classList.remove('plano-vendas-recolhido'));
  }

  function protegerCarregamentosOpcionais(){
    const mapa = {
      carregarResumoOrdensServicoPainel:['painel-total-os','painel-os-abertas','painel-os-execucao','painel-os-concluidas'],
      carregarIndicadoresPremiumPainel:['painel-faturamento-os-total','painel-recebido-mes-os','painel-os-pagas-mes','painel-ticket-medio-os'],
      carregarResumoRelatoriosRecorrentesPainel:['painel-resumo-recorrentes','painel-total-recorrentes']
    };
    Object.entries(mapa).forEach(([nome, ids]) => {
      const original = window[nome];
      if (typeof original !== 'function') return;
      window[nome] = async function carregamentoCondicional(){
        if (!ids.some(id => elemento(id))) return null;
        try { return await original.apply(this, arguments); }
        catch (erro) { console.error(`Falha isolada em ${nome}:`, erro); return null; }
      };
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    removerAtalhoClientes();
    marcarKpisCarregando();
    observarKpis();
    instalarAcessibilidadeModais();
    instalarValidacoes();
    instalarUploadLogoSeguro();
    configurarPlanoRecolhivel();
    protegerCarregamentosOpcionais();
  });
})();