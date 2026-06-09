/* =========================================================
   FS ORÇAMENTOS - index-dashboard-tag-fix.js
   Remove a tag redundante "Plano Premium ativo" do hero do dashboard.
   A informação do plano já aparece no card da empresa acima.
   ========================================================= */
(function () {
  'use strict';

  function removerTagDashboardOficina() {
    const premium = document.getElementById('home-plano-premium');
    if (!premium) return;

    premium.querySelectorAll('.home-plano-hero .home-plano-tag').forEach((tag) => {
      const texto = String(tag.textContent || '').toLowerCase();
      if (texto.includes('plano premium')) {
        tag.remove();
      }
    });
  }

  function iniciar() {
    removerTagDashboardOficina();
    setTimeout(removerTagDashboardOficina, 300);
    setTimeout(removerTagDashboardOficina, 900);
    setTimeout(removerTagDashboardOficina, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  window.addEventListener('load', iniciar);
})();
