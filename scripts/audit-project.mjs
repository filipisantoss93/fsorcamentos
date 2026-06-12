import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignorarPastas = new Set(['.git', 'node_modules', 'android/.gradle', 'android/app/build', 'dist', 'build', 'www']);

function existe(caminho) {
  return fs.existsSync(path.join(root, caminho));
}

function ler(caminho) {
  return fs.readFileSync(path.join(root, caminho), 'utf8');
}

function listarArquivos(dir = '.') {
  const resultado = [];

  function andar(pastaRelativa) {
    const pastaAbsoluta = path.join(root, pastaRelativa);
    if (!fs.existsSync(pastaAbsoluta)) return;

    for (const item of fs.readdirSync(pastaAbsoluta, { withFileTypes: true })) {
      const relativo = path.join(pastaRelativa, item.name).replaceAll('\\', '/').replace(/^\.\//, '');
      if ([...ignorarPastas].some(ignorado => relativo === ignorado || relativo.startsWith(`${ignorado}/`))) continue;

      if (item.isDirectory()) andar(relativo);
      else resultado.push(relativo);
    }
  }

  andar(dir);
  return resultado;
}

function contar(regex, texto) {
  return [...texto.matchAll(regex)].length;
}

function tamanhoKb(arquivo) {
  const bytes = fs.statSync(path.join(root, arquivo)).size;
  return Math.round((bytes / 1024) * 10) / 10;
}

function auditarHtml() {
  const htmls = listarArquivos('.').filter(arquivo => arquivo.endsWith('.html'));

  const relatorio = htmls.map(arquivo => {
    const html = ler(arquivo);
    return {
      arquivo,
      kb: tamanhoKb(arquivo),
      estilosInline: contar(/\sstyle=["']/gi, html),
      blocosStyle: contar(/<style[\s>]/gi, html),
      blocosScriptInline: contar(/<script(?![^>]+src=)[\s>]/gi, html),
      scriptsExternos: contar(/<script[^>]+src=["']/gi, html),
      linksCss: contar(/<link[^>]+rel=["']stylesheet["']/gi, html)
    };
  });

  relatorio.sort((a, b) => {
    const pesoA = a.estilosInline + a.blocosStyle * 20 + a.blocosScriptInline * 10 + a.kb;
    const pesoB = b.estilosInline + b.blocosStyle * 20 + b.blocosScriptInline * 10 + b.kb;
    return pesoB - pesoA;
  });

  return relatorio;
}

function extrairRefsDoHtml() {
  const refs = new Set();
  const htmls = listarArquivos('.').filter(arquivo => arquivo.endsWith('.html'));
  const externo = /^(https?:)?\/\//i;

  for (const arquivo of htmls) {
    const html = ler(arquivo);
    const padroes = [
      /<script[^>]+src=["']([^"']+)["']/gi,
      /<link[^>]+href=["']([^"']+)["']/gi,
      /<img[^>]+src=["']([^"']+)["']/gi,
      /<a[^>]+href=["']([^"']+)["']/gi
    ];

    for (const regex of padroes) {
      for (const match of html.matchAll(regex)) {
        const refOriginal = match[1];
        if (!refOriginal || externo.test(refOriginal) || refOriginal.startsWith('data:') || refOriginal.startsWith('#') || refOriginal.startsWith('mailto:') || refOriginal.startsWith('tel:') || refOriginal.startsWith('javascript:')) continue;
        const ref = refOriginal.split('?')[0].split('#')[0].replace(/^\//, '');
        if (ref) refs.add(ref);
      }
    }
  }

  return refs;
}

function extrairAssetsDoConfig() {
  const refs = new Set();
  if (!existe('config.js')) return refs;

  const config = ler('config.js');
  const regexListaAsset = /\[\s*['"]([^'"]+\.(?:js|css))['"]\s*,\s*['"][^'"]+['"]\s*\]/g;
  const regexChamada = /fsConfigCarregar(?:Script|Css)Unico\(['"]\/([^'"]+)['"]/g;

  for (const regex of [regexListaAsset, regexChamada]) {
    for (const match of config.matchAll(regex)) {
      refs.add(match[1].replace(/^\//, ''));
    }
  }

  return refs;
}

function auditarPossiveisSoltos() {
  const arquivos = listarArquivos('.');
  const referencias = new Set([...extrairRefsDoHtml(), ...extrairAssetsDoConfig()]);

  const candidatos = arquivos.filter(arquivo => {
    if (!/\.(js|css|html)$/i.test(arquivo)) return false;
    if (arquivo.startsWith('scripts/')) return false;
    if (['package.json', 'README.md'].includes(arquivo)) return false;
    if (arquivo === 'index.html') return false;
    if (arquivo === 'config.js') return false;
    return !referencias.has(arquivo);
  });

  return candidatos.sort();
}

const html = auditarHtml();
const possiveisSoltos = auditarPossiveisSoltos();

console.log('FS Orçamentos - auditoria de limpeza');
console.log('------------------------------------');
console.log('\nHTMLs com maior prioridade de refatoração:');

for (const item of html.slice(0, 12)) {
  console.log(`- ${item.arquivo} | ${item.kb} KB | style="": ${item.estilosInline} | <style>: ${item.blocosStyle} | scripts inline: ${item.blocosScriptInline} | scripts externos: ${item.scriptsExternos} | css: ${item.linksCss}`);
}

console.log('\nPossíveis arquivos soltos ou não referenciados diretamente:');
if (!possiveisSoltos.length) {
  console.log('- Nenhum candidato evidente.');
} else {
  for (const arquivo of possiveisSoltos.slice(0, 80)) console.log(`- ${arquivo}`);
  if (possiveisSoltos.length > 80) console.log(`... mais ${possiveisSoltos.length - 80} arquivo(s).`);
}

console.log('\nObservação: arquivos listados como possíveis soltos não devem ser apagados automaticamente. Eles podem ser chamados dinamicamente por código, Supabase, rotas externas ou Capacitor.');
