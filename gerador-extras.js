(function(){
  'use strict';

  if(window.fsGeradorExtrasInicializado)return;
  window.fsGeradorExtrasInicializado=true;

  const CONFIG={
    'CPF/CNPJ':{icon:'▣',placeholder:'Digite o CPF ou CNPJ'},
    'Endereço':{icon:'📍',placeholder:'Ex.: Rua das Flores, 123'},
    'E-mail':{icon:'✉',placeholder:'Ex.: cliente@email.com'},
    'Telefone':{icon:'☎',placeholder:'Ex.: (11) 99999-9999'},
    'Data de Nascimento':{icon:'📅',placeholder:'Ex.: 25/05/1990'},
    'Empresa':{icon:'▦',placeholder:'Ex.: Nome da empresa'},
    'Outros':{icon:'•••',placeholder:'Ex.: Observações'}
  };

  const escapar=v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const atualizarPreview=()=>{if(typeof window.autoUpdatePreview==='function')window.autoUpdatePreview()};

  function normalizarTipo(valor){
    const t=String(valor||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    if(t.includes('cpf')||t.includes('cnpj')||t.includes('documento')||t.includes('placa'))return'CPF/CNPJ';
    if(t.includes('endere')||t.includes('rua')||t.includes('cep'))return'Endereço';
    if(t.includes('mail'))return'E-mail';
    if(t.includes('tel')||t.includes('whats'))return'Telefone';
    if(t.includes('nascimento')||t.includes('data'))return'Data de Nascimento';
    if(t.includes('empresa'))return'Empresa';
    return CONFIG[valor]?valor:'Outros';
  }

  function garantirEstilo(){
    if(document.getElementById('fs-extra-cliente-style'))return;
    const style=document.createElement('style');
    style.id='fs-extra-cliente-style';
    style.textContent=`#extra-cliente-container{display:grid!important;gap:12px!important;width:100%!important;margin-top:8px!important}.extra-field.fs-extra-cliente-row{display:grid!important;grid-template-columns:52px minmax(145px,.9fr) minmax(0,1fr) 52px!important;align-items:center!important;gap:10px!important;width:100%!important;margin:0 0 10px!important;padding:10px!important;background:#fff!important;border:1px solid #d6e7ff!important;border-radius:18px!important;box-shadow:0 10px 24px rgba(20,92,255,.08)!important}.fs-extra-icone{width:42px!important;height:42px!important;border-radius:14px!important;background:linear-gradient(135deg,#2f7bff,#145cff)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:20px!important;font-weight:950!important;line-height:1!important;box-shadow:0 8px 18px rgba(20,92,255,.18)!important}.extra-field.fs-extra-cliente-row select.fs-extra-tipo,.extra-field.fs-extra-cliente-row input.fs-extra-valor{height:48px!important;min-height:48px!important;width:100%!important;border:1px solid #cfe0ff!important;border-radius:13px!important;background:#fff!important;color:#06153b!important;padding:0 13px!important;font-size:15px!important;font-weight:780!important;outline:none!important;box-shadow:none!important}.extra-field.fs-extra-cliente-row select.fs-extra-tipo{appearance:auto!important;-webkit-appearance:menulist!important}.extra-field.fs-extra-cliente-row input.fs-extra-valor::placeholder{color:#9aa8c0!important;opacity:1!important}.extra-field.fs-extra-cliente-row select.fs-extra-tipo:focus,.extra-field.fs-extra-cliente-row input.fs-extra-valor:focus{border-color:#145cff!important;box-shadow:0 0 0 3px rgba(20,92,255,.13)!important}.extra-field.fs-extra-cliente-row .btn-remove.fs-extra-remover{width:46px!important;height:46px!important;min-width:46px!important;padding:0!important;border-radius:13px!important;background:#fff6f6!important;color:#c92a2a!important;border:1px solid #ffd0d0!important;font-size:22px!important;font-weight:950!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}.extra-field.fs-extra-cliente-row .btn-remove.fs-extra-remover:hover{background:#dc2626!important;color:#fff!important;border-color:#dc2626!important}.btn-extra{background:linear-gradient(135deg,#2f7bff,#145cff,#0b3fae)!important;color:#fff!important;border:1px solid rgba(20,92,255,.25)!important;border-radius:999px!important;box-shadow:0 14px 30px rgba(20,92,255,.20)!important}@media(max-width:760px){.extra-field.fs-extra-cliente-row{grid-template-columns:46px minmax(112px,.9fr) minmax(0,1fr) 46px!important;gap:8px!important;padding:8px!important}.fs-extra-icone{width:38px!important;height:38px!important;font-size:18px!important}.extra-field.fs-extra-cliente-row select.fs-extra-tipo,.extra-field.fs-extra-cliente-row input.fs-extra-valor{height:44px!important;min-height:44px!important;font-size:13.5px!important;padding:0 10px!important}.extra-field.fs-extra-cliente-row .btn-remove.fs-extra-remover{width:42px!important;height:42px!important;min-width:42px!important}}`;
    document.head.appendChild(style);
  }

  function atualizarLinha(linha){
    const select=linha?.querySelector('.fs-extra-tipo');
    const input=linha?.querySelector('.fs-extra-valor');
    const icon=linha?.querySelector('.fs-extra-icone');
    const tipo=select?.value||'CPF/CNPJ';
    const cfg=CONFIG[tipo]||CONFIG.Outros;
    if(icon)icon.textContent=cfg.icon;
    if(input)input.placeholder=cfg.placeholder;
    if(linha)linha.dataset.extraTipo=tipo;
  }

  function coletarExtras(){
    const container=document.getElementById('extra-cliente-container');
    if(!container)return[];
    return Array.from(container.querySelectorAll('.extra-field')).map(f=>{
      const select=f.querySelector('.fs-extra-tipo');
      const input=f.querySelector('.fs-extra-valor');
      if(select||input)return{label:select?.value||f.dataset.extraTipo||'Outros',valor:input?.value||''};
      const inputs=f.querySelectorAll('input');
      return{label:inputs[0]?.value||'',valor:inputs[1]?.value||''};
    }).filter(e=>e.label||e.valor);
  }

  function salvarEstadoCompleto(){
    const dados={
      titulo:document.getElementById('titulo')?.value||'',
      cliente:document.getElementById('cliente')?.value||'',
      telCliente:document.getElementById('tel-cliente')?.value||'',
      extraCliente:coletarExtras(),
      observacoes:document.getElementById('observacoes')?.value||'',
      validade:document.getElementById('validade-orcamento')?.value||'',
      formaPagamento:document.getElementById('forma-pagamento')?.value||'',
      theme:document.getElementById('selected-theme')?.value||'original',
      itens:Array.from(document.querySelectorAll('.item-row:not(.header-labels)')).map(row=>({
        desc:row.querySelector('.desc-cell')?.value||'',
        qtd:row.querySelector('.qtd')?.value||'1',
        valor:typeof window.obterValorCampoMoeda==='function'?window.obterValorCampoMoeda(row.querySelector('.valor'))||0:(Number(row.querySelector('.valor')?.value)||0)
      }))
    };
    localStorage.setItem('fs_backup',JSON.stringify(dados));
  }

  function adicionarCampoExtra(containerId,label='',valor=''){
    const container=document.getElementById(containerId);
    if(!container)return;
    garantirEstilo();
    const tipo=normalizarTipo(label);
    const cfg=CONFIG[tipo]||CONFIG.Outros;
    const div=document.createElement('div');
    div.className='extra-field fs-extra-cliente-row';
    div.dataset.extraTipo=tipo;
    div.innerHTML=`<span class="fs-extra-icone" aria-hidden="true">${cfg.icon}</span><select class="fs-extra-tipo" aria-label="Tipo de informação adicional"><option value="CPF/CNPJ">CPF/CNPJ</option><option value="Endereço">Endereço</option><option value="E-mail">E-mail</option><option value="Telefone">Telefone</option><option value="Data de Nascimento">Data de Nascimento</option><option value="Empresa">Empresa</option><option value="Outros">Outros</option></select><input type="text" class="fs-extra-valor" placeholder="${escapar(cfg.placeholder)}" value="${escapar(valor)}" aria-label="Dados da informação adicional"><button type="button" class="btn-remove fs-extra-remover" aria-label="Remover informação adicional">×</button>`;
    const select=div.querySelector('.fs-extra-tipo');
    const input=div.querySelector('.fs-extra-valor');
    select.value=tipo;
    select.addEventListener('change',()=>{atualizarLinha(div);salvarEstadoCompleto();atualizarPreview()});
    input.addEventListener('input',()=>{salvarEstadoCompleto();atualizarPreview()});
    div.querySelector('.fs-extra-remover').addEventListener('click',()=>{div.remove();salvarEstadoCompleto();atualizarPreview()});
    container.appendChild(div);
    atualizarLinha(div);
  }

  function montarExtrasClienteHtml(){
    const extras=coletarExtras();
    if(!extras.length)return'';
    return extras.map(extra=>`<br>${escapar(extra.label)}: ${escapar(extra.valor)}`).join('');
  }

  function removerBlocosClienteCadastrado(){
    document.querySelectorAll('.cliente-id-acoes,#cliente-vinculado-card,.veiculo-orcamento-card,#veiculo-vinculado-card').forEach(el=>el.remove());
    const hidden=document.getElementById('cliente-id-cadastrado');
    if(hidden)hidden.value='';
  }

  garantirEstilo();
  removerBlocosClienteCadastrado();
  setTimeout(removerBlocosClienteCadastrado,300);
  setTimeout(removerBlocosClienteCadastrado,1000);

  window.adicionarCampoExtra=adicionarCampoExtra;
  window.montarExtrasClienteHtml=montarExtrasClienteHtml;
  window.salvarEstadoCompleto=salvarEstadoCompleto;
  window.fsRemoverBlocosClienteCadastradoGerador=removerBlocosClienteCadastrado;
})();