import fs from 'node:fs';
import path from 'node:path';

const arquivo = path.join(process.cwd(), 'orcamentos.html');

if (!fs.existsSync(arquivo)) {
  console.error('Arquivo orcamentos.html não encontrado. Rode este comando na raiz do projeto.');
  process.exit(1);
}

const html = fs.readFileSync(arquivo, 'utf8');
const inicio = html.indexOf('<style>');

if (inicio === -1) {
  console.log('Nenhum primeiro bloco <style> simples encontrado em orcamentos.html. Nada para remover.');
  process.exit(0);
}

const fim = html.indexOf('</style>', inicio);

if (fim === -1) {
  console.error('Bloco <style> encontrado, mas fechamento </style> não foi localizado. Operação cancelada.');
  process.exit(1);
}

const bloco = html.slice(inicio, fim + '</style>'.length);

const marcadoresObrigatorios = [
  '.orcamentos-header',
  '.filtro-flutuante',
  '.tabela-orcamentos',
  '.modal-overlay-orcamento',
  '.planos-pix-section'
];

const faltando = marcadoresObrigatorios.filter(marcador => !bloco.includes(marcador));
if (faltando.length) {
  console.error('O primeiro bloco <style> não parece ser o bloco base de orçamentos. Operação cancelada.');
  console.error(`Marcadores ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}

const restante = `${html.slice(0, inicio).trimEnd()}\n\n${html.slice(fim + '</style>'.length).trimStart()}`;

fs.writeFileSync(arquivo, restante, 'utf8');

console.log('Primeiro bloco <style> migrado removido de orcamentos.html com sucesso.');
console.log('Agora rode: npm run check && npm run audit');
