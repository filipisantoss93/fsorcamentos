/* =========================================================
   FS ORÇAMENTOS — AÇÕES DO TÓPICO EM MENU + PERFIL SOCIAL
   - Agrupa ações do fórum em menu de 3 pontinhos.
   - Torna nome/avatar do autor clicável para perfil.html?id=...
   ========================================================= */

(function () {
  function fsForumEsc(valor) {
    if (typeof forumEscaparHtml === 'function') return forumEscaparHtml(valor);
    return String(valor || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function fsForumFecharMenusAcoes() {
    document.querySelectorAll('.forum-acoes-menu-wrap.aberto').forEach(menu => {
      menu.classList.remove('aberto');
    });
  }

  function fsForumInstalarCssPerfil() {
    if (document.getElementById('fs-forum-perfil-social-css')) return;
    const style = document.createElement('style');
    style.id = 'fs-forum-perfil-social-css';
    style.textContent = `
      .forum-autor-linha.fs-autor-clicavel {
        cursor: pointer !important;
        border-radius: 6px !important;
        padding: 2px !important;
        margin: -2px !important;
        transition: background .15s ease !important;
      }

      .forum-autor-linha.fs-autor-clicavel:hover {
        background: #f8f4ee !important;
      }

      .forum-autor-linha.fs-autor-clicavel .forum-autor-texto strong {
        text-decoration: none !important;
      }

      .forum-autor-linha.fs-autor-clicavel:hover .forum-autor-texto strong {
        text-decoration: underline !important;
      }
    `;
    document.head.appendChild(style);
  }

  function fsForumIrPerfilAutor(usuarioId, event) {
    if (event) event.stopPropagation();
    if (!usuarioId) return;
    window.location.href = `/perfil.html?id=${encodeURIComponent(usuarioId)}`;
  }

  function fsForumInstalarPerfilAutor() {
    if (typeof window.forumAutorLinhaHtml !== 'function') return;
    if (window.forumAutorLinhaHtml.__fsPerfilSocial) return;

    const original = window.forumAutorLinhaHtml;
    window.forumAutorLinhaHtml = function forumAutorLinhaHtmlComPerfil(registro, subtitulo = '') {
      const html = original(registro, subtitulo);
      const usuarioId = typeof registro === 'string' ? registro : registro?.usuario_id;
      if (!usuarioId) return html;
      return html.replace('class="forum-autor-linha"', `class="forum-autor-linha fs-autor-clicavel" onclick="fsForumIrPerfilAutor('${fsForumEsc(usuarioId)}', event)" title="Ver perfil"`);
    };
    window.forumAutorLinhaHtml.__fsPerfilSocial = true;
  }

  window.fsForumIrPerfilAutor = fsForumIrPerfilAutor;

  window.forumToggleMenuAcoes = function forumToggleMenuAcoes(event) {
    if (event) event.stopPropagation();
    const wrap = event?.currentTarget?.closest('.forum-acoes-menu-wrap');
    const estavaAberto = wrap?.classList.contains('aberto');
    fsForumFecharMenusAcoes();
    if (wrap && !estavaAberto) wrap.classList.add('aberto');
  };

  window.forumExecutarAcaoMenuTopico = function forumExecutarAcaoMenuTopico(nomeAcao, argumento) {
    fsForumFecharMenusAcoes();
    const acoes = {
      resolver: () => typeof forumMarcarTopicoResolvido === 'function' && forumMarcarTopicoResolvido(),
      foto: () => typeof forumTrocarFotoTopico === 'function' && forumTrocarFotoTopico(Number(argumento || 1)),
      editar: () => typeof forumEditarTopico === 'function' && forumEditarTopico(),
      excluir: () => typeof forumExcluirTopico === 'function' && forumExcluirTopico(),
      denunciar: () => typeof forumDenunciarTopico === 'function' && forumTopicoAtual?.id && forumDenunciarTopico(forumTopicoAtual.id)
    };
    if (acoes[nomeAcao]) acoes[nomeAcao]();
  };

  window.forumRenderizarAcoesTopico = function forumRenderizarAcoesTopico(topico) {
    const box = document.getElementById('forum-topico-acoes');
    if (!box || !topico) return;

    const dono = typeof forumEhDonoTopico === 'function' ? forumEhDonoTopico(topico) : false;
    const status = typeof forumStatusTopico === 'function' ? forumStatusTopico(topico) : (topico.resolvido ? 'resolvido' : topico.status || 'aberto');
    const resolvido = status === 'resolvido';
    const curtidas = Number(topico.total_curtidas || topico.curtidas || 0);
    const curtiu = window.forumCurtidasTopicos instanceof Set && forumCurtidasTopicos.has(topico.id);
    const botaoCurtir = typeof forumBotaoCurtirTopico === 'function'
      ? forumBotaoCurtirTopico(topico)
      : `<button type="button" class="forum-like-btn ${curtiu ? 'curtido' : ''}" onclick="forumCurtirTopico('${fsForumEsc(topico.id)}')">${curtidas} 👍</button>`;

    const itens = [];

    if (topico.usuario_id) {
      itens.push(`<button type="button" class="forum-menu-item destaque" onclick="fsForumIrPerfilAutor('${fsForumEsc(topico.usuario_id)}', event)">👤 Ver perfil</button>`);
    }

    if (dono && !resolvido) {
      itens.push('<button type="button" class="forum-menu-item destaque" onclick="forumExecutarAcaoMenuTopico(\'resolver\')">✅ Marcar como resolvido</button>');
    }

    if (dono) {
      itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'foto\', 1)">📷 Adicionar foto 1</button>');
      itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'foto\', 2)">📷 Adicionar foto 2</button>');
      itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'editar\')">✏️ Editar tópico</button>');
      itens.push('<button type="button" class="forum-menu-item perigo" onclick="forumExecutarAcaoMenuTopico(\'excluir\')">🗑️ Excluir tópico</button>');
    }

    itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'denunciar\')">🚩 Denunciar</button>');

    box.innerHTML = `
      <div class="forum-acoes-compactas">
        <div class="forum-curtir-slot">${botaoCurtir}</div>
        <div class="forum-acoes-menu-wrap">
          <button type="button" class="forum-menu-trigger" onclick="forumToggleMenuAcoes(event)" aria-label="Mais ações do tópico">⋮</button>
          <div class="forum-acoes-menu">
            ${itens.join('')}
          </div>
        </div>
      </div>
    `;
  };

  document.addEventListener('click', event => {
    if (!event.target.closest('.forum-acoes-menu-wrap')) fsForumFecharMenusAcoes();
  });

  fsForumInstalarCssPerfil();
  fsForumInstalarPerfilAutor();
  setTimeout(fsForumInstalarPerfilAutor, 300);
  setTimeout(fsForumInstalarPerfilAutor, 1000);
})();