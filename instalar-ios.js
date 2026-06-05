// ==================== AVISO INSTALAR NO IPHONE ====================
// FS Orçamentos - Orientação para adicionar à tela inicial no iOS

(function () {
  const CHAVE_OCULTAR_AVISO = 'fs_ocultar_aviso_instalar_ios';

  function isIOS() {
    const userAgent = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';

    const iPhoneOuIPad =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    return iPhoneOuIPad;
  }

  function isSafariIOS() {
    const userAgent = window.navigator.userAgent || '';

    const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(userAgent);

    return isIOS() && isSafari;
  }

  function estaRodandoComoApp() {
    return (
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  }

  function usuarioOcultouAviso() {
    return localStorage.getItem(CHAVE_OCULTAR_AVISO) === 'sim';
  }

  function fecharAvisoInstalarIOS() {
    const aviso = document.getElementById('aviso-instalar-ios');

    if (aviso) {
      aviso.classList.remove('mostrar');
      aviso.classList.add('ocultar');

      setTimeout(() => {
        aviso.remove();
      }, 280);
    }
  }

  function naoMostrarNovamenteIOS() {
    localStorage.setItem(CHAVE_OCULTAR_AVISO, 'sim');
    fecharAvisoInstalarIOS();
  }

  function criarAvisoInstalarIOS() {
    if (document.getElementById('aviso-instalar-ios')) return;

    const aviso = document.createElement('div');
    aviso.id = 'aviso-instalar-ios';
    aviso.className = 'aviso-instalar-ios';

    aviso.innerHTML = `
      <div class="aviso-ios-card">
        <button
          type="button"
          class="aviso-ios-fechar"
          onclick="fecharAvisoInstalarIOS()"
          aria-label="Fechar aviso">
          ×
        </button>

        <div class="aviso-ios-icone">📲</div>

        <div class="aviso-ios-conteudo">
          <strong>Instale o FS Orçamentos no seu iPhone</strong>

          <p>
            Toque no botão <b>Compartilhar</b>
            <span class="icone-compartilhar-ios">⬆️</span>
            do Safari e escolha <b>Adicionar à Tela de Início</b>.
          </p>

          <div class="aviso-ios-passos">
            <span>1. Abrir no Safari</span>
            <span>2. Compartilhar</span>
            <span>3. Adicionar à Tela de Início</span>
          </div>

          <div class="aviso-ios-acoes">
            <button type="button" onclick="fecharAvisoInstalarIOS()">
              Entendi
            </button>

            <button type="button" class="btn-nao-mostrar-ios" onclick="naoMostrarNovamenteIOS()">
              Não mostrar novamente
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(aviso);

    setTimeout(() => {
      aviso.classList.add('mostrar');
    }, 150);
  }

  function iniciarAvisoInstalarIOS() {
    if (!isIOS()) return;
    if (estaRodandoComoApp()) return;
    if (usuarioOcultouAviso()) return;

    /*
      No iPhone, a instalação na tela inicial funciona pelo Safari.
      Se abrir dentro de Chrome/Instagram/Facebook, o aviso ainda orienta
      a abrir no Safari.
    */
    setTimeout(() => {
      criarAvisoInstalarIOS();
    }, 1800);
  }

  window.fecharAvisoInstalarIOS = fecharAvisoInstalarIOS;
  window.naoMostrarNovamenteIOS = naoMostrarNovamenteIOS;
  window.criarAvisoInstalarIOS = criarAvisoInstalarIOS;

  document.addEventListener('DOMContentLoaded', iniciarAvisoInstalarIOS);
})();