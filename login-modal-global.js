/* =========================================================
   FS ORÇAMENTOS — MODAL DE LOGIN GLOBAL
   Garante que páginas com login embutido abram o auth como modal.
   ========================================================= */

(function () {
  'use strict';

  function fsEl(id) {
    return document.getElementById(id);
  }

  function fsCriarModalLoginSeNecessario() {
    let modal = fsEl('modal-login');
    if (modal) return modal;

    const authArea = fsEl('auth-area');
    const authContainer = fsEl('auth-container');

    if (!authArea && !authContainer) return null;

    modal = document.createElement('div');
    modal.id = 'modal-login';
    modal.className = 'modal-login-overlay';
    modal.setAttribute('aria-hidden', 'true');

    const box = document.createElement('div');
    box.className = 'modal-login-box';

    const fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'btn-fechar-login';
    fechar.innerHTML = '&times;';
    fechar.setAttribute('aria-label', 'Fechar login');
    fechar.onclick = function () {
      if (typeof window.fecharModalLogin === 'function') window.fecharModalLogin();
    };

    const topo = document.createElement('div');
    topo.className = 'auth-logo-box';
    topo.innerHTML = '<div class="auth-logo-text"><strong>FS</strong><span>Orçamentos</span></div><p>Acesse sua conta para continuar</p>';

    box.appendChild(fechar);
    box.appendChild(topo);

    if (authArea) {
      box.appendChild(authArea);
    } else if (authContainer) {
      const wrapper = document.createElement('div');
      wrapper.id = 'auth-area';
      wrapper.appendChild(authContainer);
      box.appendChild(wrapper);
    }

    modal.appendChild(box);
    document.body.appendChild(modal);

    modal.addEventListener('click', function (event) {
      if (event.target === modal && typeof window.fecharModalLogin === 'function') {
        window.fecharModalLogin();
      }
    });

    return modal;
  }

  function fsAbrirModalLoginGlobal() {
    const modal = fsCriarModalLoginSeNecessario();
    const authArea = fsEl('auth-area');
    const authContainer = fsEl('auth-container');

    if (!modal) {
      window.location.href = '/index.html?login=1';
      return;
    }

    if (authArea) authArea.style.display = 'block';
    if (authContainer) authContainer.style.display = 'block';

    modal.style.display = 'flex';
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('login-modal-aberto');
    document.body.style.overflow = 'hidden';

    if (typeof window.inserirBotoesSociaisLogin === 'function') {
      try { window.inserirBotoesSociaisLogin(); } catch (_) {}
    }
  }

  function fsFecharModalLoginGlobal() {
    const modal = fsEl('modal-login');
    if (!modal) return;

    modal.style.display = 'none';
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('login-modal-aberto');
    document.body.style.overflow = '';
  }

  function fsInstalarModalLoginGlobal() {
    window.abrirModalLogin = fsAbrirModalLoginGlobal;
    window.fecharModalLogin = fsFecharModalLoginGlobal;

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') fsFecharModalLoginGlobal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fsInstalarModalLoginGlobal);
  } else {
    fsInstalarModalLoginGlobal();
  }
})();
