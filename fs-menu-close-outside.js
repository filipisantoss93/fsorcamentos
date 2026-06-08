/* =========================================================
   FS ORÇAMENTOS - fs-menu-close-outside.js
   Fecha o menu mobile ao clicar/tocar fora dele.
   Também fecha dropdowns abertos e suporte a tecla ESC.
   ========================================================= */
(function () {
  'use strict';

  let instalado = false;

  function menuAberto() {
    return document.querySelector('.header-menu-linha.menu-aberto');
  }

  function fecharMenuMobile() {
    const menuLinha = document.querySelector('.header-menu-linha');
    const btnMenu = document.querySelector('.menu-mobile-btn');

    if (menuLinha) {
      menuLinha.classList.remove('menu-aberto');
    }

    if (btnMenu) {
      btnMenu.setAttribute('aria-expanded', 'false');
    }

    document.querySelectorAll('.nav-dropdown details[open]').forEach((details) => {
      details.removeAttribute('open');
    });
  }

  function cliqueDentroDoHeader(event) {
    return !!event.target.closest('#header-container, .main-header');
  }

  function cliqueNoBotaoMenu(event) {
    return !!event.target.closest('.menu-mobile-btn');
  }

  function cliqueDentroDoMenu(event) {
    return !!event.target.closest('.header-menu-linha');
  }

  function instalar() {
    if (instalado) return;
    instalado = true;

    const originalToggle = window.toggleMenuMobile;

    window.toggleMenuMobile = function toggleMenuMobileCorrigido() {
      const menuLinha = document.querySelector('.header-menu-linha');
      const btnMenu = document.querySelector('.menu-mobile-btn');

      if (!menuLinha) {
        if (typeof originalToggle === 'function') originalToggle();
        return;
      }

      menuLinha.classList.toggle('menu-aberto');
      const aberto = menuLinha.classList.contains('menu-aberto');

      if (btnMenu) {
        btnMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      }
    };

    document.addEventListener('click', function (event) {
      if (!menuAberto()) return;
      if (cliqueNoBotaoMenu(event)) return;
      if (cliqueDentroDoMenu(event)) return;
      fecharMenuMobile();
    }, true);

    document.addEventListener('touchstart', function (event) {
      if (!menuAberto()) return;
      if (cliqueNoBotaoMenu(event)) return;
      if (cliqueDentroDoMenu(event)) return;
      fecharMenuMobile();
    }, { passive: true, capture: true });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        fecharMenuMobile();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) fecharMenuMobile();
    }, { passive: true });

    document.addEventListener('click', function (event) {
      const clicouDentroDropdown = event.target.closest('.nav-dropdown');
      const clicouNoMenu = event.target.closest('.menu-mobile-btn');

      if (clicouDentroDropdown || clicouNoMenu) return;

      document.querySelectorAll('.nav-dropdown details[open]').forEach((details) => {
        details.removeAttribute('open');
      });
    }, true);
  }

  function tentarInstalar() {
    instalar();
    setTimeout(instalar, 300);
    setTimeout(instalar, 900);
    setTimeout(instalar, 1800);
  }

  window.fsFecharMenuMobile = fecharMenuMobile;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tentarInstalar);
  } else {
    tentarInstalar();
  }
})();
