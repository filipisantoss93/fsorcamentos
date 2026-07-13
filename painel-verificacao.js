/* Verificação leve de integridade do painel em desenvolvimento. */
(function verificarEstruturaPainel(){
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const obrigatorios = [
      'auth-area','conteudo-protegido','dash-total-orcamentos','dash-pendentes',
      'dash-aprovados-mes','dash-valor-aprovado-mes','lista-ultimos-orcamentos-painel',
      'perfil-plano','perfil-saldo-efex','form-cadastro-perfil','modal-editar-perfil',
      'modal-senha','modal-excluir-conta','modal-pix-basico'
    ];
    const ausentes = obrigatorios.filter(id => !document.getElementById(id));
    if (ausentes.length) console.error('Painel: elementos obrigatórios ausentes:', ausentes);
  });
})();
