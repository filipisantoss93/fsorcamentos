(function(){
  'use strict';

  const URL_OFICIAL = String(window.FS_URL_OFICIAL || location.origin).replace(/\/$/, '');
  const TOKEN_RE = /^[a-f0-9]{48}$/i;

  function texto(valor){ return String(valor ?? ''); }
  function escapar(valor){ return texto(valor).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function dataHora(valor){
    if(!valor) return 'Não definida';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 'Não definida' : data.toLocaleString('pt-BR');
  }
  function obterOrcamento(id){ return orcamentosCache.find(item => String(item.id) === String(id)); }
  function linkSeguro(o){
    const token = texto(o?.public_token).trim();
    return TOKEN_RE.test(token) ? `${URL_OFICIAL}/ver.html?token=${encodeURIComponent(token.toLowerCase())}` : '';
  }
  function linkAtivo(o){
    const expira = o?.public_link_expira_em ? new Date(o.public_link_expira_em).getTime() : 0;
    return !!linkSeguro(o) && !o?.public_link_revogado_em && (!expira || expira >= Date.now());
  }
  function statusLink(o){
    if(o?.public_link_revogado_em) return {classe:'red', texto:'Revogado'};
    if(o?.public_link_expira_em && new Date(o.public_link_expira_em).getTime() < Date.now()) return {classe:'red', texto:'Expirado'};
    if(linkSeguro(o)) return {classe:'ok', texto:'Ativo'};
    return {classe:'gold', texto:'Não gerado'};
  }
  async function copiarSeguro(valor){
    if(!valor) return alert('Este orçamento ainda não possui um link público ativo. Gere um novo link.');
    try { await navigator.clipboard.writeText(valor); alert('Link seguro copiado.'); }
    catch (_) { prompt('Copie o link:', valor); }
  }
  async function renovarLink(id, diasRecebidos){
    const dias = Number(diasRecebidos || prompt('Validade do novo link em dias (1 a 365):', '90'));
    if(!Number.isInteger(dias) || dias < 1 || dias > 365) return alert('Informe uma validade entre 1 e 365 dias.');
    if(!confirm(`Gerar um novo link válido por ${dias} dias? O link anterior deixará de funcionar.`)) return;
    const { data, error } = await _supabase.rpc('fs_renovar_link_orcamento',{p_orcamento_id:id,p_dias:dias});
    if(error || !data?.sucesso) return alert(data?.mensagem || error?.message || 'Não foi possível gerar o novo link.');
    await carregarOrcamentosPremium();
    const novo = `${URL_OFICIAL}/ver.html?token=${encodeURIComponent(data.public_token)}`;
    await copiarSeguro(novo);
    fecharModalOrcamento();
  }
  async function revogarLink(id){
    if(!confirm('Revogar este link público? O cliente não conseguirá mais abrir ou responder por ele.')) return;
    const { data, error } = await _supabase.rpc('fs_revogar_link_orcamento',{p_orcamento_id:id});
    if(error || !data?.sucesso) return alert(data?.mensagem || error?.message || 'Não foi possível revogar o link.');
    await carregarOrcamentosPremium();
    alert('Link revogado com sucesso.');
    fecharModalOrcamento();
  }

  function renderTabelaSegura(){
    const lista = filtrados();
    renderResumo(lista);
    const box = document.getElementById('lista-orcamentos');
    if(!box) return;
    if(!lista.length){ box.innerHTML='<div class="empty">Nenhum orçamento encontrado.</div>'; return; }
    box.innerHTML=`<table class="table"><thead><tr><th>Data</th><th>Cliente</th><th>Título</th><th>Status</th><th>Link</th><th>Pagamento</th><th>Total</th><th>Ações</th></tr></thead><tbody>${lista.map(o=>{
      const link=linkSeguro(o), st=statusOrc(o), pago=orcamentoPago(o), aprovado=st==='aprovado', sl=statusLink(o);
      return `<tr><td>${dbr(o.criado_em||o.created_at)}</td><td>${h(o.cliente_nome||'-')}</td><td>${h(o.titulo||o.assunto||'-')}</td><td><span class="status ${h(st)}">${h(o.status||'pendente')}</span></td><td><span class="payment-badge ${sl.classe}">${sl.texto}</span><br><small>${escapar(dataHora(o.public_link_expira_em))}</small></td><td>${aprovado?(pago?'<span class="payment-badge pago">Pago</span>':'<span class="payment-badge pendente">Pagamento pendente</span>'):'-'}</td><td><strong>${m(o.total)}</strong></td><td><div class="acoes"><button class="btn" onclick="abrirModalVisualizar('${escapar(o.id)}')">Ver</button><button class="btn" onclick="editarOrcamento('${escapar(o.id)}')">Editar</button><button class="btn" onclick="duplicarOrcamento('${escapar(o.id)}')">Duplicar</button>${linkAtivo(o)?`<button class="btn ok" onclick="enviarWhatsapp('${escapar(o.id)}')">WhatsApp</button><button class="btn" onclick="copiar('${escapar(link)}')">Copiar link</button><button class="btn red" onclick="fsRevogarLinkOrcamento('${escapar(o.id)}')">Revogar</button>`:`<button class="btn gold" onclick="fsRenovarLinkOrcamento('${escapar(o.id)}',90)">Gerar link</button>`}${aprovado&&!pago?`<button class="btn gold" onclick="marcarComoPago('${escapar(o.id)}')">Marcar pago</button>`:aprovado&&pago?'<button class="btn ok" disabled>Já no caixa</button>':''}</div></td></tr>`;
    }).join('')}</tbody></table>`;
  }

  function abrirModalSeguro(id){
    const o=obterOrcamento(id); if(!o) return;
    const link=linkSeguro(o), st=statusOrc(o), pago=orcamentoPago(o), sl=statusLink(o);
    document.getElementById('modal-orcamento').classList.add('ativo');
    document.getElementById('modal-orcamento-titulo').textContent=o.titulo||o.assunto||'Orçamento';
    document.getElementById('modal-orcamento-subtitulo').textContent=(o.cliente_nome||'Cliente')+' • '+m(o.total);
    const itens=splitItens(o);
    document.getElementById('modal-orcamento-body').innerHTML=`${st==='aprovado'&&!pago?'<div class="hint">Pagamento pendente: este valor ainda não entrou no caixa.</div>':''}<p><strong>Status:</strong> ${escapar(o.status||'pendente')}</p><p><strong>Pagamento:</strong> ${st==='aprovado'?(pago?'Pago e registrado no caixa':'Pendente'):'-'}</p>${tabela('Mão de obra',itens.mao)}${tabela('Itens / produtos',itens.prod)}<h2 style="text-align:right">Total: ${m(o.total)}</h2><div class="hint"><strong>Link público:</strong> ${sl.texto}<br><strong>Validade:</strong> ${escapar(dataHora(o.public_link_expira_em))}${o.public_link_revogado_em?`<br><strong>Revogado em:</strong> ${escapar(dataHora(o.public_link_revogado_em))}`:''}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="editarOrcamento('${escapar(o.id)}')">Editar</button><button class="btn" onclick="duplicarOrcamento('${escapar(o.id)}')">Duplicar</button>${linkAtivo(o)?`<a class="btn" href="${escapar(link)}" target="_blank" rel="noopener">Abrir link</a><button class="btn ok" onclick="enviarWhatsapp('${escapar(o.id)}')">Enviar WhatsApp</button><button class="btn" onclick="copiar('${escapar(link)}')">Copiar link</button><button class="btn red" onclick="fsRevogarLinkOrcamento('${escapar(o.id)}')">Revogar link</button>`:''}<button class="btn gold" onclick="fsRenovarLinkOrcamento('${escapar(o.id)}')">${linkAtivo(o)?'Trocar link':'Gerar novo link'}</button>${st==='aprovado'&&!pago?`<button class="btn gold" onclick="marcarComoPago('${escapar(o.id)}')">Marcar como pago</button>`:''}</div>`;
  }

  function enviarWhatsappSeguro(id){
    const o=obterOrcamento(id); if(!o) return;
    const link=linkSeguro(o);
    if(!linkAtivo(o)) return alert('Gere um link público ativo antes de enviar pelo WhatsApp.');
    const telefone=texto(o.cliente_whatsapp).replace(/\D/g,'');
    if(!telefone) return alert('Este orçamento não tem WhatsApp do cliente.');
    const numero=telefone.startsWith('55')?telefone:'55'+telefone;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(`Olá ${o.cliente_nome||''}, segue seu orçamento: ${link}\n\nVocê pode aprovar ou recusar pelo link.`)}`,'_blank','noopener');
  }

  function instalar(){
    if(!window._supabase || typeof orcamentosCache === 'undefined' || typeof filtrados !== 'function') {
      setTimeout(instalar, 120);
      return;
    }
    linkOrcamento = linkSeguro;
    copiar = copiarSeguro;
    renderizarTabelaOrcamentos = renderTabelaSegura;
    abrirModalVisualizar = abrirModalSeguro;
    enviarWhatsapp = enviarWhatsappSeguro;
    window.linkOrcamento = linkSeguro;
    window.copiar = copiarSeguro;
    window.renderizarTabelaOrcamentos = renderTabelaSegura;
    window.abrirModalVisualizar = abrirModalSeguro;
    window.enviarWhatsapp = enviarWhatsappSeguro;
    window.fsRenovarLinkOrcamento = renovarLink;
    window.fsRevogarLinkOrcamento = revogarLink;
    renderTabelaSegura();
  }

  instalar();
})();