/* FS Orçamentos — Comunidade: publicar em modal + botão Meu perfil */
(function(){
  'use strict';

  function ehSocial(){
    const p = String(location.pathname || '').toLowerCase();
    return p.endsWith('/social.html') || p.endsWith('/forum.html') || p.endsWith('/social') || p.endsWith('/forum');
  }

  function css(){
    if(document.getElementById('fs-forum-comunidade-modal-css')) return;
    const style = document.createElement('style');
    style.id = 'fs-forum-comunidade-modal-css';
    style.textContent = `
      #forum-form-card.fs-comunidade-modal{
        position:fixed!important;inset:0!important;z-index:99999!important;display:none;align-items:center!important;justify-content:center!important;background:rgba(47,33,29,.64)!important;padding:14px!important;overflow:auto!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;
      }
      #forum-form-card.fs-comunidade-modal.ativo{display:flex!important;}
      #forum-form-card .fs-comunidade-modal-painel{
        width:min(720px,100%)!important;max-height:min(88vh,760px)!important;overflow:auto!important;background:#fffaf0!important;border:1px solid #e4d8cc!important;border-radius:14px!important;box-shadow:0 24px 70px rgba(0,0,0,.30)!important;padding:14px!important;color:#2f211d!important;
      }
      #forum-form-card.fs-comunidade-modal .forum-card-topo{position:sticky!important;top:-14px!important;z-index:2!important;background:#fffaf0!important;padding:4px 0 12px!important;border-bottom:1px solid #eadfd4!important;margin-bottom:12px!important;}
      #forum-form-card.fs-comunidade-modal textarea{min-height:150px!important;}
      .fs-comunidade-perfil-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:40px!important;padding:9px 12px!important;border-radius:8px!important;background:#fffaf0!important;color:#3e2723!important;border:1px solid #d7ccc8!important;text-decoration:none!important;font-weight:950!important;font-size:13px!important;cursor:pointer!important;white-space:nowrap!important;}
      .fs-comunidade-perfil-btn:hover{background:#ffc400!important;color:#2f211d!important;border-color:#2f211d!important;}
      .forum-hero-acoes{align-items:center!important;}
      @media(max-width:640px){#forum-form-card.fs-comunidade-modal{padding:10px!important;align-items:flex-start!important;}#forum-form-card .fs-comunidade-modal-painel{max-height:calc(100vh - 20px)!important;border-radius:12px!important;padding:12px!important}.forum-hero-acoes{display:grid!important;grid-template-columns:1fr!important}.forum-hero-acoes button,.forum-hero-acoes a{width:100%!important}}
    `;
    document.head.appendChild(style);
  }

  function envolverFormulario(){
    const card = document.getElementById('forum-form-card');
    if(!card || card.dataset.fsModalPreparado === '1') return card;
    const painel = document.createElement('div');
    painel.className = 'fs-comunidade-modal-painel';
    while(card.firstChild) painel.appendChild(card.firstChild);
    card.appendChild(painel);
    card.classList.add('fs-comunidade-modal');
    card.dataset.fsModalPreparado = '1';

    card.addEventListener('click', (event) => {
      if(event.target === card) window.forumOcultarFormularioNovoTopico?.();
    });

    document.addEventListener('keydown', (event) => {
      if(event.key === 'Escape' && card.classList.contains('ativo')) window.forumOcultarFormularioNovoTopico?.();
    });
    return card;
  }

  async function usuarioIdAtual(){
    try{
      if(window.forumSessaoAtual?.user?.id) return window.forumSessaoAtual.user.id;
    }catch(_){ }
    try{
      if(window._supabase?.auth){
        const { data:{ session } } = await window._supabase.auth.getSession();
        return session?.user?.id || '';
      }
    }catch(_){ }
    return localStorage.getItem('id') || '';
  }

  async function abrirMeuPerfil(){
    const id = await usuarioIdAtual();
    if(id) location.href = `/perfil.html?id=${encodeURIComponent(id)}`;
    else {
      try{ localStorage.setItem('fs_destino_apos_login', '/social.html'); }catch(_){ }
      if(typeof abrirModalLogin === 'function') abrirModalLogin();
      else location.href = '/index.html?login=1';
    }
  }

  function adicionarBotaoPerfil(){
    if(document.getElementById('fs-comunidade-meu-perfil')) return;
    const acoes = document.querySelector('.forum-hero-acoes');
    if(!acoes) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'fs-comunidade-meu-perfil';
    btn.className = 'fs-comunidade-perfil-btn';
    btn.textContent = 'Meu perfil';
    btn.addEventListener('click', abrirMeuPerfil);
    acoes.appendChild(btn);
  }

  function instalarModal(){
    const card = envolverFormulario();
    if(!card) return;

    window.forumMostrarFormularioNovoTopico = function(){
      const c = envolverFormulario();
      if(!c) return;
      c.classList.add('ativo');
      c.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('forum-topico-titulo')?.focus(), 120);
    };

    window.forumOcultarFormularioNovoTopico = function(){
      const c = document.getElementById('forum-form-card');
      if(c){
        c.classList.remove('ativo');
        c.style.display = 'none';
      }
      document.body.style.overflow = '';
    };
  }

  function iniciar(){
    if(!ehSocial()) return;
    css();
    instalarModal();
    adicionarBotaoPerfil();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  let tentativas = 0;
  const timer = setInterval(() => {
    iniciar();
    if(++tentativas > 30) clearInterval(timer);
  }, 400);
})();
