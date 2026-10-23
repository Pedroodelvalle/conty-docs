# conty-docs

Documentação pública da Conty em Mintlify. Um site, dois produtos no seletor do topo
(`docs.json` → `navigation.products`):

- **Central de ajuda**: tutoriais para marcas e creators (`index.mdx`, `marcas/`,
  `criadores/`, `pagamentos/`, `legal/`). `help-center/` é a doc antiga, escondida
  (`"hidden": true`); não editar nem linkar.
- **API** (tag Beta): a API pública `/public/v1` e os webhooks, tudo em `api/`.

Merge na `main` publica (app do GitHub no Mintlify). Branch e PR sempre a partir da `main`.

## A API não é escrita à mão aqui

A fonte da verdade é a **Conty-api**. Rotas e schemas da API pública são zod com
`.openapi()` em `src/features/open-api/` e `src/features/coupons/open.routes.ts`;
o documento sai do código.

`api/openapi.json` é **gerado**. Nunca editar à mão. Mudou rota, schema,
descrição ou exemplo na api:

```bash
cd ../Conty-api
npm run -s openapi:export > /tmp/openapi.json
cp /tmp/openapi.json ../conty-docs/api/openapi.json
```

Na mesma entrega, no mesmo PR de docs:

| Mudou na Conty-api | Atualizar aqui |
|---|---|
| Rota nova ou removida | `api/openapi.json` + a página `"MÉTODO /caminho"` no grupo certo da aba Referência em `docs.json` |
| Campo, regra ou significado de valor (ex.: `commission_rate_bps = 0` é cupom só de rastreio) | `api/openapi.json` + a página de referência do recurso (`api/referencia/*.mdx`) + o guia que usa o campo (`api/guias/*.mdx`) |
| Evento de webhook (`WEBHOOK_EVENT_CATALOG` em `features/webhooks/constants.ts`) | `api/webhooks/eventos/*.mdx` (payload de exemplo igual ao real) |
| Erro, limite, autenticação | `api/autenticacao.mdx` ou `api/referencia/introducao.mdx` |
| Qualquer mudança de contrato | Entrada em `api/changelog.mdx` (`<Update>`), antes de ir para o ar |

O texto tem que bater com o código: nome de campo, status HTTP, código de erro e
exemplo de payload copiados da api, não reescritos de memória.

## Estrutura da aba API

- `api/introducao`, `api/quickstart`, `api/autenticacao`: Comece aqui.
- `api/guias/`: um guia por fluxo de ponta a ponta (ex.: `cupom-por-creator`).
- `api/webhooks/`: visão geral, assinatura, eventos por domínio, retentativas.
- `api/referencia/`: `introducao` + uma página `.mdx` por recurso, seguida das
  páginas geradas do OpenAPI (`"openapi": "api/openapi.json"` no grupo,
  `"GET /coupons"` como página).
- `api/ia/`: MCP e skills.
- `api/changelog`: histórico do contrato.

## Padrão de escrita

- pt-BR, direto, segunda pessoa ("a sua loja", "você"). Sem travessão (`—`).
- Frontmatter com `title`, `description`, `icon` e `keywords`.
- Dinheiro sempre em centavos (`*_cents`) e taxa em pontos-base (`*_bps`, `2500` = 25%),
  como a api devolve.
- Exemplos com dados fictícios plausíveis; nunca dado real de marca ou creator.
- Componentes do Mintlify (`<Note>`, `<Steps>`, `<CodeGroup>`, `<Update>`) em vez de HTML.

## Rodar e validar

```bash
npx mint@latest dev --port 3333
npx mint@latest validate
npx mint@latest broken-links
```

`validate` já confere o `api/openapi.json`. Os dois passam antes de abrir PR. Não commitar `.DS_Store`.
