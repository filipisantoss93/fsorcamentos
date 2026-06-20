/* FS Orçamentos — garante campos completos no modal da Comunidade */
(function(){
  'use strict';

  function ehSocial(){
    const p = String(location.pathname || '').toLowerCase();
    return p.endsWith('/social.html') || p.endsWith('/forum.html') || p.endsWith('/social') || p.endsWith('/forum');
  }

  function css(){
    if(document.getElementById('fs-forum-comunidade-campos-css')) return;
    const s = document.createElement('style');
    s.id = 'fs-forum-comunidade-campos-css';
    s.textContent = `
      #forum-form-card.fs-comunidade-modal .forum-form,
      #forum-form-card.fs-comunidade-modal #forum-form-topico{
        display:grid!important;gap:12px!important;width:100%!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;overflow:visible!important;
      }
      #forum-form-card.fs-comunidade-modal .forum-form label{
        display:grid!important;gap:6px!important;color:#2f211d!important;font-size:13px!important;font-weight:900!important;visibility:visible!important;opacity:1!important;height:auto!important;overflow:visible!important;
      }
      #forum-form-card.fs-comunidade-modal input,
      #forum-form-card.fs-comunidade-modal select,
      #forum-form-card.fs-comunidade-modal textarea{
        display:block!important;width:100%!important;min-height:42px!important;border:1px solid #d7ccc8!important;border-radius:8px!important;background:#fff!important;color:#2f211d!important;padding:10px!important;font-size:15px!important;font-weight:700!important;visibility:visible!important;opacity:1!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
      }
      #forum-form-card.fs-comunidade-modal textarea{min-height:170px!important;resize:vertical!important;}
      #forum-form-card.fs-comunidade-modal input[type="file"]{padding:9px!important;background:#fffaf0!important;}
      #forum-form-card.fs-comunidade-modal small{display:block!important;color:#6b5b53!important;font-size:11px!important;font-weight:700!important;}
      #forum-form-card.fs-comunidade-modal #forum-preview-fotos{display:flex!important;gap:8px!important;flex-wrap:wrap!important;min-height:0!important;visibility:visible!important;opacity:1!important;}
      #forum-form-card.fs-comunidade-modal #forum-btn-criar{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:44px!important;margin-top:4px!important;visibility:visible!important;opacity:1!important;}
    `;
    document.head.appendChild(s);
  }

  function mostrarCampos(){
    if(!ehSocial()) return;
    const card = document.getElementById('forum-form-card');
    if(!card) return;

    const form = card.querySelector('#forum-form-topico');
    const ids = [
      'forum-form-topico',
      'forum-topico-titulo',
      'forum-topico-categoria',
      'forum-topico-descricao',
      'forum-topico-fotos',
      'forum-preview-fotos',
      'forum-btn-criar'
    ];

    if(form){
      form.style.setProperty('display','grid','important');
      form.style.setProperty('visibility','visible','important');
      form.style.setProperty('opacity','1','important');
    }

    ids.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.style.setProperty('visibility','visible','important');
      el.style.setProperty('opacity','1','important');
      if(id === 'forum-form-topico') el.style.setProperty('display','grid','important');
      else if(id === 'forum-preview-fotos') el.style.setProperty('display','flex','important');
      else if(id === 'forum-btn-criar') el.style.setProperty('display','inline-flex','important');
      else el.style.setProperty('display','block','important');
    });

    card.querySelectorAll('label').forEach(label => {
      label.style.setProperty('display','grid','important');
      label.style.setProperty('visibility','visible','important');
      label.style.setProperty('opacity','1','important');
    });
  }

  function instalar(){
    if(!ehSocial()) return;
    css();
    mostrarCampos();

    const original = window.forumMostrarFormularioNovoTopico;
    if(typeof original === 'function' && !original.__fsCamposFix){
      window.forumMostrarFormularioNovoTopico = function(){
        const r = original.apply(this, arguments);
        setTimeout(mostrarCampos, 40);
        setTimeout(mostrarCampos, 180);
        setTimeout(mostrarCampos, 450);
        return r;
      };
      window.forumMostrarFormularioNovoTopico.__fsCamposFix = true;
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  let n = 0;
  const timer = setInterval(() => {
    instalar();
    if(++n > 40) clearInterval(timer);
  }, 350);
})();
