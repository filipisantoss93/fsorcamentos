import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const htmlPath = path.join(raiz, 'planos.html');
const cssPath = path.join(raiz, 'planos-inline.css');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo planos.html não encontrado. Rode este comando na raiz do projeto.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

const inicio = html.indexOf('<style>');
if (inicio === -1) {
  console.log('Nenhum primeiro bloco <style> simples encontrado em planos.html. Nada para extrair.');
  process.exit(0);
}

const fim = html.indexOf('</style>', inicio);
if (fim === -1) {
  console.error('Bloco <style> encontrado, mas fechamento </style> não foi localizado. Operação cancelada.');
  process.exit(1);
}

const blocoCompleto = html.slice(inicio, fim + '</style>'.length);
const css = blocoCompleto
  .replace(/^<style>\s*/i, '')
  .replace(/\s*<\/style>$/i, '')
  .trim();

const marcadoresObrigatorios = [
  '.pagina-planos',
  '.planos-hero',
  '.tag-planos',
  '.status-plano-box',
  '.btn-hero-planos'
];

const faltando = marcadoresObrigatorios.filter(marcador => !css.includes(marcador));
if (faltando.length) {
  console.error('O primeiro bloco <style> não parece ser o bloco principal de planos.html. Operação cancelada.');
  console.error(`Marcadores ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}

const cssFinal = `/* =========================================================\n   FS ORÇAMENTOS - planos-inline.css\n   CSS principal extraído de planos.html\n   ========================================================= */\n\n${css}\n`;

fs.writeFileSync(cssPath, cssFinal, 'utf8');

const link = '<link id="fs-planos-inline-css" rel="stylesheet" href="planos-inline.css">';
html = `${html.slice(0, inicio).trimEnd()}\n  ${link}\n\n${html.slice(fim + '</style>'.length).trimStart()}`;
html = html.replace(/\n{4,}/g, '\n\n\n');

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Primeiro bloco <style> de planos.html extraído para planos-inline.css com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
