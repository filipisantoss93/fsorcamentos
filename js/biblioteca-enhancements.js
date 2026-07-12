/* FS Orçamentos — melhorias progressivas da Biblioteca Técnica */
(function melhorarBiblioteca() {
  'use strict';

  const modal = document.getElementById('biblioteca-modal');
  const fechar = document.getElementById('biblioteca-fechar');
  const grid = document.getElementById('biblioteca-conteudos');
  const resultados = document.getElementById('biblioteca-resultados');
  let ultimoFoco = null;

  observarInterface();
  configurarModal();
  configurarImagens();
  abrirConteudoDaUrl();

  function observarInterface() {
    if (!grid) return;

    const atualizar = () => {
      grid.setAttribute('aria-busy', 'false');
      configurarImagens();
      configurarLinksConteudos();

      const cards = grid.querySelectorAll('.biblioteca-card').length;
      if (resultados) {
        resultados.textContent = cards === 1 ? '1 conteúdo encontrado' : `${cards} conteúdos encontrados`;
      }
    };

    new MutationObserver(atualizar).observe(grid, { childList: true, subtree: true });
    atualizar();
  }

  function configurarLinksConteudos() {
    grid?.querySelectorAll('[data-abrir-conteudo]').forEach(botao => {
      if (botao.dataset.enhanced === 'true') return;
      botao.dataset.enhanced = 'true';
      botao.addEventListener('click', () => {
        ultimoFoco = botao;
        const slug = botao.dataset.abrirConteudo || '';
        if (slug) atualizarUrl(slug);
      });
    });
  }

  function configurarImagens() {
    document.querySelectorAll('.biblioteca-card-imagem, .biblioteca-modal-imagem').forEach(imagem => {
      if (imagem.dataset.fallbackConfigurado === 'true') return;
      imagem.dataset.fallbackConfigurado = 'true';
      imagem.addEventListener('error', () => {
        const wrapper = imagem.closest('.biblioteca-card-imagem-wrap, .biblioteca-modal-imagem-wrap');
        if (wrapper) wrapper.remove();
      }, { once: true });
    });
  }

  function configurarModal() {
    if (!modal || !fechar) return;

    const observarModal = () => {
      const aberto = modal.classList.contains('ativo');
      modal.setAttribute('aria-hidden', aberto ? 'false' : 'true');

      if (aberto) {
        setTimeout(() => fechar.focus(), 0);
      } else {
        removerConteudoDaUrl();
        if (ultimoFoco instanceof HTMLElement) ultimoFoco.focus();
      }
    };

    new MutationObserver(observarModal).observe(modal, { attributes: true, attributeFilter: ['class'] });
    modal.addEventListener('keydown', prenderFoco);
    observarModal();
  }

  function prenderFoco(evento) {
    if (evento.key !== 'Tab' || !modal?.classList.contains('ativo')) return;

    const focaveis = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(elemento => elemento.offsetParent !== null);

    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  function atualizarUrl(slug) {
    const url = new URL(window.location.href);
    url.searchParams.set('conteudo', slug);
    history.pushState({ bibliotecaConteudo: slug }, '', url);
  }

  function removerConteudoDaUrl() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('conteudo')) return;
    url.searchParams.delete('conteudo');
    history.replaceState({}, '', url);
  }

  function abrirConteudoDaUrl() {
    const slug = new URL(window.location.href).searchParams.get('conteudo');
    if (!slug || !grid) return;

    const tentarAbrir = () => {
      const botao = grid.querySelector(`[data-abrir-conteudo="${CSS.escape(slug)}"]`);
      if (!botao) return false;
      ultimoFoco = botao;
      botao.click();
      return true;
    };

    if (tentarAbrir()) return;

    const observador = new MutationObserver(() => {
      if (tentarAbrir()) observador.disconnect();
    });
    observador.observe(grid, { childList: true, subtree: true });
    setTimeout(() => observador.disconnect(), 5000);
  }
})();
