/* FS ORÇAMENTOS — consistência final entre as camadas do gerador */
(function () {
  'use strict';

  const CHAVE_ID_NUVEM = 'fs_gerador_orcamento_nuvem_id_v1';
  const CHAVE_ESTADO = 'fs_gerador_estado_v2';

  function limparIdNuvem() {
    window.orcamentoAtualSalvoId = null;
    window.orcamentoSalvoAtualId = null;
    localStorage.removeItem(CHAVE_ID_NUVEM);

    try {
      const estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || 'null');
      if (estado && typeof estado === 'object') {
        estado.orcamento_nuvem_id = null;
        localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
      }
    } catch (_) {}

    if (typeof window.definirOrcamentoAtualSalvo === 'function') {
      window.definirOrcamentoAtualSalvo(null);
    }
  }

  const limparAnterior = window.limparFormulario;
  if (typeof limparAnterior === 'function' && !limparAnterior.__fsConsistenciaFinal) {
    const wrapper = function () {
      const retorno = limparAnterior.apply(this, arguments);

      /*
       * A camada visual retorna false quando o usuário cancela e true quando
       * a limpeza foi concluída. Implementações antigas podem retornar undefined.
       */
      if (retorno === false) return false;

      const titulo = document.getElementById('titulo')?.value?.trim() || '';
      const cliente = document.getElementById('cliente')?.value?.trim() || '';
      const linhasComConteudo = Array.from(
        document.querySelectorAll('#itens-lista .item-row:not(.header-labels)')
      ).some(row => {
        const descricao = row.querySelector('.desc-cell, .desc')?.value?.trim() || '';
        const valor = row.querySelector('.valor')?.value?.trim() || '';
        return Boolean(descricao || valor);
      });

      if (!titulo && !cliente && !linhasComConteudo) limparIdNuvem();
      return retorno;
    };

    wrapper.__fsConsistenciaFinal = true;
    wrapper.__fsOriginal = limparAnterior;
    window.limparFormulario = wrapper;
  }

  /* Garante que a validação final permaneça por fora dos overrides anteriores. */
  if (typeof window.gerarPrevia === 'function' && typeof window.baixarPDF === 'function') {
    document.documentElement.dataset.fsGeradorCamadasOk = '1';
  }
})();