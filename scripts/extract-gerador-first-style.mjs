import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const htmlPath = path.join(raiz, 'gerador.html');
const cssPath = path.join(raiz, 'gerador-inline.css');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo gerador.html não encontrado. Rode este comando na raiz do projeto.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

const inicio = html.indexOf('<style>');
if (inicio === -1) {
  console.log('Nenhum primeiro bloco <style> simples encontrado em gerador.html. Nada para extrair.');
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
  '.pagina-gerador',
  '.gerador-hero',
  '#conteudo-pdf',
  '.acoes-profissionais-orcamento',
  '.modal-busca-cliente-overlay'
];

const faltando = marcadoresObrigatorios.filter(marcador => !css.includes(marcador));
if (faltando.length) {
  console.error('O primeiro bloco <style> não parece ser o bloco principal do gerador. Operação cancelada.');
  console.error(`Marcadores ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}

const cssFinal = `/* =========================================================\n   FS ORÇAMENTOS - gerador-inline.css\n   CSS principal extraído de gerador.html\n   ========================================================= */\n\n${css}\n`;

fs.writeFileSync(cssPath, cssFinal, 'utf8');

const link = '<link id="fs-gerador-inline-css" rel="stylesheet" href="gerador-inline.css">';
html = `${html.slice(0, inicio).trimEnd()}\n  ${link}\n\n${html.slice(fim + '</style>'.length).trimStart()}`;
html = html.replace(/\n{4,}/g, '\n\n\n');

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Primeiro bloco <style> do gerador.html extraído para gerador-inline.css com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
