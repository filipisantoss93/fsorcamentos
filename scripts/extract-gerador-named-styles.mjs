import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.join(process.cwd(), 'gerador.html');
const cssPath = path.join(process.cwd(), 'gerador-overrides.css');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo gerador.html não encontrado.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');
const ids = ['fs-formal-theme-overrides', 'fs-contrast-fix-final'];
const extraidos = [];

function extrairPorId(id) {
  const abertura = `<style id="${id}">`;
  const inicio = html.indexOf(abertura);
  if (inicio === -1) return false;

  const fim = html.indexOf('</style>', inicio);
  if (fim === -1) {
    console.error(`Fechamento </style> não encontrado para ${id}.`);
    process.exit(1);
  }

  const conteudo = html.slice(inicio + abertura.length, fim).trim();
  extraidos.push(`/* ${id} migrado de gerador.html */\n${conteudo}\n`);
  html = html.slice(0, inicio) + html.slice(fim + '</style>'.length);
  return true;
}

ids.forEach(extrairPorId);

if (!extraidos.length) {
  console.log('Nenhum bloco nomeado encontrado para extrair.');
  process.exit(0);
}

const cssAtual = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8').trim() : '';
fs.writeFileSync(cssPath, [cssAtual, ...extraidos].filter(Boolean).join('\n\n') + '\n', 'utf8');

const linkInline = '<link id="fs-gerador-inline-css" rel="stylesheet" href="gerador-inline.css">';
const linkOverrides = '<link id="fs-gerador-overrides-css" rel="stylesheet" href="gerador-overrides.css">';

if (!html.includes('gerador-overrides.css')) {
  if (html.includes(linkInline)) {
    html = html.replace(linkInline, `${linkInline}\n  ${linkOverrides}`);
  } else {
    html = html.replace('</head>', `  ${linkOverrides}\n</head>`);
  }
}

html = html.replace(/\n\s*<!-- FS FORMAL THEME OVERRIDES - visual mais claro e profissional -->\s*\n+/i, '\n');
html = html.replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Estilos nomeados do gerador extraídos com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
