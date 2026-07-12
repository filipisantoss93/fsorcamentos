(function () {
  'use strict';

  function enviarWA() {
    const nome = document.getElementById('nome')?.value.trim();
    const assunto = document.getElementById('assunto')?.value || 'Outro assunto';
    const mensagem = document.getElementById('msg')?.value.trim();

    if (!nome) {
      alert('Informe seu nome.');
      document.getElementById('nome')?.focus();
      return;
    }

    if (!mensagem) {
      alert('Digite sua mensagem.');
      document.getElementById('msg')?.focus();
      return;
    }

    const texto = encodeURIComponent(
      `Olá, meu nome é ${nome}.\n\nAssunto: ${assunto}.\n\nMensagem: ${mensagem}`
    );

    window.open(
      `https://api.whatsapp.com/send?phone=5518996769589&text=${texto}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btn-enviar-contato')?.addEventListener('click', enviarWA);
  });
})();
