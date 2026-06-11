# FS Orçamentos

Plataforma web/app para geração de orçamentos, aprovação pelo cliente e gestão de oficina/prestadores de serviço.

O projeto usa frontend estático com Supabase no navegador e suporte a aplicativo Android via Capacitor.

---

## Visão geral

O FS Orçamentos possui três níveis principais de uso:

- **Grátis**: geração de orçamento em PDF com limitações/anúncios.
- **Básico**: histórico de orçamentos, envio por WhatsApp, aprovação/recusa pelo cliente, notificações e gestão comercial simples.
- **Premium**: clientes, veículos, ordens de serviço, agenda, estoque, serviços recorrentes, dashboard operacional e gestão da oficina.

---

## Estrutura principal

### Páginas públicas

- `index.html` — página inicial. Para Premium, também pode exibir dashboard operacional.
- `sobre.html` — informações sobre a plataforma.
- `contato.html` — contato.
- `planos.html` — planos e teste Premium.
- `privacidade.html` — política de privacidade.
- `termos.html` — termos de uso.
- `manual.html` — manual de uso.
- `exemplos.html` — exemplos/demonstrações, se mantido no projeto.

### Páginas protegidas

- `gerador.html` — geração de orçamento.
- `orcamentos.html` — histórico/status de orçamentos.
- `painel.html` — dados da empresa, plano, responsáveis e preferências.
- `clientes.html` — cadastro e busca de clientes.
- `veiculos.html` — cadastro de veículos.
- `ordens.html` — lista/dashboard de ordens de serviço.
- `ordem.html` — detalhes, fotos, assinatura, PDF e documentos da OS.
- `agenda.html` — agendamentos.
- `recorrentes.html` — serviços recorrentes.
- `estoque.html` — estoque de peças/produtos.
- `relatorios.html` — relatórios Premium.
- `ver.html` — visualização/aprovação do orçamento pelo cliente.

---

## Arquivos globais importantes

- `config.js` — configuração pública do Supabase e carregamento de scripts globais/por página.
- `auth.js` — autenticação, proteção de páginas, login social, perfil local e modal de login.
- `carregar-menu.js` — header, menu, saudação, plano, logout, botão flutuante e comportamento mobile.
- `style.css` — tema visual principal.
- `ui.js` — funções auxiliares de interface.
- `planos.js` — lógica de planos/teste Premium.
- `.gitignore` — impede envio de dependências, builds, certificados, chaves e arquivos locais.

### Scripts auxiliares carregados pelo `config.js`

> Atenção: vários arquivos `*-fix.js` ainda estão em uso. Não exclua sem antes consolidar sua lógica no arquivo principal correspondente.

Scripts globais carregados em várias páginas:

- `fs-no-zoom.js` — bloqueia zoom e ajusta área segura do celular.
- `fs-session-cache.js` — usa cache local do usuário/plano para evitar piscar como convidado.
- `fs-menu-close-outside.js` — fecha menu mobile ao clicar fora.
- `fs-format-br.js` — formata telefone, CPF e CNPJ.
- `fs-footer-legal.js` — ajustes/padronização de rodapé.
- `layout-grid-global-fix.js` — correções gerais de grid/layout.
- `fs-contrast-final.js` — camada final de contraste.
- `fs-header-offset-fix.js` — ajustes de offset/posição do header.
- `fs-stable-visual-fix.js` — correções visuais estáveis.

Scripts por página/área:

- `index-visitante-lite.js` — ajustes da home para visitante/plano grátis.
- `index-ads-restore.js` — restauração/controle de áreas de anúncio no index.
- `index-cache-sync.js` — sincronização de estado/cache na home.
- `index-empresa-card.js` — card de empresa no index.
- `index-empresa-contrast-fix.js` — contraste do card/área de empresa no index.
- `dashboard-premium-index.js` — dashboard Premium do `index.html`.
- `index-dashboard-tag-fix.js` — correções de tags do dashboard.
- `index-visual-final-fix.js` — camada visual final do index.
- `index-gratis-planos-simplify.js` — simplificação dos blocos de plano grátis/home.
- `index-gratis-dom-cleaner.js` — limpeza visual/DOM da home grátis.
- `ver-cliente-fix.js` — ajustes da página de visualização pelo cliente.
- `gerador-pdf-fix.js` — correções de PDF do gerador.
- `gerador-acoes-fix.js` — ajustes de ações do gerador.
- `gerador-cleanup-fix.js` — limpeza complementar do gerador.
- `fs-premium-mobile-layout-fix.js` — ajustes mobile/layout de agenda, clientes e ordens.
- `agenda-visual-fix.js` — ajustes visuais da agenda.
- `clientes-toggle-fix.js` — ajustes de alternância/visual da página clientes.
- `painel-logo-fix.js` — correção de upload da logo/foto do perfil.
- `painel-perfil-fix.js` — correção de salvamento do perfil.
- `orcamentos-pdf.js` — correções do PDF de orçamento.
- `orcamentos-resumo-grid-fix.js` — grid de resumo dos orçamentos.
- `planos-visual-fix.js` — ajustes visuais da página de planos.
- `fs-cliente-modal.js` — modal padrão de busca/seleção de cliente.
- `ordem-extras.js` — fotos antes do serviço e assinatura na OS.
- `ordem-pdf-extras.js` — PDF da OS com fotos e assinatura.

---

## Supabase

O frontend usa a chave **anon public** do Supabase em `config.js`.

Nunca coloque a chave `service_role` no frontend.

### Configuração atual esperada

Em `config.js`:

```js
const SUPABASE_URL = 'https://...supabase.co';
const SUPABASE_ANON_KEY = '...';
```

A chave correta deve conter `role: "anon"` no payload JWT.

---

## SQLs importantes

Os SQLs ficam na pasta `sql/`.

Antes de testar todas as funções, confira se os SQLs necessários foram executados no SQL Editor do Supabase.

### Recursos que dependem de SQL específico

- Planos e teste grátis Premium.
- Clientes e veículos.
- Ordens de serviço.
- Estoque, categorias e subcategorias.
- Serviços/produtos.
- Fotos e assinatura da OS.

Para fotos/assinatura da OS, rode:

```text
sql/ordens_servico_extras_fotos_assinatura.sql
```

Esse SQL adiciona colunas como:

- `fotos_antes`
- `assinatura_cliente_data_url`
- `assinatura_cliente_nome`
- `assinatura_cliente_em`

---

## Bucket de imagens no Supabase

Para upload de logo/foto do perfil, o ideal é ter um bucket público chamado:

```text
logos
```

Se o bucket falhar, o sistema tenta salvar a imagem otimizada no campo `foto_url` como fallback. Isso evita perder a imagem, mas o ideal em produção é usar Storage.

---

## Rodar localmente no PC

### 1. Baixar o projeto

```bash
git clone https://github.com/filipisantoss93/fsorcamentos.git
cd fsorcamentos
```

Ou baixe o ZIP pelo GitHub e extraia no computador.

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar checagem simples

```bash
npm run check
```

### 4. Abrir localmente

Como o projeto é frontend estático, use um servidor estático.

Opção com `serve`:

```bash
npx serve .
```

Ou use a extensão **Live Server** no VS Code.

Depois abra no navegador o endereço mostrado no terminal, por exemplo:

```text
http://localhost:3000
```

ou

```text
http://127.0.0.1:5500
```

---

## Android / Capacitor

O projeto possui suporte a Android via Capacitor.

A configuração atual usa `server.url` apontando para:

```text
https://fsorcamentos.com.br
```

Isso faz o app Android carregar o site publicado. Portanto, alterações publicadas no site tendem a aparecer também no app.

### Sincronizar arquivos web com Android

```bash
npm run cap:sync
```

### Gerar APK de teste

```bash
npm run android:debug
```

### Gerar build de publicação

```bash
npm run android:release
```

### Requisitos no PC

- Node.js instalado.
- Java/JDK instalado.
- Android Studio ou Android SDK configurado.
- Pasta `android/` existente no projeto.

Depois de alterar HTML/CSS/JS, rode novamente:

```bash
npm run cap:sync
```

---

## Deploy

O projeto está preparado para frontend estático, especialmente Vercel.

O arquivo `vercel.json` contém rewrites para URLs limpas, como:

- `/gerador` → `/gerador.html`
- `/painel` → `/painel.html`
- `/orcamentos` → `/orcamentos.html`
- `/clientes` → `/clientes.html`
- `/veiculos` → `/veiculos.html`
- `/ordens` → `/ordens.html`
- `/ordem` → `/ordem.html`
- `/agenda` → `/agenda.html`
- `/recorrentes` → `/recorrentes.html`
- `/estoque` → `/estoque.html`
- `/relatorios` → `/relatorios.html`
- `/planos` → `/planos.html`
- `/sobre` → `/sobre.html`
- `/contato` → `/contato.html`
- `/privacidade` → `/privacidade.html`
- `/termos` → `/termos.html`
- `/manual` → `/manual.html`
- `/ver` → `/ver.html`

---

## Cuidados antes de publicar

Antes de publicar uma versão nova:

1. Testar login/logout.
2. Testar usuário Grátis, Básico e Premium.
3. Verificar se Premium não exibe teste grátis indevidamente.
4. Testar geração de orçamento em PDF.
5. Testar aprovação/recusa em `ver.html`.
6. Testar cadastro de cliente.
7. Testar cadastro de veículo.
8. Testar criação e visualização de OS.
9. Testar fotos antes do serviço.
10. Testar assinatura do cliente.
11. Testar PDF da OS com assinatura.
12. Testar painel e upload da logo.
13. Testar agenda e recorrentes.
14. Testar estoque com categorias/subcategorias.
15. Testar no celular/app Android.

---

## Comandos úteis

```bash
npm install
npm run check
npm run cap:sync
npm run android:debug
npm run android:release
```

---

## Observações de manutenção

O projeto ainda possui dívida técnica por ter evoluído com correções incrementais.

Prioridades de refatoração recomendadas:

1. Consolidar scripts globais em `fs-global.js` ou `fs-loader.js`.
2. Separar CSS inline de `index.html` para `index.css`.
3. Separar CSS inline de `gerador.html` para `gerador.css` e `gerador-pdf.css`.
4. Separar `auth.js` em autenticação, perfil/localStorage e UI de login.
5. Consolidar correções do painel dentro de `painel.js`.
6. Consolidar correções da OS dentro de `ordem.js`.
7. Consolidar layout mobile e correções de contraste no CSS principal.
8. Reduzir carregamento dinâmico no `config.js`.

---

## Autor

Filipi Aparecido dos Santos
