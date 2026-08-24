---
title: "Briefing interno — nova estrutura de pagamentos"
description: "Fonte de verdade do que já foi entregue no Linear, para escrever a documentação pública de Pagamentos."
noindex: true
---

# Briefing: nova estrutura de pagamentos

Documento interno. **Não é a página da central de ajuda.** Serve para escrever `/pagamentos` (e atualizar as páginas antigas de marcas e criadores) sem copiar o que ainda está no ar.

Fonte: Linear (time Conty - Produto), varredura em 24/08/2026. Guarda-chuva principal: [PRODUTO-201](https://linear.app/conty-eng/issue/PRODUTO-201/pagamentos-build-para-prod) — marcado **Deployado** em 24/08/2026.

A documentação pública atual ainda descreve **Stripe Connect + até 32 dias**. Isso está desatualizado em relação ao trilho novo (Asaas). Há convivência com o legado — ver seção 8.

---

## 1. O que mudou, em uma frase

A Conty saiu de um trilho em que o Stripe Connect depositava na conta do criador em até 32 dias, para um **ledger próprio + Asaas (BaaS, instituição autorizada pelo BACEN)**: a marca deposita na Conty, o dinheiro entra como saldo (pendente e depois liquidado), a campanha consome esse saldo, o criador recebe na carteira Asaas e **saca via Pix** depois do cadastro (KYC) e da liquidação.

---

## 2. Modelo novo (o que a central de ajuda precisa explicar)

### 2.1 Dois lados, um ledger

| Quem | O que vê | Quando o dinheiro “é de verdade” |
| --- | --- | --- |
| **Marca** | Carteira / Cobrança na web | Depósito confirmado vira saldo **pendente** (já usável em campanha). Vira **disponível** quando o PSP liquida. |
| **Criador** | Carteira no app | Recebimento nasce **pendente** até a transferência Asaas concluir (`TRANSFER_DONE`). Só então dá para sacar. |

Decisão de produto já deployada ([PRODUTO-152](https://linear.app/conty-eng/issue/PRODUTO-152/alteracoes-no-fluxo-de-saldo-pending-e-repasses)):

1. A marca **pode gastar o pending** (criar/aumentar campanha e pagar criador) mesmo antes da liquidação.
2. O criador **não saca** enquanto o lastro da marca não liquidou.
3. Boleto segue a mesma lógica (o gap é D+1 útil, não ~32 dias).
4. Antecipação Asaas **não** faz parte do desenho atual.

### 2.2 Fluxo da marca (depósito → campanha → pagamento)

1. Adiciona saldo (Pix, boleto ou cartão de crédito).
2. O pagamento confirmado aparece no extrato mesmo antes de liquidar ([PRODUTO-144](https://linear.app/conty-eng/issue/PRODUTO-144/deposito-pago-nao-aparece-no-extrato-enquanto-nao-liquida)).
3. No boleto, a tela passa a “Pagamento confirmado” no `CONFIRMED`, com copy de que o saldo entra na liquidação — não fica preso em “Aguardando pagamento” ([PRODUTO-122](https://linear.app/conty-eng/issue/PRODUTO-122/fix-boleto-no-deposito-feedback-pos-pagamento-linha-digitavel-sumindo)).
4. Cartão cobra direto no depósito (sem tokenizar cartão salvo) ([PRODUTO-133](https://linear.app/conty-eng/issue/PRODUTO-133/cobranca-de-cartao-direta-no-deposito-sem-tokenizar), [PRODUTO-134](https://linear.app/conty-eng/issue/PRODUTO-134/front-deposito-credit-card-com-cobranca-direta-sem-tokenizar)).
5. Orçamento da campanha sai do **provisionamento**, não do saldo livre. O que sobrar ao encerrar volta para o saldo livre ([PRODUTO-8](https://linear.app/conty-eng/issue/PRODUTO-8/pagamento-de-criador-deve-sair-do-provisionamento-nao-do-saldo-da)).
6. Extrato da marca unificado (legado Stripe + depósitos Asaas), paginado no servidor ([PRODUTO-221](https://linear.app/conty-eng/issue/PRODUTO-221/extrato-da-marca-unificar-e-paginar-no-servidor)).

Prazos de liquidação do PSP (Asaas), úteis para FAQ:

| Método | Confirmação | Liquidação típica | A marca já usa? | O criador já saca? |
| --- | --- | --- | --- | --- |
| Pix | Segundos | Imediata / já liquidado | Sim | Sim, depois do `TRANSFER_DONE` |
| Boleto | Na hora do pagamento (`CONFIRMED`) | ~D+1 útil (`RECEIVED`) | Sim (pending) | Não até liquidar |
| Cartão | Na hora (`CONFIRMED`) | ~D+30 (`RECEIVED`) | Sim (pending) | Não até liquidar |

Cartão continua **1x** (parcelamento fora de escopo).

### 2.3 Fluxo do criador (KYC → receber → sacar)

1. **Cadastro facial / KYC** no Asaas. Copy no app deixou de dizer “KYC” e passou a “cadastro facial”. Enquanto está em análise, há banner na Início e na Carteira ([PRODUTO-123](https://linear.app/conty-eng/issue/PRODUTO-123/pagamentos-asaas-saldo-so-apos-liquidacao-extrato-de-falhas-banner-kyc), [PRODUTO-224](https://linear.app/conty-eng/issue/PRODUTO-224/ajustar-o-layout-do-fluxo-de-pagamentos-no-app)).
2. Salva **chave Pix** para transferência ([PRODUTO-219](https://linear.app/conty-eng/issue/PRODUTO-219/poder-salver-chave-de-transferencia)).
3. Quando a marca aprova o conteúdo, o valor entra na carteira como **pendente** até a transferência master → subconta concluir. Só então vira disponível para saque ([PRODUTO-121](https://linear.app/conty-eng/issue/PRODUTO-121/saldo-so-apos-liquidacao-extrato-mostra-falhas)).
4. Saque via Pix. Comprovante mostra **pendente** (relógio) até liquidar, não check verde imediato ([PRODUTO-224](https://linear.app/conty-eng/issue/PRODUTO-224/ajustar-o-layout-do-fluxo-de-pagamentos-no-app)).
5. Extrato redesenhado: entrada vs saída, badge de status, hora, chave Pix, falhas riscadas sem comprovante ([PRODUTO-225](https://linear.app/conty-eng/issue/PRODUTO-225/redesenhar-o-extrato-da-conta-no-app)).
6. Saldo da home lê o ledger Asaas, igual à carteira ([PRODUTO-146](https://linear.app/conty-eng/issue/PRODUTO-146/saldo-na-home-nao-esta-sincronizado-com-saldo-da-carteira)).
7. Saldo legado Stripe **não some**: entra como pendente. Disponível para saque continua sendo só o ledger Asaas ([PRODUTO-123](https://linear.app/conty-eng/issue/PRODUTO-123/pagamentos-asaas-saldo-so-apos-liquidacao-extrato-de-falhas-banner-kyc)).
8. Extrato também lista movimentações do modelo antigo (não fica “Nenhuma movimentação encontrada” com saldo na carteira) ([PRODUTO-229](https://linear.app/conty-eng/issue/PRODUTO-229/extrato-do-creator-vazio-mesmo-com-saldo-do-modelo-antigo)).

Taxa do criador (ainda vigente na doc atual, não contradita no Linear): **5%** sobre o valor aprovado.

Há tela de **Cronograma de recebimentos**. No teste pós-deploy, valores Stripe pendentes não apareciam nela — isso foi tratado no pacote de correções [PRODUTO-230](https://linear.app/conty-eng/issue/PRODUTO-230/corrigir-a-nova-funcionalidade-de-pagamentos). Confirmar no app antes de documentar o cronograma como fonte confiável de “quando cai”.

### 2.4 Formato de campanha novo: Permuta

Já em produção ([PRODUTO-97](https://linear.app/conty-eng/issue/PRODUTO-97/pagamento-por-permuta)):

- No formato de pagamento da campanha existe a opção **Permuta**.
- A marca descreve o item (ex.: “Tênis Nike Air Max”).
- Para o criador, o valor em R$ vira o rótulo **PERMUTA**; a descrição aparece em Sobre a campanha.
- O fluxo de envio e aprovação é o mesmo. **Não há pagamento em dinheiro** depois da aprovação.

### 2.5 Taxa da Conty no depósito da marca

Já em produção ([PRODUTO-77](https://linear.app/conty-eng/issue/PRODUTO-77/ajustar-a-taxa-da-conty-no-ato-do-deposito-de-saldo-da-marca)). Taxa **regressiva** sobre o valor bruto depositado:

| Faixa | Taxa |
| --- | --- |
| R$ 500 a R$ 9.999,99 | 15% |
| R$ 10.000 a R$ 24.999,99 | 12,5% |
| R$ 25.000 a R$ 49.999,99 | 10% |
| R$ 50.000 a R$ 99.999,99 | 7,5% |
| R$ 100.000+ | 6,5% |

A doc pública atual **não** tem essa tabela e ainda mistura mínimo de R$ 200 com R$ 5.000 — precisa ser conferida no produto antes de republicar números.

### 2.6 Pagamento condicional (não mudou)

Aprovação de candidatura **não** paga. Só a aprovação final da entrega libera o repasse. Conteúdo recusado não gera custo e permanece com marca d'água. Isso continua válido e já está em `/help-center/rules/conditional-payment`.

---

## 3. O que a central de ajuda atual ainda diz (e precisa ser reescrito)

Páginas vivas hoje:

- Marcas: `help-center/brands/payments-credits.mdx`
- Criadores: `help-center/creators/payouts.mdx` e `payouts-recebimentos.mdx`
- Regras: `help-center/rules/reembolso.mdx`, `conditional-payment.mdx`
- Stub novo: `pagamentos/index.mdx`

Trechos que **não batem** com o trilho Asaas:

| Na doc atual | No produto novo (Linear) |
| --- | --- |
| Repasse via **Stripe Connect**, até **32 dias**, extrato do banco como “STRIPE” | Carteira Asaas + saque **Pix**; pending até liquidar / `TRANSFER_DONE` |
| KYC descrito como Stripe, conta PF, CEP, conta no mesmo nome | KYC Asaas (“cadastro facial”), chave Pix salva, banner em análise |
| Verba “disponível para uso imediato” após o depósito | Confirmado ≠ liquidado. Marca usa pending; criador não saca até liquidar |
| Multa de **50%** ao pausar campanha com vídeos aguardando | Regra nova de **30%** no encerramento à força **ainda não foi deployada** ([PRODUTO-62](https://linear.app/conty-eng/issue/PRODUTO-62/encerrar-campanha-com-pendencias-repasse-de-30percent-no-trilho-de)) |
| Sem Permuta | Permuta já existe |
| Sem tabela de taxa regressiva da marca | Tabela da seção 2.5 |
| Mínimo R$ 200 **e** R$ 5.000 no mesmo arquivo | Conflito interno da doc; validar no produto |

Selo Asaas (`snippets/asaas-disclaimer.mdx`) já está nas páginas. Manter. A frase “processamento atual via Stripe Connect” precisa sair ou virar nota de legado.

---

## 4. Inventário Linear — o que já foi feito (Deployado)

### 4.1 Guarda-chuva de produção

| Issue | Título | Quando | O que entrega para a doc |
| --- | --- | --- | --- |
| [PRODUTO-201](https://linear.app/conty-eng/issue/PRODUTO-201/pagamentos-build-para-prod) | [PAGAMENTOS] Build para prod | 24/08/2026 | Pacote em produção. Sub-issues abaixo. |
| [PRODUTO-227](https://linear.app/conty-eng/issue/PRODUTO-227/validacao-e-testes-finaiscorrecoes) | Validação e testes finais | 24/08/2026 | Fechamento do build |
| [PRODUTO-230](https://linear.app/conty-eng/issue/PRODUTO-230/corrigir-a-nova-funcionalidade-de-pagamentos) | Corrigir a nova funcionalidade | 24/08/2026 | Pacote de bugs de QA (ver 4.4) |

Sub-issues de **PRODUTO-201** (todas Deployado, exceto as duas de legado/flags que seguem em backlog — seção 5):

| Issue | Título | Nota para a doc |
| --- | --- | --- |
| [PRODUTO-214](https://linear.app/conty-eng/issue/PRODUTO-214/endurecer-settlement-de-saque-e-webhooks) | Endurecer settlement de saque e webhooks | Saque em prod sem intervenção manual |
| [PRODUTO-215](https://linear.app/conty-eng/issue/PRODUTO-215/alinhar-os-testes-e-matar-os-orfaos) | Alinhar testes e saque órfão | Interno |
| [PRODUTO-217](https://linear.app/conty-eng/issue/PRODUTO-217/centralizar-regras-e-tipos) | Centralizar regras e tipos | Status de depósito, payout, saque, KYC |
| [PRODUTO-219](https://linear.app/conty-eng/issue/PRODUTO-219/poder-salver-chave-de-transferencia) | Salvar chave de transferência | Criador cadastra/salva chave Pix |
| [PRODUTO-221](https://linear.app/conty-eng/issue/PRODUTO-221/extrato-da-marca-unificar-e-paginar-no-servidor) | Extrato da marca unificado | Uma lista só, com “carregar mais” |
| [PRODUTO-224](https://linear.app/conty-eng/issue/PRODUTO-224/ajustar-o-layout-do-fluxo-de-pagamentos-no-app) | Layout do fluxo no app | Navegação, comprovante pendente, copy de cadastro facial |
| [PRODUTO-225](https://linear.app/conty-eng/issue/PRODUTO-225/redesenhar-o-extrato-da-conta-no-app) | Extrato do app redesenhado | Entrada/saída, status, falhas |
| [PRODUTO-228](https://linear.app/conty-eng/issue/PRODUTO-228/saldo-que-deve-definir-roteamento-do-pagamento) | Saldo define roteamento | Qual saldo (Asaas vs legado) manda no pagamento |

### 4.2 Trilho Asaas — API, web e app (agosto)

| Issue | Superfície | O que mudou para o usuário |
| --- | --- | --- |
| [PRODUTO-121](https://linear.app/conty-eng/issue/PRODUTO-121/saldo-so-apos-liquidacao-extrato-mostra-falhas) | API | Recebimento do criador nasce pendente; boleto só madura no `RECEIVED`; falhas aparecem no extrato |
| [PRODUTO-123](https://linear.app/conty-eng/issue/PRODUTO-123/pagamentos-asaas-saldo-so-apos-liquidacao-extrato-de-falhas-banner-kyc) | App | Stripe legado vira pendente; banner “Documentos em análise”; falhas riscadas |
| [PRODUTO-122](https://linear.app/conty-eng/issue/PRODUTO-122/fix-boleto-no-deposito-feedback-pos-pagamento-linha-digitavel-sumindo) | Web | Boleto: confirmação na hora + linha digitável que não some |
| [PRODUTO-133](https://linear.app/conty-eng/issue/PRODUTO-133/cobranca-de-cartao-direta-no-deposito-sem-tokenizar) / [134](https://linear.app/conty-eng/issue/PRODUTO-134/front-deposito-credit-card-com-cobranca-direta-sem-tokenizar) | API + Web | Cartão cobra na hora, sem tokenizar |
| [PRODUTO-144](https://linear.app/conty-eng/issue/PRODUTO-144/deposito-pago-nao-aparece-no-extrato-enquanto-nao-liquida) | Web | Depósito pago aparece no extrato como pendente / “a caminho” |
| [PRODUTO-146](https://linear.app/conty-eng/issue/PRODUTO-146/saldo-na-home-nao-esta-sincronizado-com-saldo-da-carteira) | App | Home e carteira mostram o mesmo saldo Asaas |
| [PRODUTO-152](https://linear.app/conty-eng/issue/PRODUTO-152/alteracoes-no-fluxo-de-saldo-pending-e-repasses) | API + Web | Pending da marca é gastável; criador só saca depois da liquidação |
| [PRODUTO-172](https://linear.app/conty-eng/issue/PRODUTO-172/mobile-repensar-em-como-podemos-melhorar-a-forma-de-exibir-pagamentos) | App | Melhoria visual de pagamentos pendentes |
| [PRODUTO-229](https://linear.app/conty-eng/issue/PRODUTO-229/extrato-do-creator-vazio-mesmo-com-saldo-do-modelo-antigo) | App | Extrato mostra o modelo antigo também |

### 4.3 Regras de negócio já em produção (não só o trilho Asaas)

| Issue | O que documentar |
| --- | --- |
| [PRODUTO-8](https://linear.app/conty-eng/issue/PRODUTO-8/pagamento-de-criador-deve-sair-do-provisionamento-nao-do-saldo-da) | Pagamento do criador sai do **orçamento reservado da campanha** |
| [PRODUTO-77](https://linear.app/conty-eng/issue/PRODUTO-77/ajustar-a-taxa-da-conty-no-ato-do-deposito-de-saldo-da-marca) | Taxa regressiva no depósito |
| [PRODUTO-97](https://linear.app/conty-eng/issue/PRODUTO-97/pagamento-por-permuta) | Formato Permuta |

### 4.4 Bugs encontrados no QA do trilho novo (PRODUTO-230)

Comentários de 22/08 no Linear — vários viraram PRs ([Conty-api#230](https://github.com/Conty-App/Conty-api/pull/230), [#231](https://github.com/Conty-App/Conty-api/pull/231), [Conty2.0#232](https://github.com/Conty-App/Conty2.0/pull/232)) e a issue foi **Deployada**. Ainda assim, a doc deve descrever o comportamento **esperado**, e o time precisa confirmar no app se estes pontos fecharam de verdade:

1. Cronograma de recebimentos vazio com saldo Stripe pendente.
2. Rótulo “Valor total gerado” deveria ser “Valor total sacado”; total não batia.
3. Saque já caiu na conta via Pix, mas o app ainda mostrava **pendente**.
4. KYC aprovado sem notificação e sem confirmação na tela; precisava de refresh; campo legado “atualize seus dados” persistia.
5. Saldo não atualiza em tempo real (precisa refresh).
6. Notificações de conteúdo aprovado não estavam saindo (pode ser vizinho do fluxo, não só pagamento).

Se o refresh ainda for necessário, a FAQ da carteira deve dizer isso com honestidade.

---

## 5. O que ainda não está pronto (não documentar como se existisse)

| Issue | Status | Por que importa para a doc |
| --- | --- | --- |
| [PRODUTO-218](https://linear.app/conty-eng/issue/PRODUTO-218/validar-onde-estamos-com-o-legado-teste-final) | Backlog (arquivada no guarda-chuva) | **Dois sistemas convivem.** Ponte Stripe → ledger Asaas no shortfall do payout. Creators com Stripe Connect + subconta Asaas. Encerramento de campanha com pendências ainda no trilho legado. |
| [PRODUTO-216](https://linear.app/conty-eng/issue/PRODUTO-216/validacoes-de-transferencia-e-feature-flags) | Backlog | Flag `payments` por tenant (ligada na Conty, desligada na Magalu). Depósito e saque ainda não têm kill switch separado. |
| [PRODUTO-62](https://linear.app/conty-eng/issue/PRODUTO-62/encerrar-campanha-com-pendencias-repasse-de-30percent-no-trilho-de) | Backlog | Multa/repasse de **30%** ao encerrar com conteúdo já enviado **não está no trilho novo**. A página de marcas ainda fala 50%. |
| [PRODUTO-104](https://linear.app/conty-eng/issue/PRODUTO-104/repensar-reembolso) | Backlog | Política de reembolso precisa ser revista; a página legal (CDC 7 dias) continua. |
| [PRODUTO-9](https://linear.app/conty-eng/issue/PRODUTO-9/pagamento-por-view-nao-contabilizando) / [PRODUTO-19](https://linear.app/conty-eng/issue/PRODUTO-19/o-valor-das-campanhas-pagas-por-view-nao-esta-sendo-contabilizado-no) | Backlog | Pagamento por views **não** está confiável; não vender como automático. |
| [PRODUTO-15](https://linear.app/conty-eng/issue/PRODUTO-15/passar-feature-de-pagamentos-para-a-api) | Em progresso | Migração para a API; filhos 30/31/32 foram **cancelados** (substituídos pelo trabalho Asaas). |
| [PRODUTO-100](https://linear.app/conty-eng/issue/PRODUTO-100/pagamentos-bugs) | Em progresso | Guarda-chuva de bugs, sem filhos. |
| [PRODUTO-232](https://linear.app/conty-eng/issue/PRODUTO-232/mudar-a-rota-de-pagamentos-de-campanha-na-web-para-o-approve-de) | Para iniciar | Rota de pagamento de campanha na web. |
| [PRODUTO-84](https://linear.app/conty-eng/issue/PRODUTO-84/melhorar-ui-do-saque) | Backlog | UI de saque ainda pode mudar. |
| [PRODUTO-61](https://linear.app/conty-eng/issue/PRODUTO-61/exibir-nome-da-marca-dentro-da-aba-de-saldo-junto-ao-valor) | Backlog | Extrato do criador ainda não mostra o nome da marca. |

Chargeback / estorno **depois** da liquidação: fora de escopo do que foi para prod. Não escrever que a marca “sempre” recupera dinheiro em chargeback.

---

## 6. Roteiro sugerido para a documentação pública

Quando for escrever `/pagamentos` (e atualizar as páginas antigas), cobrir nesta ordem:

### Para marcas

1. O que é a carteira pré-paga e quem processa (Asaas / BACEN).
2. Como adicionar saldo: Pix, boleto, cartão; o que acontece na confirmação vs na liquidação.
3. Taxa regressiva da Conty no depósito.
4. Pending usável em campanha; criador só saca depois.
5. Provisionamento: o orçamento da campanha é que paga o criador.
6. Extrato / transações.
7. Formatos: valor fixo, por views (com ressalva de que a automatização ainda tem bugs), **Permuta**.
8. Pagamento condicional (link para regras).
9. Reembolso (CDC 7 dias) — sem inventar o que [PRODUTO-104](https://linear.app/conty-eng/issue/PRODUTO-104/repensar-reembolso) ainda não fechou.
10. Pausar/encerrar campanha com pendências: **não** documentar 30% até o [PRODUTO-62](https://linear.app/conty-eng/issue/PRODUTO-62/encerrar-campanha-com-pendencias-repasse-de-30percent-no-trilho-de) ir para prod; a regra de 50% da página atual também precisa ser validada com operação.

### Para criadores

1. Cadastro facial (KYC Asaas), banner de análise, o que fazer se pedir documentos.
2. Salvar chave Pix.
3. Como o valor entra: pendente → disponível → saque.
4. Por que um recebimento pode ficar pendente mesmo com a marca já tendo pago (cartão D+30, boleto D+1).
5. Taxa de 5%.
6. Extrato: tipos de lançamento, falhas, comprovante de saque.
7. Permuta (não cai dinheiro).
8. Legado Stripe: saldo antigo aparece como pendente; saque só no trilho Asaas.
9. Pagamento condicional.

---

## 7. Números e copies que **faltam validar no produto** antes de publicar

O Linear descreve comportamento; estes valores **não** foram reconfirmados na UI em 24/08:

- Valor mínimo/máximo de depósito (a doc atual se contradiz: R$ 200 vs R$ 5.000).
- Copy exata de “a caminho”, “pendente”, “cadastro facial”, “Valor total sacado”.
- Se o cronograma de recebimentos já lista lastro Stripe + Asaas.
- Se saldo atualiza sem pull-to-refresh.
- Se KYC aprovado gera push/e-mail.
- Validade de 12 meses da verba (está na doc antiga; nenhuma issue nova confirmou ou revogou).

---

## 8. Links rápidos

- Guarda-chuva prod: https://linear.app/conty-eng/issue/PRODUTO-201
- Correções de QA: https://linear.app/conty-eng/issue/PRODUTO-230
- Pending + lastro: https://linear.app/conty-eng/issue/PRODUTO-152
- Permuta: https://linear.app/conty-eng/issue/PRODUTO-97
- Taxa da marca: https://linear.app/conty-eng/issue/PRODUTO-77
- Doc pública velha (marcas): `/help-center/brands/payments-credits`
- Doc pública velha (criadores): `/help-center/creators/payouts` e `/help-center/creators/payouts-recebimentos`
- Stub da seção nova: `/pagamentos`
