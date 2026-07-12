(function(){
  'use strict';

  const path=String(location.pathname||'/').toLowerCase().replace(/\/index\.html$/,'/');
  if(path!=='/'&&path!=='/index') return;

  function criarEstilos(){
    if(document.getElementById('fs-landing-final-css')) return;
    const style=document.createElement('style');
    style.id='fs-landing-final-css';
    style.textContent=`
      .fs-planos-oficiais{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .fs-plano-oficial{position:relative;display:grid;align-content:start;gap:12px;padding:24px;border:1px solid var(--fs-border);border-radius:16px;background:linear-gradient(145deg,var(--fs-card-soft),var(--fs-navy));box-shadow:0 14px 34px rgba(0,0,0,.18)}
      .fs-plano-oficial.destaque{border:2px solid var(--fs-gold);transform:translateY(-4px)}
      .fs-plano-selo{position:absolute;top:-12px;right:16px;padding:6px 10px;border-radius:999px;background:var(--fs-gold);color:#172033;font-size:11px;font-weight:950;text-transform:uppercase}
      .fs-plano-oficial h2{margin:4px 0 0;font-size:25px}.fs-plano-preco{font-size:38px;font-weight:950;letter-spacing:-.04em}.fs-plano-preco small{font-size:13px;color:var(--fs-muted)}
      .fs-plano-oficial ul{display:grid;gap:8px;margin:0;padding:0;list-style:none;color:var(--fs-muted)}.fs-plano-oficial li:before{content:'✓';margin-right:8px;color:var(--fs-success);font-weight:950}
      .fs-plano-oficial .home-btn{margin-top:auto;width:100%;justify-content:center}
      .fs-comparativo{overflow:auto;border:1px solid var(--fs-border);border-radius:14px}.fs-comparativo table{width:100%;min-width:720px;border-collapse:collapse}.fs-comparativo th,.fs-comparativo td{padding:13px;border-bottom:1px solid var(--fs-border);text-align:center}.fs-comparativo th:first-child,.fs-comparativo td:first-child{text-align:left}.fs-comparativo th{background:#10233d;color:var(--fs-text)}
      .fs-faq{display:grid;gap:9px}.fs-faq details{padding:15px 17px;border:1px solid var(--fs-border);border-radius:12px;background:var(--fs-card)}.fs-faq summary{cursor:pointer;font-weight:850;color:var(--fs-text)}.fs-faq p{margin:10px 0 0;color:var(--fs-muted);line-height:1.55}
      .fs-cta-final{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:20px;padding:30px;border:1px solid rgba(246,181,0,.65);border-radius:18px;background:radial-gradient(circle at 90% 20%,rgba(246,181,0,.16),transparent 34%),linear-gradient(135deg,#07111f,#102b4d)}.fs-cta-final h2{margin:0 0 8px;font-size:clamp(26px,4vw,42px)}.fs-cta-final p{margin:0;color:var(--fs-muted);line-height:1.5}.fs-cta-final .hero-actions{margin:0}
      @media(max-width:850px){.fs-planos-oficiais{grid-template-columns:1fr}.fs-plano-oficial.destaque{transform:none}.fs-cta-final{grid-template-columns:1fr}.fs-cta-final .hero-actions{margin-top:10px}}
    `;
    document.head.appendChild(style);
  }

  function montarPlanos(){
    const area=document.querySelector('#home-publica .planos');
    if(!area) return;
    area.className='fs-planos-oficiais';
    area.innerHTML=`
      <article class="fs-plano-oficial">
        <span class="home-tag">Para começar</span><h2>Gratuito</h2><div class="fs-plano-preco">R$ 0</div>
        <ul><li>Gerador de orçamento</li><li>PDF profissional</li><li>5 créditos Efex de boas-vindas</li><li>Sem histórico na nuvem</li></ul>
        <a href="/gerador.html" class="home-btn secondary"><div><strong>Começar grátis</strong><span>Sem cartão de crédito</span></div></a>
      </article>
      <article class="fs-plano-oficial destaque">
        <span class="fs-plano-selo">Melhor custo-benefício</span><span class="home-tag">Para oficinas em crescimento</span><h2>Premium Essencial</h2><div class="fs-plano-preco">R$ 14,90 <small>/ mês</small></div>
        <ul><li>Histórico na nuvem</li><li>Caixa e relatórios</li><li>Aprovação por WhatsApp</li><li>15 créditos Efex por mês</li></ul>
        <a href="/planos.html#essencial" class="home-btn primary"><div><strong>Assinar Essencial</strong><span>Ative por Pix</span></div></a>
      </article>
      <article class="fs-plano-oficial">
        <span class="home-tag">Máximo desempenho</span><h2>Premium PRO</h2><div class="fs-plano-preco">R$ 29,90 <small>/ mês</small></div>
        <ul><li>Tudo do Essencial</li><li>30 créditos Efex por mês</li><li>Prioridade de processamento</li><li>Recursos futuros incluídos</li></ul>
        <a href="/planos.html#pro" class="home-btn premium"><div><strong>Assinar PRO</strong><span>Mais créditos e prioridade</span></div></a>
      </article>`;
  }

  function inserirConversao(){
    const home=document.getElementById('home-publica');
    if(!home||document.getElementById('fs-comparativo-planos')) return;
    const planos=document.querySelector('.fs-planos-oficiais');
    if(!planos) return;

    const comparativo=document.createElement('section');
    comparativo.id='fs-comparativo-planos';
    comparativo.className='section-card';
    comparativo.innerHTML=`<span class="home-tag">Compare os planos</span><h2>Escolha o nível certo para sua oficina</h2><div class="fs-comparativo"><table><thead><tr><th>Recurso</th><th>Gratuito</th><th>Essencial</th><th>PRO</th></tr></thead><tbody><tr><td>Gerador e PDF</td><td>✓</td><td>✓</td><td>✓</td></tr><tr><td>Histórico na nuvem</td><td>—</td><td>✓</td><td>✓</td></tr><tr><td>Caixa e relatórios</td><td>—</td><td>✓</td><td>✓</td></tr><tr><td>Aprovação por WhatsApp</td><td>—</td><td>✓</td><td>✓</td></tr><tr><td>Créditos Efex</td><td>5 iniciais</td><td>15/mês</td><td>30/mês</td></tr><tr><td>Prioridade</td><td>—</td><td>—</td><td>✓</td></tr></tbody></table></div>`;
    planos.insertAdjacentElement('afterend',comparativo);

    const faq=document.createElement('section');
    faq.className='section-card';
    faq.innerHTML=`<span class="home-tag">Dúvidas frequentes</span><h2>Antes de começar</h2><div class="fs-faq"><details><summary>Preciso instalar algum programa?</summary><p>Não. O FS Orçamentos funciona pelo navegador e também pode ser instalado como aplicativo no Android.</p></details><details><summary>O Efex substitui o diagnóstico do técnico?</summary><p>Não. O Efex organiza sintomas, hipóteses e testes para apoiar a decisão técnica. A confirmação do defeito continua sendo responsabilidade do profissional.</p></details><details><summary>Como funciona o pagamento?</summary><p>As assinaturas e os pacotes de créditos são pagos por Pix. Após a confirmação, o sistema aplica o produto automaticamente à conta.</p></details><details><summary>Posso comprar créditos sem assinar um plano?</summary><p>Sim. Os créditos Efex podem ser comprados separadamente e ficam disponíveis na carteira do usuário.</p></details></div>`;
    comparativo.insertAdjacentElement('afterend',faq);

    const cta=document.createElement('section');
    cta.className='fs-cta-final';
    cta.innerHTML=`<div><span class="home-tag">Pronto para usar</span><h2>Profissionalize seus orçamentos hoje.</h2><p>Comece gratuitamente, teste o Efex e evolua para um plano quando sua oficina precisar de histórico, caixa e relatórios.</p></div><div class="hero-actions"><a href="/gerador.html" class="home-btn primary"><div><strong>Criar primeiro orçamento</strong><span>Começar agora</span></div></a><a href="/planos.html" class="home-btn secondary"><div><strong>Ver todos os planos</strong><span>Comparar benefícios</span></div></a></div>`;
    faq.insertAdjacentElement('afterend',cta);
  }

  function ajustarHero(){
    const sub=document.querySelector('#home-publica .hero-sub');
    if(sub) sub.innerHTML='Crie orçamentos profissionais, receba aprovações pelo WhatsApp e use o <strong>Efex</strong> para apoiar diagnósticos e transformar análises em serviços e peças.';
    const tag=document.querySelector('#home-publica .home-hero .home-tag');
    if(tag) tag.textContent='Feito para oficinas automotivas';
  }

  function iniciar(){criarEstilos();ajustarHero();montarPlanos();inserirConversao();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
