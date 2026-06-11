import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const erros = [];
const avisos = [];

function existe(caminho) {
  return fs.existsSync(path.join(root, caminho));
}

function ler(caminho) {
  return fs.readFileSync(path.join(root, caminho), 'utf8');
}

function listarArquivos(dir = '.') {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) return [];

  const ignorar = new Set(['.git', 'node_modules', 'android/.gradle', 'android/app/build', 'dist', 'build', 'www']);
  const resultado = [];

  function andar(pastaRelativa) {
    const pastaAbsoluta = path.join(root, pastaRelativa);
    for (const item of fs.readdirSync(pastaAbsoluta, { withFileTypes: true })) {
      const relativo = path.join(pastaRelativa, item.name).replaceAll('\\', '/');
      if ([...ignorar].some(ignorado => relativo === ignorado || relativo.startsWith(`${ignorado}/`))) continue;

      if (item.isDirectory()) andar(relativo);
      else resultado.push(relativo.replace(/^\.\//, ''));
    }
  }

  andar(dir);
  return resultado;
}

function validarArquivosBasicos() {
  const obrigatorios = [
    'index.html',
    'gerador.html',
    'config.js',
    'auth.js',
    'carregar-menu.js',
    'style.css',
    'package.json',
    'vercel.json',
    'manifest.json'
  ];

  for (const arquivo of obrigatorios) {
    if (!existe(arquivo)) erros.push(`Arquivo obrigatório ausente: ${arquivo}`);
  }
}

function validarAssetsDoConfig() {
  if (!existe('config.js')) return;

  const config = ler('config.js');
  const encontrados = new Set();

  const regexChamadaScriptDireta = /fsConfigCarregarScriptUnico\(['"]\/([^'"]+)['"]/g;
  const regexChamadaCssDireta = /fsConfigCarregarCssUnico\(['"]\/([^'"]+)['"]/g;
  const regexListaAsset = /\[\s*['"]([^'"]+\.(?:js|css))['"]\s*,\s*['"][^'"]+['"]\s*\]/g;

  for (const regex of [regexChamadaScriptDireta, regexChamadaCssDireta, regexListaAsset]) {
    let match;
    while ((match = regex.exec(config))) {
      encontrados.add(match[1].replace(/^\//, ''));
    }
  }

  for (const arquivo of encontrados) {
    if (!existe(arquivo)) erros.push(`config.js carrega arquivo inexistente: /${arquivo}`);
  }
}

function validarReferenciasHtml() {
  const htmls = listarArquivos('.').filter(arquivo => arquivo.endsWith('.html'));
  const ignorarExternos = /^(https?:)?\/\//i;

  for (const html of htmls) {
    const conteudo = ler(html);
    const refs = [];

    for (const match of conteudo.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) refs.push(match[1]);
    for (const match of conteudo.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)) refs.push(match[1]);
    for (const match of conteudo.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) refs.push(match[1]);

    for (const refOriginal of refs) {
      if (!refOriginal || ignorarExternos.test(refOriginal) || refOriginal.startsWith('data:') || refOriginal.startsWith('#')) continue;

      const ref = refOriginal.split('?')[0].split('#')[0].replace(/^\//, '');
      if (!ref) continue;

      if (!existe(ref)) {
        avisos.push(`${html} referencia arquivo local não encontrado: ${refOriginal}`);
      }
    }
  }
}

function validarVercel() {
  if (!existe('vercel.json')) return;

  try {
    const vercel = JSON.parse(ler('vercel.json'));
    const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];

    for (const rewrite of rewrites) {
      const destino = String(rewrite.destination || '').replace(/^\//, '');
      if (destino && destino.endsWith('.html') && !existe(destino)) {
        erros.push(`vercel.json aponta para página inexistente: ${rewrite.source} -> ${rewrite.destination}`);
      }
    }
  } catch (erro) {
    erros.push(`vercel.json inválido: ${erro.message}`);
  }
}

function validarPackageJson() {
  if (!existe('package.json')) return;

  try {
    JSON.parse(ler('package.json'));
  } catch (erro) {
    erros.push(`package.json inválido: ${erro.message}`);
  }
}

validarArquivosBasicos();
validarPackageJson();
validarAssetsDoConfig();
validarReferenciasHtml();
validarVercel();

console.log('FS Orçamentos - validação do projeto');
console.log('--------------------------------------');

if (avisos.length) {
  console.log('\nAvisos:');
  for (const aviso of avisos) console.log(`- ${aviso}`);
}

if (erros.length) {
  console.error('\nErros:');
  for (const erro of erros) console.error(`- ${erro}`);
  process.exit(1);
}

console.log('\nOK: nenhum erro estrutural crítico encontrado.');
