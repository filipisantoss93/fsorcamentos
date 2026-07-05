# FS Orçamentos — Android

Estrutura mínima para gerar o app Android do FS Orçamentos pela nuvem, usando GitHub Actions e Capacitor.

## Identificação do app

```txt
Nome do app: FS Orçamentos
Package name: br.com.fsorcamentos.app
URL carregada no app: https://fsorcamentos.com.br
```

O `package name` precisa continuar igual ao usado no Google Play Console.

## Arquivos principais

```txt
package.json
capacitor.config.json
www/index.html
.github/workflows/android-build.yml
.well-known/assetlinks-template.json
```

## Build pelo celular

1. Abra o repositório no GitHub pelo celular.
2. Entre em **Actions**.
3. Abra **Build Android App**.
4. Toque em **Run workflow**.
5. Escolha:
   - `debug_apk` para teste simples.
   - `release_aab` para gerar arquivo de publicação.
6. Baixe o artefato gerado.

## Publicação na Play Store

A Play Store usa `.aab`. Para gerar um `.aab` assinado, configure estes secrets no GitHub:

```txt
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

A chave precisa ser a mesma upload key aceita pelo app no Google Play Console.

## Asset Links

Use `.well-known/assetlinks-template.json` como modelo. Substitua:

```txt
SHA256_DA_CHAVE_AQUI
```

pelo SHA-256 da chave de assinatura e publique como:

```txt
.well-known/assetlinks.json
```

A URL final deve abrir assim:

```txt
https://fsorcamentos.com.br/.well-known/assetlinks.json
```

## Observação

O app Android carrega o site oficial. Então alterações feitas no site entram no app sem precisar gerar outro app, desde que não mude package name, permissões, ícone, splash ou configuração nativa.
