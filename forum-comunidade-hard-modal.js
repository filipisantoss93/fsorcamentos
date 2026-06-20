/* FS Orçamentos — modal robusto de publicação da comunidade */
(function(){
  'use strict';

  function ehSocial(){
    const p = String(location.pathname || '').toLowerCase();
    return p.endsWith('/social.html') || p.endsWith('/forum.html') || p.endsWith('/social') || p.endsWith('/forum');
  }

  function css(){
    if(document.getElementById('fs-forum-hard-modal-css')) return;
    const s = document.createElement('style');
    s.id = 'fs-forum-hard-modal-css';
    s.textContent = `
      #fs-comunidade-publicar-modal{position:fixed!important;inset:0!important;z-index:2147483000!important;display:none!important;align-items:center!important;justify-content:center!important;background:rgba(47,33,29,.68)!important;padding:14px!important;overflow:auto!important;}
      #fs-comunidade-publicar-modal.ativo{display:flex!important;}
      .fs-hard-modal-painel{width:min(760px,100%)!important;max-height:min(90vh,820px)!important;overflow:auto!important;background:#fffaf0!important;border:1px solid #e4d8cc!important;border-radius:14px!important;box-shadow:0 24px 70px rgba(0,0,0,.32)!important;padding:14px!important;color:#2f211d!important;}
      .fs-hard-modal-topo{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;position:sticky!important;top:-14px!important;background:#fffaf0!important;z-index:2!important;padding:4px 0 12px!important;border-bottom:1px solid #eadfd4!important;margin-bottom:12px!important;}
      .fs-hard-modal-topo h2{margin:0!important;color:#2f211d!important;font-size:22px!important;font-weight:950!important;}
      .fs-hard-modal-topo p{margin:4px 0 0!important;color:#6b5b53!important;font-size:12px!important;font-weight:700!important;line-height:1.35!important;}
      .fs-hard-modal-fechar{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:38px!important;height:38px!important;border-radius:10px!important;border:1px solid #d7ccc8!important;background:#fff!important;color:#3e2723!important;font-size:24px!important;font-weight:950!important;cursor:pointer!important;}
      #fs-hard-modal-corpo #forum-form-topico{display:grid!important;gap:12px!important;width:100%!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;overflow:visible!important;}
      #fs-hard-modal-corpo label{display:grid!important;gap:6px!important;color:#2f211d!important;font-size:13px!important;font-weight:900!important;visibility:visible!important;opacity:1!important;}
      #fs-hard-modal-corpo input,#fs-hard-modal-corpo select,#fs-hard-modal-corpo textarea{display:block!important;width:100%!important;min-height:42px!important;border:1px solid #d7ccc8!important;border-radius:8px!important;background:#fff!important;color:#2f211d!important;padding:10px!important;font-size:15px!important;font-weight:700!important;visibility:visible!important;opacity:1!important;position:relative!important;}
      #fs-hard-modal-corpo textarea{min-height:170px!important;resize:vertical!important;}
      #fs-hard-modal-corpo input[type="file"]{padding:9px!important;background:#fffaf0!important;}
      #fs-hard-modal-corpo small{display:block!important;color:#6b5b53!important;font-size:11px!important;font-weight:700!important;}
      #fs-hard-modal-corpo #forum-preview-fotos{display:flex!important;gap:8px!important;flex-wrap:wrap!important;visibility:visible!important;opacity:1!important;}
      #fs-hard-modal-corpo #forum-btn-criar{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:46px!important;margin-top:4px!important;visibility:visible!important;opacity:1!important;}
      #forum-form-card{display:none!important;}
      @media(max-width:640px){#fs-comunidade-publicar-modal{align-items:flex-start!important;padding:10px!important}.fs-hard-modal-painel{max-height:calc(100vh - 20px)!important;border-radius:12px!important;padding:12px!important}.fs-hard-modal-topo h2{font-size:20px!important}}
    `;
    document.head.appendChild(s);
  }

  function garantirModal(){
    let modal = document.getElementById('fs-comunidade-publicar-modal');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'fs-comunidade-publicar-modal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = '<div class="fs-hard-modal-painel"><div class="fs-hard-modal-topo"><div><h2>Criar publicação</h2><p>Compartilhe uma dúvida ou experiência profissional. Evite expor dados pessoais de clientes.</p></div><button type="button" class="fs-hard-modal-fechar" aria-label="Fechar">×</button></div><div id="fs-hard-modal-corpo"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(event){ if(event.target === modal) fechar(); });
    modal.querySelector('.fs-hard-modal-fechar')?.addEventListener('click', fechar);
    document.addEventListener('keydown', function(event){ if(event.key === 'Escape' && modal.classList.contains('ativo')) fechar(); });
    return modal;
  }

  function obterForm(){
    return document.getElementById('forum-form-topico');
  }

  function moverFormParaModal(){
    const modal = garantirModal();
    const corpo = document.getElementById('fs-hard-modal-corpo');
    const form = obterForm();
    if(!corpo || !form) return false;
    if(form.parentElement !== corpo) corpo.appendChild(form);
    try{ if(typeof window.forumPreencherCategorias === 'function') window.forumPreencherCategorias(); }catch(_){ }
    return true;
  }

  function mostrarCampos(){
    const corpo = document.getElementById('fs-hard-modal-corpo');
    if(!corpo) return;
    corpo.querySelectorAll('form,label,input,select,textarea,small,button,#forum-preview-fotos').forEach(function(el){
      el.style.setProperty('visibility','visible','important');
      el.style.setProperty('opacity','1','important');
    });
    const form = document.getElementById('forum-form-topico');
    if(form) form.style.setProperty('display','grid','important');
  }

  function abrir(){
    css();
    const modal = garantirModal();
    if(!moverFormParaModal()) return;
    mostrarCampos();
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){
      mostrarCampos();
      document.getElementById('forum-topico-titulo')?.focus();
    },120);
  }

  function fechar(){
    const modal = document.getElementById('fs-comunidade-publicar-modal');
    if(modal){
      modal.classList.remove('ativo');
      modal.setAttribute('aria-hidden','true');
    }
    document.body.style.overflow = '';
  }

  function instalar(){
    if(!ehSocial()) return;
    css();
    garantirModal();
    if(document.getElementById('forum-form-topico')) moverFormParaModal();
    if(!window.forumMostrarFormularioNovoTopico || !window.forumMostrarFormularioNovoTopico.__fsHardModal){
      abrir.__fsHardModal = true;
      window.forumMostrarFormularioNovoTopico = abrir;
    }
    window.forumOcultarFormularioNovoTopico = fechar;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();
  window.addEventListener('load', function(){ setTimeout(instalar,100); setTimeout(instalar,700); });

  let n = 0;
  const t = setInterval(function(){
    instalar();
    if(++n > 120) clearInterval(t);
  },250);
})();
