import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const htmlPath = path.join(raiz, 'orcamentos.html');
const cssPath = path.join(raiz, 'orcamentos-overrides.css');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo orcamentos.html não encontrado. Rode este comando na raiz do projeto.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

const estilosParaExtrair = [
  {
    id: 'fs-formal-theme-overrides',
    titulo: 'FS formal theme overrides migrado de orcamentos.html'
  },
  {
    id: 'fs-contrast-fix-final',
    titulo: 'FS contrast fix final migrado de orcamentos.html'
  }
];

const blocosExtraidos = [];

for (const estilo of estilosParaExtrair) {
  const regex = new RegExp(`<style\\s+id=["']${estilo.id}["']\\s*>([\\s\\S]*?)<\\/style>`, 'i');
  const match = html.match(regex);

  if (!match) {
    console.log(`Bloco <style id="${estilo.id}"> não encontrado. Pulando.`);
    continue;
  }

  blocosExtraidos.push(`/* =========================================================\n   ${estilo.titulo}\n   ========================================================= */\n${match[1].trim()}\n`);
  html = html.replace(match[0], '');
}

if (!blocosExtraidos.length) {
  console.log('Nenhum bloco nomeado encontrado para extrair. Nada para fazer.');
  process.exit(0);
}

const cssExistente = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8').trim() : '';
const cssNovo = [
  cssExistente,
  ...blocosExtraidos
].filter(Boolean).join('\n\n');

fs.writeFileSync(cssPath, `${cssNovo}\n`, 'utf8');

const linkCss = '<link id="fs-orcamentos-overrides-css" rel="stylesheet" href="orcamentos-overrides.css">';

if (!html.includes('orcamentos-overrides.css')) {
  const marcadorPreferido = '<link rel="stylesheet" href="style.css">';
  if (html.includes(marcadorPreferido)) {
    html = html.replace(marcadorPreferido, `${marcadorPreferido}\n  ${linkCss}`);
  } else {
    html = html.replace('</head>', `  ${linkCss}\n</head>`);
  }
}

html = html.replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Estilos nomeados extraídos para orcamentos-overrides.css com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
