import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.join(process.cwd(), 'orcamentos.html');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo orcamentos.html não encontrado. Rode este comando na raiz do projeto.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(/\n\s*<!-- FS FORMAL THEME OVERRIDES - visual mais claro e profissional -->\s*\n+/i, '\n');
html = html.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Resíduos do head de orcamentos.html limpos com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
