(function(){
  'use strict';

  function el(id){ return document.getElementById(id); }
  function valor(id){ return (el(id)?.value || '').trim(); }
  function texto(id){ return (el(id)?.textContent || '').trim(); }
  function setStatus(id, msg, tipo){
    if (typeof window.mostrarStatus === 'function') return window.mostrarStatus(id, msg, tipo || 'sucesso');
    const alvo = el(id);
    if (alvo){ alvo.className = 'status-msg ' + (tipo || 'sucesso'); alvo.textContent = msg; }
  }
  async function supabaseReady(){
    for (let i=0;i<35;i++){
      if (window._supabase) return window._supabase;
      if (typeof window.inicializarSupabaseFS === 'function') window.inicializarSupabaseFS();
      await new Promise(r=>setTimeout(r,100));
    }
    return null;
  }
  async function getSession(){
    const s = await supabaseReady();
    if (!s) return null;
    const { data, error } = await s.auth.getSession();
    if (error || !data?.session) return null;
    return data.session;
  }
  function nomeResponsavel(){
    return valor('responsavel_selecionado') || texto('perfil-responsavel-selecionado') || localStorage.getItem('usuario_nome') || 'Usuário';
  }
  function preencherLocal(payload){
    localStorage.setItem('id', payload.id || '');
    localStorage.setItem('usuario_nome', payload.nome || 'Usuário');
    localStorage.setItem('usuario_plano', payload.plano || localStorage.getItem('usuario_plano') || 'gratis');
    localStorage.setItem('nome_empresa', payload.nome_empresa || '');
    localStorage.setItem('telefone_empresa', payload.telefone_empresa || '');
    localStorage.setItem('endereco_empresa', payload.endereco_empresa || '');
    localStorage.setItem('cnpj_empresa', payload.cnpj_empresa || '');
    if (payload.foto_url) localStorage.setItem('foto_url', payload.foto_url);
    else localStorage.removeItem('foto_url');
    if (payload.plano_status) localStorage.setItem('usuario_plano_status', payload.plano_status);
    if (payload.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', payload.plano_expira_em);
  }
  function atualizarTela(payload, session){
    const mapaTexto = {
      'perfil-responsavel-selecionado': payload.nome,
      'perfil-empresa': payload.nome_empresa,
      'perfil-telefone': payload.telefone_empresa,
      'perfil-cnpj': payload.cnpj_empresa,
      'perfil-endereco': payload.endereco_empresa
    };
    Object.entries(mapaTexto).forEach(([id,v])=>{ const node = el(id); if (node) node.textContent = v || '-'; });

    if (typeof window.atualizarPreviewLogo === 'function') window.atualizarPreviewLogo(payload.foto_url || '');
    if (typeof window.atualizarLogoEstatica === 'function') window.atualizarLogoEstatica(payload.foto_url || '');
    if (typeof window.atualizarCardPlano === 'function') window.atualizarCardPlano(payload);
    if (typeof window.preencherSelectResponsaveis === 'function') window.preencherSelectResponsaveis();
    if (typeof window.renderizarListaResponsaveis === 'function') window.renderizarListaResponsaveis();
    if (typeof window.carregarMenu === 'function') window.carregarMenu(session);
  }
  function mensagemErro(error){
    const raw = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(' | ');
    console.error('Erro detalhado ao salvar perfil:', error);
    if (/violates row-level security|rls/i.test(raw)) return 'Erro ao salvar perfil: permissão negada pela segurança do banco.';
    if (/column .* does not exist|schema cache|could not find/i.test(raw)) return 'Erro ao salvar perfil: coluna ausente ou cache do Supabase desatualizado.';
    if (/not-null|null value/i.test(raw)) return 'Erro ao salvar perfil: existe campo obrigatório vazio no banco.';
    if (/duplicate key/i.test(raw)) return 'Erro ao salvar perfil: registro duplicado.';
    return 'Erro ao salvar perfil: ' + (error?.message || 'verifique o console.');
  }
  async function salvarPerfilCorrigido(event){
    if (event) event.preventDefault();
    const session = await getSession();
    if (!session){ setStatus('status-perfil','Sessão não encontrada. Faça login novamente.','erro'); return; }

    const nome = nomeResponsavel();
    const nomeEmpresa = valor('nome_empresa');
    const telefone = valor('telefone_empresa');

    if (!nome || !nomeEmpresa || !telefone){
      setStatus('status-perfil','Selecione um responsável e preencha empresa e WhatsApp.','erro');
      return;
    }

    const btn = document.querySelector('#form-cadastro-perfil button[type="submit"], button[onclick*="salvarPerfil"]');
    const txt = btn?.textContent || '';
    if (btn){ btn.disabled = true; btn.textContent = 'Salvando...'; }

    try{
      const { data: atual } = await window._supabase
        .from('perfis')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const payload = {
        ...(atual || {}),
        id: session.user.id,
        nome,
        nome_empresa: nomeEmpresa,
        telefone_empresa: telefone,
        endereco_empresa: valor('endereco_empresa'),
        cnpj_empresa: valor('cnpj_empresa'),
        foto_url: valor('foto_url') || localStorage.getItem('foto_url') || atual?.foto_url || '',
        plano: atual?.plano || localStorage.getItem('usuario_plano') || 'gratis',
        plano_status: atual?.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo',
        atualizado_em: new Date().toISOString()
      };

      let resultado = await window._supabase.from('perfis').upsert(payload, { onConflict: 'id' }).select().maybeSingle();

      if (resultado.error){
        console.warn('Upsert do perfil falhou, tentando update simples:', resultado.error);
        resultado = await window._supabase
          .from('perfis')
          .update({
            nome: payload.nome,
            nome_empresa: payload.nome_empresa,
            telefone_empresa: payload.telefone_empresa,
            endereco_empresa: payload.endereco_empresa,
            cnpj_empresa: payload.cnpj_empresa,
            foto_url: payload.foto_url,
            atualizado_em: payload.atualizado_em
          })
          .eq('id', session.user.id)
          .select()
          .maybeSingle();
      }

      if (resultado.error) throw resultado.error;

      const salvo = resultado.data || payload;
      window.perfilAtual = { ...(window.perfilAtual || {}), ...salvo };
      preencherLocal(window.perfilAtual);
      atualizarTela(window.perfilAtual, session);
      setStatus('status-perfil','Perfil atualizado com sucesso.','sucesso');

      setTimeout(()=>{ if (typeof window.fecharModalEditarPerfil === 'function') window.fecharModalEditarPerfil(); },700);
    }catch(e){
      setStatus('status-perfil', mensagemErro(e), 'erro');
    }finally{
      if (btn){ btn.disabled = false; btn.textContent = txt || 'Salvar alterações'; }
    }
  }
  function instalar(){
    window.salvarPerfil = salvarPerfilCorrigido;
    const form = el('form-cadastro-perfil');
    if (form && form.dataset.perfilFix !== '1'){
      form.dataset.perfilFix = '1';
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        salvarPerfilCorrigido(ev);
      }, true);
    }
  }
  window.salvarPerfil = salvarPerfilCorrigido;
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(instalar,200); setTimeout(instalar,900); setTimeout(instalar,1800); });
  setTimeout(instalar,500);
})();
