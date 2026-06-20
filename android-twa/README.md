# FS Orçamentos — Android TWA

Este diretório prepara a publicação do FS Orçamentos como app Android usando Trusted Web Activity (TWA).

## Estado atual

O site já possui a base PWA:

- `manifest.json`
- `service-worker.js`
- `offline.html`
- `pwa-icon.svg`
- registro do service worker via `fs-pwa-register.js`

## Identificação recomendada

```txt
Nome do app: FS Orçamentos
Package name: br.com.fsorcamentos.app
URL inicial: https://fsorcamentos.com.br/index.html
Host: fsorcamentos.com.br
Tema: #3e2723
```

## Etapa 1 — Instalar ferramentas no computador

No computador, instale:

- Node.js LTS
- Java/JDK compatível com Android build
- Android Studio ou Android SDK Command Line Tools
- Bubblewrap CLI

Comandos básicos:

```bash
npm install -g @bubblewrap/cli
bubblewrap doctor
```

Corrija tudo que o `bubblewrap doctor` apontar antes de gerar o app.

## Etapa 2 — Gerar projeto Android

Use o manifesto publicado:

```bash
bubblewrap init --manifest=https://fsorcamentos.com.br/manifest.json
```

Quando o Bubblewrap perguntar os dados, use:

```txt
Application ID / Package name: br.com.fsorcamentos.app
Name: FS Orçamentos
Launcher name: FS Orçamentos
Host: fsorcamentos.com.br
Start URL: /index.html
Theme color: #3e2723
Navigation color: #3e2723
```

## Etapa 3 — Chave de assinatura

Crie uma chave de produção e guarde fora do repositório.

Nunca envie `.keystore`, `.jks`, `.pem`, `.key` ou senhas para o GitHub.

Exemplo:

```bash
keytool -genkeypair \
  -alias fsorcamentos \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore fsorcamentos-release.keystore
```

## Etapa 4 — Gerar SHA-256

Depois de criar a chave, rode:

```bash
keytool -list -v \
  -keystore fsorcamentos-release.keystore \
  -alias fsorcamentos
```

Copie o valor de `SHA256`. Ele será usado no `assetlinks.json`.

## Etapa 5 — Criar assetlinks.json real

Use o arquivo de modelo:

```txt
.well-known/assetlinks-template.json
```

Substitua:

```txt
SHA256_DA_CHAVE_AQUI
```

pelo SHA-256 da assinatura.

Depois publique como:

```txt
.well-known/assetlinks.json
```

O arquivo real precisa ficar acessível em:

```txt
https://fsorcamentos.com.br/.well-known/assetlinks.json
```

## Etapa 6 — Gerar AAB

Depois do assetlinks correto:

```bash
bubblewrap build
```

O arquivo de publicação será um `.aab`.

## Etapa 7 — Play Console

No Play Console, prepare:

- nome do app
- descrição curta
- descrição completa
- ícone 512x512
- feature graphic
- screenshots de celular
- política de privacidade
- declaração de segurança de dados
- classificação indicativa
- teste fechado ou produção

## Observação importante

O Google Play exige que apps novos e atualizações mirem um nível recente de API Android. Confirme no Bubblewrap/Gradle se o app está usando target SDK aceito antes de enviar para a Play Store.
