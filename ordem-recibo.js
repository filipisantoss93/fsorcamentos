/* FS Orçamentos — Recibo de Pagamento da OS */
(function(){
  'use strict';

  let ordemRecibo = null;
  let usuarioRecibo = null;

  function obterOrdemId(){
    const p = new URLSearchParams(location.search);
    return p.get('id') || p.get('ordem_id') || p.get('os_id') || localStorage.getItem('ultima_os_aberta_id') || '';
  }

  function moeda(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  function html(v){ return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function dataBR(v){ if(!v) return '-'; const d=new Date(String(v).includes('T')?v:String(v)+'T00:00:00'); return Number.isNaN(d.getTime())?'-':d.toLocaleDateString('pt-BR'); }
  function hojeBR(){ return new Date().toLocaleDateString('pt-BR'); }
  function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
  function texto(id,f=''){ return document.getElementById(id)?.textContent?.trim() || f; }

  async function carregarOrdem(){
    if(!window._supabase && typeof window.inicializarSupabaseFS==='function') window.inicializarSupabaseFS();
    if(!window._supabase) return null;
    const {data:{session}} = await _supabase.auth.getSession();
    if(!session?.user?.id) return null;
    usuarioRecibo = session.user.id;
    const id = obterOrdemId();
    if(!id) return null;
    const {data,error} = await _supabase
      .from('ordens_servico')
      .select('*,clientes(nome,cpf_cnpj,whatsapp,email),veiculos(placa,marca,modelo,ano)')
      .eq('id',id)
      .eq('user_id',session.user.id)
      .maybeSingle();
    if(error){ console.warn('Recibo OS:', error); return null; }
    ordemRecibo = data || null;
    return ordemRecibo;
  }

  function valorTotal(){ return n(ordemRecibo?.valor_total || texto('detalhe-valor-total','0').replace(/[^0-9,.-]/g,'').replace('.','').replace(',','.')); }
  function valorEntrada(){ return n(ordemRecibo?.valor_entrada || ordemRecibo?.entrada || ordemRecibo?.valor_pago || 0); }
  function valorSaldo(){
    const saldoBanco = ordemRecibo?.saldo_restante ?? ordemRecibo?.valor_restante;
    if(saldoBanco !== undefined && saldoBanco !== null) return n(saldoBanco);
    return Math.max(0, valorTotal() - valorEntrada());
  }

  function dadosRecibo(){
    const total = valorTotal();
    const entrada = valorEntrada();
    const saldo = valorSaldo();
    const pago = entrada > 0 ? entrada : total;
    const numero = ordemRecibo?.numero_os ? String(ordemRecibo.numero_os).padStart(6,'0') : ordemRecibo?.id || 'OS';
    const cliente = ordemRecibo?.clientes?.nome || texto('detalhe-cliente-nome','Cliente');
    const doc = ordemRecibo?.clientes?.cpf_cnpj || '';
    const veiculo = [ordemRecibo?.veiculos?.placa, ordemRecibo?.veiculos?.marca, ordemRecibo?.veiculos?.modelo, ordemRecibo?.veiculos?.ano].filter(Boolean).join(' • ') || texto('detalhe-veiculo-placa','Veículo não informado');
    const servico = ordemRecibo?.descricao_servico || ordemRecibo?.titulo || texto('detalhe-descricao-servico','Serviço executado');
    const forma = ordemRecibo?.forma_pagamento || ordemRecibo?.status_pagamento || 'não informado';
    return { total, entrada, saldo, pago, numero, cliente, doc, veiculo, servico, forma };
  }

  function textoRecibo(){
    const d = dadosRecibo();
    return `RECIBO DE PAGAMENTO\n\nRecebemos de ${d.cliente}${d.doc ? ' — documento ' + d.doc : ''}, referente à Ordem de Serviço nº ${d.numero}, o valor de ${moeda(d.pago)}.\n\nServiço/Descrição:\n${d.servico}\n\nVeículo: ${d.veiculo}\nForma de pagamento: ${d.forma}\nValor total da OS: ${moeda(d.total)}\nValor recebido: ${moeda(d.pago)}\nSaldo restante: ${moeda(d.saldo)}\n\nData de emissão: ${hojeBR()}\n\nEste recibo comprova o pagamento informado acima, salvo compensação bancária quando aplicável.`;
  }

  function estilo(){
    if(document.getElementById('fs-ordem-recibo-css')) return;
    const s=document.createElement('style');
    s.id='fs-ordem-recibo-css';
    s.textContent=`
      .fs-recibo-card{margin-top:12px;padding:10px;border:1px solid #e4d8cc;border-radius:8px;background:#fbf8f4;display:grid;gap:8px;}
      .fs-recibo-card strong{color:#2f211d;font-size:13px;}
      .fs-recibo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
      .fs-recibo-box{background:#fff;border:1px solid #e4d8cc;border-radius:6px;padding:8px;}
      .fs-recibo-box span{display:block;color:#62554d;font-size:10px;font-weight:950;text-transform:uppercase;margin-bottom:4px;}
      .fs-recibo-box b{display:block;color:#2f211d;font-size:14px;font-weight:950;}
      .fs-recibo-preview{white-space:pre-wrap;background:#fff;border:1px solid #e4d8cc;border-left:4px solid #ffc400;border-radius:7px;padding:9px;color:#2b211d;font-size:12px;line-height:1.45;max-height:210px;overflow:auto;}
      .fs-recibo-acoes{display:flex;gap:7px;flex-wrap:wrap;}
      .fs-recibo-acoes button{min-height:34px;border-radius:7px;border:1px solid #ffc400;background:#3e2723;color:#ffc400;font-weight:950;padding:8px 11px;cursor:pointer;}
      @media(max-width:640px){.fs-recibo-grid{grid-template-columns:1fr}.fs-recibo-acoes button{width:100%;}}
    `;
    document.head.appendChild(s);
  }

  function encontrarCardPagamento(){
    const candidatos = [...document.querySelectorAll('.card,.os-card,.ordem-card,section,article')];
    return candidatos.find(c => /pagamento|valores|financeiro/i.test(c.textContent || '')) || document.querySelector('main') || document.body;
  }

  function injetar(){
    if(document.getElementById('fs-recibo-os')) return;
    const alvo = encontrarCardPagamento();
    if(!alvo) return;
    const d = dadosRecibo();
    const div=document.createElement('div');
    div.id='fs-recibo-os';
    div.className='fs-recibo-card';
    div.innerHTML=`
      <strong>Recibo de pagamento</strong>
      <div class="fs-recibo-grid">
        <div class="fs-recibo-box"><span>Total da OS</span><b>${html(moeda(d.total))}</b></div>
        <div class="fs-recibo-box"><span>Valor recebido</span><b>${html(moeda(d.pago))}</b></div>
        <div class="fs-recibo-box"><span>Saldo restante</span><b>${html(moeda(d.saldo))}</b></div>
      </div>
      <div id="fs-recibo-preview" class="fs-recibo-preview">${html(textoRecibo())}</div>
      <div class="fs-recibo-acoes"><button type="button" onclick="fsGerarReciboOSPDF()">Baixar recibo PDF</button><button type="button" onclick="fsImprimirReciboOS()">Imprimir recibo</button></div>
    `;
    alvo.appendChild(div);
  }

  function imprimir(){
    const texto = textoRecibo();
    const w=window.open('','_blank');
    if(!w) return alert('Permita pop-ups para imprimir o recibo.');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Recibo de Pagamento</title><style>body{font-family:Arial,sans-serif;color:#000;margin:32px;line-height:1.45}h1{text-align:center;font-size:20px;border-bottom:2px solid #000;padding-bottom:10px}.box{border:1px solid #000;padding:14px;white-space:pre-wrap}.assinatura{margin-top:60px;text-align:center;border-top:1px solid #000;padding-top:8px}</style></head><body><h1>RECIBO DE PAGAMENTO</h1><div class="box">${html(texto)}</div><div class="assinatura">Assinatura / Carimbo</div><script>window.print()<\/script></body></html>`);
    w.document.close();
  }

  function gerarPDF(){
    const texto = textoRecibo();
    if(!window.jspdf || !window.jspdf.jsPDF){ imprimir(); return; }
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=doc.internal.pageSize.getWidth();
    const H=doc.internal.pageSize.getHeight();
    const m=14;
    let y=16;
    doc.setTextColor(0,0,0);
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(0.4);
    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.text('RECIBO DE PAGAMENTO', W/2, y, {align:'center'});
    y+=8;
    doc.line(m,y,W-m,y);
    y+=10;
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    const linhas=doc.splitTextToSize(texto,W-(m*2));
    linhas.forEach(l=>{
      if(y>H-32){doc.addPage();y=16;}
      doc.text(l,m,y);y+=5;
    });
    y=Math.max(y+22,H-34);
    doc.line(55,y,155,y);
    doc.text('Assinatura / Carimbo',W/2,y+5,{align:'center'});
    const numero = ordemRecibo?.numero_os ? String(ordemRecibo.numero_os).padStart(6,'0') : 'os';
    doc.save(`recibo-os-${numero}.pdf`);
  }

  async function iniciar(){
    estilo();
    await carregarOrdem();
    if(ordemRecibo) injetar();
  }

  window.fsGerarReciboOSPDF = gerarPDF;
  window.fsImprimirReciboOS = imprimir;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,1200));
  else setTimeout(iniciar,1200);
})();