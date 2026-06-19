/* FS Orçamentos — PDF da OS com fotos antes/depois */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const txt=(id,f='-')=>($(id)?.textContent||'').trim()||f;
  const val=(id,f='')=>($(id)?.value||'').trim()||f;
  const osId=()=>new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('ordem_id')||new URLSearchParams(location.search).get('os_id')||localStorage.getItem('ultima_os_aberta_id')||'';
  const keyExtras=()=>`fs_ordem_extras_${osId()}`;
  const keyDepois=()=>`fs_os_fotos_depois_${osId()}`;

  function json(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))||f}catch(_){return f}}
  function fotoSrc(f){return typeof f==='string'?f:(f?.dataUrl||f?.url||f?.src||'')}
  function normFotos(lista){return Array.isArray(lista)?lista.map(f=>({src:fotoSrc(f),nome:f?.nome||f?.name||'foto.jpg'})).filter(f=>String(f.src).startsWith('data:image')).slice(0,5):[]}
  function tipo(src){return String(src).startsWith('data:image/png')?'PNG':'JPEG'}
  function nomeArquivo(v){return String(v||'ordem-servico').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'ordem-servico'}

  async function userId(){
    try{
      if(!window._supabase&&window.inicializarSupabaseFS)window.inicializarSupabaseFS();
      if(!window._supabase)return '';
      const r=await _supabase.auth.getSession();
      return r.data.session?.user?.id||'';
    }catch(_){return ''}
  }

  async function carregarExtras(){
    const local=json(keyExtras(),{}), localDepois=json(keyDepois(),[]);
    let remoto=null;
    const uid=await userId();
    if(uid&&osId()&&window._supabase){
      try{
        const r=await _supabase.from('ordens_servico').select('fotos_antes,fotos_depois,assinatura_cliente_data_url,assinatura_cliente_nome').eq('id',osId()).eq('user_id',uid).maybeSingle();
        if(!r.error)remoto=r.data;
      }catch(_){ }
    }
    let canvasAss='';
    try{const c=$('canvas-assinatura-cliente');if(c)canvasAss=c.toDataURL('image/png')}catch(_){ }
    const preview=$('assinatura-cliente-preview')?.src||'';
    return{
      antes:normFotos(remoto?.fotos_antes).length?normFotos(remoto?.fotos_antes):normFotos(local.fotos_antes),
      depois:normFotos(remoto?.fotos_depois).length?normFotos(remoto?.fotos_depois):normFotos(localDepois),
      assinatura:remoto?.assinatura_cliente_data_url||local.assinatura_cliente_data_url||(preview.startsWith('data:image')?preview:'')||(canvasAss.startsWith('data:image')?canvasAss:''),
      nome:remoto?.assinatura_cliente_nome||local.assinatura_cliente_nome||val('assinatura-cliente-nome',txt('detalhe-cliente-nome','Cliente'))
    };
  }

  function msg(t,tp='info'){
    if(window.mostrarMensagemOrdem)return window.mostrarMensagemOrdem(t,tp);
    const e=$('mensagem-ordem');if(e){e.className='mensagem-ordem '+tp;e.textContent=t}
  }

  function itensTela(){
    const arr=[];
    document.querySelectorAll('#lista-itens-ordem .item-ordem-card,#lista-itens-ordem .ordem-item,#lista-itens-ordem article,#lista-itens-ordem .card').forEach(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(t&&!/nenhum item/i.test(t))arr.push(t);
    });
    return arr.slice(0,18);
  }

  async function gerar(){
    if(!window.jspdf?.jsPDF)return alert('Biblioteca jsPDF não carregada.');
    const btn=$('btn-pdf-ordem'), old=btn?.textContent||'Gerar PDF';
    try{
      if(btn){btn.disabled=true;btn.textContent='Gerando PDF...'}
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const ex=await carregarExtras();
      const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(), m=12, usable=W-m*2;
      let y=m;
      const page=n=>{if(y+n<=H-16)return;footer();doc.addPage();y=15;bar()};
      const footer=()=>{doc.setFontSize(7);doc.setTextColor(90);doc.text('Gerado pelo FS Orçamentos',m,H-8);doc.text(String(doc.internal.getNumberOfPages()),W-m,H-8,{align:'right'})};
      const bar=()=>{doc.setFillColor(0);doc.rect(0,0,W,8,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('FS Orçamentos • Ordem de Serviço',m,5.5);doc.setTextColor(0)};
      const sec=t=>{page(14);doc.setFillColor(0);doc.roundedRect(m,y,usable,8,2,2,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(t,m+3,y+5.5);doc.setTextColor(0);y+=12};
      const info=cols=>{const gap=3,cw=(usable-gap*(cols.length-1))/cols.length,h=18;page(h+4);cols.forEach((it,i)=>{const x=m+i*(cw+gap);doc.setDrawColor(170);doc.roundedRect(x,y,cw,h,2,2,'S');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(80);doc.text(it.r,x+2.5,y+5);doc.setFontSize(8.3);doc.setTextColor(0);doc.text(doc.splitTextToSize(String(it.v||'-'),cw-5),x+2.5,y+10)});y+=h+4};
      const bloco=(r,v,min=14)=>{const linhas=doc.splitTextToSize(String(v||'-'),usable-8),h=Math.max(min,9+linhas.length*4.2);page(h+4);doc.setDrawColor(160);doc.roundedRect(m,y,usable,h,2,2,'S');doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(80);doc.text(r,m+3,y+5);doc.setFont('helvetica','normal');doc.setFontSize(8.8);doc.setTextColor(0);doc.text(linhas,m+3,y+10);y+=h+4};
      const galeria=(titulo,fotos)=>{if(!fotos.length)return;sec(titulo);const iw=(usable-6)/2,ih=58;fotos.forEach((f,i)=>{if(i%2===0)page(ih+16);const x=m+(i%2)*(iw+6);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(70);doc.text('Foto '+(i+1),x,y);try{doc.addImage(f.src,tipo(f.src),x,y+3,iw,ih)}catch(e){console.warn(e)}if(i%2===1||i===fotos.length-1)y+=ih+10})};

      doc.setFillColor(0);doc.roundedRect(m,y,usable,28,3,3,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('ORDEM DE SERVIÇO',m+4,y+10);doc.setFontSize(10);doc.text(txt('detalhe-numero-os','OS Nº 000000'),m+4,y+18);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(new Date().toLocaleDateString('pt-BR'),W-m-4,y+10,{align:'right'});doc.setTextColor(0);y+=34;
      sec('DADOS PRINCIPAIS');
      info([{r:'Cliente',v:txt('detalhe-cliente-nome')},{r:'WhatsApp',v:txt('detalhe-cliente-whatsapp')}]);
      info([{r:'Status',v:txt('detalhe-status-os')},{r:'Pagamento',v:txt('detalhe-status-pagamento-os')},{r:'Responsável',v:txt('detalhe-responsavel-os')}]);
      info([{r:'Abertura',v:txt('detalhe-data-abertura-os')},{r:'Previsão',v:txt('detalhe-data-prevista-os')},{r:'Conclusão',v:txt('detalhe-data-conclusao-os')}]);
      sec('VEÍCULO');
      info([{r:'Placa',v:txt('detalhe-veiculo-placa')},{r:'Marca',v:txt('detalhe-veiculo-marca')},{r:'Modelo',v:txt('detalhe-veiculo-modelo')}]);
      sec('SOLICITAÇÃO E SERVIÇO');
      bloco('Solicitação / problema',txt('detalhe-descricao-problema','Não informado.'));
      bloco('Serviço a executar',txt('detalhe-descricao-servico','Não informado.'));
      sec('ITENS / SERVIÇOS / PEÇAS');
      const itens=itensTela(); if(itens.length)itens.forEach((it,i)=>bloco('Item '+(i+1),it,12)); else bloco('Itens','Nenhum item detalhado encontrado na tela.');
      sec('VALORES E PAGAMENTO');
      info([{r:'Mão de obra',v:txt('detalhe-valor-mao-obra')},{r:'Materiais/peças',v:txt('detalhe-valor-materiais')},{r:'Desconto',v:txt('detalhe-desconto')}]);
      info([{r:'Valor pago',v:txt('detalhe-valor-pago')},{r:'Saldo restante',v:txt('detalhe-saldo-restante')},{r:'Forma',v:txt('detalhe-forma-pagamento')}]);
      doc.setFillColor(0);doc.roundedRect(m,y,usable,16,3,3,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('TOTAL DA OS',m+4,y+10);doc.setFontSize(15);doc.text(txt('detalhe-valor-total','R$ 0,00'),W-m-4,y+10,{align:'right'});doc.setTextColor(0);y+=22;
      sec('GARANTIA');
      info([{r:'Garantia',v:txt('detalhe-garantia-dias')},{r:'Validade',v:txt('detalhe-garantia-validade')}]);
      bloco('Observações da garantia',txt('detalhe-garantia-observacoes','Nenhuma observação.'));
      galeria('FOTOS ANTES DO SERVIÇO',ex.antes);
      galeria('FOTOS DEPOIS DO SERVIÇO',ex.depois);
      sec('ASSINATURAS');
      page(55);const aw=(usable-12)/2,ay=y;doc.setDrawColor(110);doc.roundedRect(m,ay,aw,36,2,2,'S');doc.roundedRect(m+aw+12,ay,aw,36,2,2,'S');if(ex.assinatura?.startsWith('data:image')){try{doc.addImage(ex.assinatura,tipo(ex.assinatura),m+4,ay+4,aw-8,22)}catch(_){ }}doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('Assinatura do cliente',m+aw/2,ay+30,{align:'center'});doc.text('Assinatura do consultor técnico',m+aw+12+aw/2,ay+30,{align:'center'});doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(80);doc.text(ex.nome||txt('detalhe-cliente-nome','Cliente'),m+aw/2,ay+34,{align:'center'});doc.text(txt('detalhe-responsavel-os','Consultor Técnico'),m+aw+12+aw/2,ay+34,{align:'center'});y+=44;
      footer();
      doc.save(nomeArquivo(txt('detalhe-numero-os','ordem-servico'))+'.pdf');
      msg('PDF da OS gerado com fotos antes/depois e assinatura.','sucesso');
    }catch(e){console.error(e);msg('Não foi possível gerar o PDF com fotos antes/depois.','erro')}
    finally{if(btn){btn.disabled=false;btn.textContent=old}}
  }

  function instalar(){
    const btn=$('btn-pdf-ordem');
    if(!btn||btn.dataset.fsPdfFotosDepois==='1')return;
    btn.dataset.fsPdfFotosDepois='1';
    btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();gerar()},true);
  }

  window.gerarPDFOrdemFotosDepois=gerar;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{instalar();setTimeout(instalar,500);setTimeout(instalar,1500)});else{instalar();setTimeout(instalar,500);setTimeout(instalar,1500)}
})();