(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const dataHora = valor => {
    if(!valor) return '—';
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
  };
  const escapar = valor => String(valor ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const normalizar = valor => String(valor || '').toLowerCase().trim();

  function injetarEstilos(){
    if($('fs-minha-conta-extra-css')) return;
    const style=document.createElement('style');
    style.id='fs-minha-conta-extra-css';
    style.textContent=`
      .fs-conta-atalhos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .fs-conta-atalho{display:grid;gap:5px;min-height:110px;padding:17px;border:1px solid var(--fs-borda,#DCE7F3);border-radius:17px;background:linear-gradient(145deg,#fff,#f4f8fc);color:var(--fs-azul-escuro,#07111F);text-decoration:none;box-shadow:0 12px 28px rgba(7,17,31,.06)}
      .fs-conta-atalho:hover{transform:translateY(-2px);border-color:#9ac7f5}
      .fs-conta-atalho b{font-size:17px}.fs-conta-atalho span{color:#5b6b7d;font-size:13px;line-height:1.4}.fs-conta-atalho i{font-style:normal;font-size:25px}
      .fs-conta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .fs-conta-compra{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid var(--fs-borda,#DCE7F3)}
      .fs-conta-compra:last-child{border-bottom:0}.fs-conta-compra strong{display:block;color:var(--fs-azul-escuro,#07111F)}.fs-conta-compra small{display:block;margin-top:3px;color:#64748b}.fs-conta-compra-valor{text-align:right;font-weight:950}.fs-conta-status{display:inline-flex;margin-top:4px;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:950;text-transform:uppercase;background:#f1f5f9;color:#475569}.fs-conta-status.pago,.fs-conta-status.confirmado,.fs-conta-status.paid{background:#ecfdf3;color:#087443}.fs-conta-status.pendente{background:#fff7d6;color:#7a5600}.fs-admin-card{border-color:#f6b500!important;background:linear-gradient(145deg,#fffdf4,#fff)!important}.fs-admin-acoes{display:flex;gap:10px;flex-wrap:wrap}.fs-admin-acoes a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 14px;border-radius:12px;background:#07111f;color:#fff;text-decoration:none;font-weight:900}.fs-conta-vazio{padding:14px;border:1px dashed #bfd0e2;border-radius:14px;color:#64748b;text-align:center;font-weight:750}
      @media(max-width:860px){.fs-conta-atalhos{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.fs-conta-atalhos,.fs-conta-grid{grid-template-columns:1fr}.fs-conta-compra{grid-template-columns:1fr}.fs-conta-compra-valor{text-align:left}}
    `;
    document.head.appendChild(style);
  }

  function criarSecao(classe,titulo,html){
    const sec=document.createElement('section');
    sec.className=`painel-card ${classe || ''}`.trim();
    sec.innerHTML=`<h2>${titulo}</h2>${html}`;
    return sec;
  }

  function nomeProduto(compra){
    const codigo=normalizar(compra?.produto_codigo);
    if(codigo==='assinatura_essencial') return 'Premium Essencial';
    if(codigo==='assinatura_pro') return 'Premium PRO';
    if(codigo.startsWith('creditos_')) return `${Number(compra.creditos || codigo.replace('creditos_','')) || ''} créditos Efex`;
    if(normalizar(compra?.produto_tipo)==='assinatura') return compra?.plano ? `Assinatura ${compra.plano}` : 'Assinatura FS Orçamentos';
    return 'Pagamento FS Orçamentos';
  }

  function renderCompras(compras){
    if(!Array.isArray(compras) || !compras.length) return '<div class="fs-conta-vazio">Nenhuma compra ou renovação registrada até o momento.</div>';
    return compras.map(c=>{
      const st=normalizar(c.status || 'pendente');
      return `<div class="fs-conta-compra"><div><strong>${escapar(nomeProduto(c))}</strong><small>${escapar(dataHora(c.pago_em || c.criado_em))}</small><span class="fs-conta-status ${escapar(st)}">${escapar(c.status || 'pendente')}</span></div><div class="fs-conta-compra-valor">${moeda(c.valor)}</div></div>`;
    }).join('');
  }

  async function carregar(){
    if(!window._supabase) return;
    const { data:{ session } } = await _supabase.auth.getSession();
    if(!session?.user?.id) return;

    injetarEstilos();
    const main=document.querySelector('.painel-container-simples');
    if(!main || $('fs-conta-resumo')) return;

    const hero=main.querySelector('.painel-header-simples');
    const atalhos=criarSecao('','Acessos rápidos',`
      <div id="fs-conta-resumo" class="fs-conta-atalhos">
        <a class="fs-conta-atalho" href="/carteira.html"><i>✦</i><b>Carteira Efex</b><span>Saldo, créditos, compras e extrato.</span></a>
        <a class="fs-conta-atalho" href="/orcamentos.html"><i>🧾</i><b>Orçamentos</b><span>Histórico, aprovações e links públicos.</span></a>
        <a class="fs-conta-atalho" href="/dashboard.html"><i>📊</i><b>Relatórios</b><span>Conversão, ticket médio e desempenho.</span></a>
        <a class="fs-conta-atalho" href="/fluxo-caixa.html"><i>💰</i><b>Caixa</b><span>Entradas, saídas e saldo da oficina.</span></a>
      </div>`);
    hero?.insertAdjacentElement('afterend',atalhos);

    const provider=(session.user.app_metadata?.provider || session.user.app_metadata?.providers?.[0] || 'email');
    const seguranca=criarSecao('','Conta e segurança',`
      <div class="fs-conta-grid">
        <div class="info-card"><strong>E-mail de acesso</strong><span>${escapar(session.user.email || '—')}</span></div>
        <div class="info-card"><strong>Método de entrada</strong><span>${provider==='google'?'Conta Google':'E-mail e senha'}</span></div>
        <div class="info-card"><strong>Conta criada em</strong><span>${escapar(dataHora(session.user.created_at))}</span></div>
        <div class="info-card"><strong>Último acesso</strong><span>${escapar(dataHora(session.user.last_sign_in_at))}</span></div>
      </div>`);
    const empresa=Array.from(main.querySelectorAll('.painel-card')).find(s=>s.querySelector('h2')?.textContent.includes('Dados da empresa'));
    empresa?.insertAdjacentElement('afterend',seguranca);

    const historico=criarSecao('','Histórico financeiro',`<div id="fs-compras-recentes"><div class="fs-conta-vazio">Carregando compras recentes...</div></div><div class="acoes-painel"><a class="btn-editar-perfil" href="/carteira.html">Abrir carteira e extrato</a></div>`);
    const assinatura=$('renovar-plano-pix-painel');
    assinatura?.insertAdjacentElement('beforebegin',historico);

    try{
      const { data, error } = await _supabase.rpc('fs_minha_conta_resumo');
      if(error) throw error;
      $('fs-compras-recentes').innerHTML=renderCompras(data?.compras_recentes || []);
      if(data?.admin?.eh_admin){
        const admin=criarSecao('fs-admin-card','Administração FS',`<p class="painel-pix-intro">Acesso interno autorizado como <strong>${escapar(data.admin.papel || 'admin')}</strong>.</p><div class="fs-admin-acoes"><a href="/admin-financeiro.html">Dashboard financeiro</a></div>`);
        historico.insertAdjacentElement('afterend',admin);
      }
    }catch(err){
      console.warn('Não foi possível carregar o resumo da conta:',err);
      $('fs-compras-recentes').innerHTML='<div class="fs-conta-vazio">Não foi possível carregar o histórico financeiro agora.</div>';
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(carregar,120));
  else setTimeout(carregar,120);
})();
