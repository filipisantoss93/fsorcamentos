/* FS Orçamentos — melhorias de robustez e acessibilidade do painel */
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

  function conteudoProtegido(){ return document.getElementById('conteudo-protegido'); }
  function authArea(){ return document.getElementById('auth-area'); }

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

  function marcarKpisCarregando(){
    ['dash-total-orcamentos','dash-pendentes','dash-aprovados-mes','dash-valor-aprovado-mes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.dataset.loading = 'true';
    });
  }

  function observarKpis(){
    ['dash-total-orcamentos','dash-pendentes','dash-aprovados-mes','dash-valor-aprovado-mes'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new MutationObserver(() => { delete el.dataset.loading; observer.disconnect(); });
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
    const id = modal.id;
    const mapa = {
      'modal-editar-perfil':'fecharModalEditarPerfil',
      'modal-senha':'fecharModalSenha',
      'modal-excluir-conta':'fecharModalExcluirConta',
      'modal-pix-basico':'fecharModalPixBasico'
    };
    const funcao = mapa[id] && window[mapa[id]];
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
        const aberto = getComputedStyle(modal).display !== 'none';
        sincronizarModal(modal, aberto);
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
      if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro.focus(); }
    });
  }

  function instalarValidacoes(){
    const empresa = document.getElementById('nome_empresa');
    const telefone = document.getElementById('telefone_empresa');
    const documento = document.getElementById('cnpj_empresa');
    const endereco = document.getElementById('endereco_empresa');
    const responsavel = document.getElementById('novo-responsavel-nome');
    const novaSenha = document.getElementById('nova_senha');
    const confirmarSenha = document.getElementById('confirmar_senha');
    const logo = document.getElementById('logo_file');

    if (empresa) { empresa.maxLength = 120; empresa.autocomplete = 'organization'; }
    if (telefone) { telefone.maxLength = 20; telefone.inputMode = 'tel'; telefone.autocomplete = 'tel'; }
    if (documento) { documento.maxLength = 18; documento.inputMode = 'numeric'; }
    if (endereco) { endereco.maxLength = 220; endereco.autocomplete = 'street-address'; }
    if (responsavel) responsavel.maxLength = 100;
    if (novaSenha) novaSenha.minLength = 8;
    if (confirmarSenha) confirmarSenha.minLength = 8;

    if (logo) logo.addEventListener('change', () => {
      const arquivo = logo.files?.[0];
      if (!arquivo) return;
      const tipos = new Set(['image/png','image/jpeg','image/webp']);
      const limite = 2 * 1024 * 1024;
      if (!tipos.has(arquivo.type) || arquivo.size > limite) {
        logo.value = '';
        const status = document.getElementById('status-logo');
        if (status) {
          status.className = 'status-msg erro';
          status.textContent = arquivo.size > limite ? 'A logo deve ter no máximo 2 MB.' : 'Formato inválido. Use PNG, JPG, JPEG ou WEBP.';
        }
      }
    });
  }

  function configurarPlanoRecolhivel(){
    const secao = document.getElementById('renovar-plano-pix-painel');
    const badge = document.getElementById('perfil-plano');
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
        if (!ids.some(id => document.getElementById(id))) return null;
        try { return await original.apply(this, arguments); }
        catch (erro) { console.error(`Falha isolada em ${nome}:`, erro); return null; }
      };
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    marcarKpisCarregando();
    observarKpis();
    instalarAcessibilidadeModais();
    instalarValidacoes();
    configurarPlanoRecolhivel();
    protegerCarregamentosOpcionais();
  });
})();
