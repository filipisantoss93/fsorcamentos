(function () {
  'use strict';

  const WHATSAPP_SUPORTE = '5518996769589';
  const LIMITE_MENSAGEM = 1500;

  const campo = id => document.getElementById(id);

  function definirErro(id, mensagem) {
    const elemento = campo(id);
    if (elemento) elemento.textContent = mensagem;
  }

  function limparErros() {
    ['erro-nome', 'erro-email', 'erro-assunto', 'erro-msg', 'status-contato'].forEach(id => definirErro(id, ''));
  }

  function emailValido(email) {
    return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarFormulario() {
    limparErros();

    const nome = campo('nome').value.trim();
    const email = campo('email').value.trim();
    const assunto = campo('assunto').value;
    const mensagem = campo('msg').value.trim();
    let primeiroInvalido = null;

    if (!nome) {
      definirErro('erro-nome', 'Informe seu nome.');
      primeiroInvalido = campo('nome');
    }

    if (!emailValido(email)) {
      definirErro('erro-email', 'Informe um e-mail válido.');
      primeiroInvalido ||= campo('email');
    }

    if (!assunto) {
      definirErro('erro-assunto', 'Selecione o assunto do atendimento.');
      primeiroInvalido ||= campo('assunto');
    }

    if (mensagem.length < 10) {
      definirErro('erro-msg', 'Descreva a solicitação com pelo menos 10 caracteres.');
      primeiroInvalido ||= campo('msg');
    }

    if (primeiroInvalido) {
      primeiroInvalido.focus();
      return null;
    }

    return { nome, email, assunto, mensagem };
  }

  function montarMensagem(dados) {
    const linhas = [
      'Olá! Preciso de atendimento no FS Orçamentos.',
      '',
      `Nome: ${dados.nome}`,
      dados.email ? `E-mail da conta: ${dados.email}` : '',
      `Assunto: ${dados.assunto}`,
      '',
      `Mensagem: ${dados.mensagem}`
    ];

    return linhas.filter((linha, indice) => linha || linhas[indice - 1] !== '').join('\n');
  }

  function enviarFormulario(evento) {
    evento.preventDefault();
    const dados = validarFormulario();
    if (!dados) return;

    const url = `https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(montarMensagem(dados))}`;
    const janela = window.open(url, '_blank', 'noopener,noreferrer');

    if (!janela) {
      definirErro('status-contato', 'O navegador bloqueou a nova guia. Permita pop-ups e tente novamente.');
    }
  }

  function atualizarContador() {
    const mensagem = campo('msg').value;
    campo('contador-msg').textContent = `${mensagem.length}/${LIMITE_MENSAGEM}`;
  }

  async function preencherDadosDaConta() {
    const nomeSalvo = localStorage.getItem('usuario_nome');
    const emailSalvo = localStorage.getItem('usuario_email');

    if (nomeSalvo && !campo('nome').value) campo('nome').value = nomeSalvo;
    if (emailSalvo && !campo('email').value) campo('email').value = emailSalvo;

    if (!window._supabase) return;

    try {
      const { data } = await window._supabase.auth.getSession();
      const usuario = data?.session?.user;
      if (!usuario) return;

      if (!campo('nome').value) {
        campo('nome').value = usuario.user_metadata?.nome || usuario.user_metadata?.name || '';
      }
      if (!campo('email').value) campo('email').value = usuario.email || '';
    } catch (_) {
      // O formulário continua disponível mesmo sem sessão.
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const formulario = campo('form-contato');
    const mensagem = campo('msg');
    if (!formulario || !mensagem) return;

    formulario.addEventListener('submit', enviarFormulario);
    mensagem.addEventListener('input', atualizarContador);
    atualizarContador();
    preencherDadosDaConta();
  });
})();