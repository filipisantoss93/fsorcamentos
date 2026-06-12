import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const htmlPath = path.join(raiz, 'orcamentos.html');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo orcamentos.html não encontrado. Rode este comando na raiz do projeto.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

const substituicoes = [
  [
    '<link id="fs-orcamentos-overrides-css" rel="stylesheet" href="orcamentos-overrides.css">',
    '<link id="fs-orcamentos-overrides-css" rel="stylesheet" href="orcamentos-overrides.css">\n  <link id="fs-orcamentos-auth-css" rel="stylesheet" href="orcamentos-auth.css">'
  ],
  [
    '<div id="auth-area" style="display:none; max-width: 380px; margin: 45px auto; font-family: sans-serif;">',
    '<div id="auth-area" class="auth-area-orcamentos">'
  ],
  [
    '<div id="auth-container" style="padding: 22px; border: 1px solid #e0d6c8; border-radius: 14px; background: #fff; box-shadow: 0 8px 22px rgba(0,0,0,0.12);">',
    '<div id="auth-container" class="auth-container-orcamentos">'
  ],
  [
    '<h3 id="auth-titulo" style="margin-top: 0; text-align: center; color: #ffc400;">Acesse sua Conta</h3>',
    '<h3 id="auth-titulo" class="auth-titulo-orcamentos">Acesse sua Conta</h3>'
  ],
  [
    '<div id="grupo-nome" style="margin-bottom: 15px; display: none;">',
    '<div id="grupo-nome" class="auth-campo-orcamentos oculto">'
  ],
  [
    '<div id="grupo-nome-empresa" style="margin-bottom: 15px; display: none;">',
    '<div id="grupo-nome-empresa" class="auth-campo-orcamentos oculto">'
  ],
  [
    '<div id="grupo-whatsapp-empresa" style="margin-bottom: 15px; display: none;">',
    '<div id="grupo-whatsapp-empresa" class="auth-campo-orcamentos oculto">'
  ],
  [
    '<div id="grupo-confirmar-senha" style="margin-bottom: 20px; display: none;">',
    '<div id="grupo-confirmar-senha" class="auth-campo-orcamentos auth-campo-confirmar-orcamentos oculto">'
  ],
  [
    '<div style="margin-bottom: 15px;">',
    '<div class="auth-campo-orcamentos">'
  ],
  [
    '<button type="button" id="btn-principal" onclick="enviarFormulario()" style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px;">Entrar</button>',
    '<button type="button" id="btn-principal" class="btn-principal-orcamentos" onclick="enviarFormulario()">Entrar</button>'
  ],
  [
    '<div style="text-align: center; margin-top: 15px;">',
    '<div class="auth-alternar-orcamentos">'
  ],
  [
    '<a href="#" id="link-alternar" onclick="alternarModo(event)" style="font-size: 13px; color: #007bff; text-decoration: none;">Não tem cadastro? Clique aqui.</a>',
    '<a href="#" id="link-alternar" onclick="alternarModo(event)">Não tem cadastro? Clique aqui.</a>'
  ],
  [
    '<div id="conteudo-protegido" style="display:none;">',
    '<div id="conteudo-protegido" class="conteudo-protegido-orcamentos">'
  ],
  [
    '<div style="margin-top:22px;">',
    '<div class="upgrade-acoes-orcamentos">'
  ]
];

for (const [antigo, novo] of substituicoes) {
  html = html.split(antigo).join(novo);
}

html = html.replace(/<label style="display: block; font-size: 14px; margin-bottom: 5px; color: #666;">/g, '<label>');
html = html.replace(/<input([^>]+?) style="width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">/g, '<input$1>');

if (!html.includes('orcamentos-auth.css')) {
  console.error('Não foi possível inserir o link orcamentos-auth.css. Operação cancelada.');
  process.exit(1);
}

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Estilos inline do login protegido em orcamentos.html removidos com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
