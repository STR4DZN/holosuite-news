# HoloNews

HoloNews é um módulo de jornal digital in-world para Foundry VTT v13. Ele oferece duas experiências separadas:

- jogadores abrem um leitor somente de leitura pelo mosaico do HoloSuite;
- GMs abrem uma mesa editorial completa para criar, organizar, restringir, publicar e auditar conteúdo.

O número de visualizações mostrado nas matérias é narrativo e definido pelo GM. As leituras reais da mesa são telemetria privada, usada apenas no painel editorial.

## Estado desta entrega

Esta árvore implementa a versão 1.0.0 e possui validação local de tipos, lint, testes unitários, build, preview responsivo, revisão de segurança e empacotamento. A aceitação em um servidor real do Foundry e o teste multijogador permanecem um gate separado; consulte [docs/foundry-smoke-test.md](docs/foundry-smoke-test.md).

## Requisitos

- Foundry Virtual Tabletop v13;
- HoloSuite Core 1.0.12 ou superior;
- um usuário GM para criar e publicar conteúdo.

HoloNews não altera o DOM nem o código do HoloSuite Core. Ele usa apenas o contrato público `registerApp` e o hook `holosuite-core.apiReady`.

## Instalação

1. Instale e ative HoloSuite Core 1.0.12 ou superior.
2. Extraia o ZIP instalável em `Data/modules/holosuite-news`, preservando `module.json` na raiz dessa pasta.
3. Ative **HoloNews** na configuração de módulos do mundo.
4. Entre no mundo com um GM e aguarde a preparação das projeções publicadas.
5. Abra o mosaico **HoloNews** dentro do HoloSuite.

O mesmo mosaico abre a Mesa editorial para GMs e o Reader para jogadores.

## Primeiro jornal em menos de cinco minutos

1. Abra **HoloNews** como GM.
2. Use **Criação rápida**.
3. Preencha título, corpo, imagem, texto alternativo e visualizações narrativas.
4. Opcionalmente cadastre autor, categoria, visibilidade por usuário e matérias relacionadas.
5. Use o preview como jogador.
6. Na lista de edições, selecione **Publicar**.
7. Abra HoloNews com um jogador, abra a matéria e confira o número narrativo.
8. Volte à seção **Leituras reais** como GM para verificar a abertura daquele jogador.

## Recursos

- múltiplas Publicações, cada uma com identidade, cores e um dos sete temas (incluindo as duas listas citadas no planejamento: Modern News e Tabloid);
- ciclo de Edição: rascunho, agendada, publicada, arquivada e oculta;
- publicação agendada, verificada pelo GM primário ativo;
- Páginas compostas por 16 tipos de bloco, com ordenação, duplicação e drag-and-drop;
- Matérias com ProseMirror nativo do Foundry, imagens, tags, badges, atualizações e links Foundry;
- autores, categorias, views narrativas, relações e status de leitura local;
- visibilidade `all`, `gm-only`, `specific-users` e `exclude-users`;
- arquivo, busca, modo lista, páginas impressas e navegação interna com histórico;
- duplicação de Edição, Página e Matéria;
- templates de Edição, backup JSON e importação validada;
- dashboard, audit log e telemetria privada de leitura;
- preferências locais de escala de fonte, alto contraste e redução de movimento;
- API pública e hooks de integração.

## Segurança e armazenamento

O estado editorial completo fica em um `JournalEntry` de Master data com permissão padrão `NONE`. Jogadores recebem apenas um `JournalEntry` de projeção específico para seu usuário, criado por allowlist. A projeção nunca inclui rascunhos, notas do GM, agenda futura, regras de visibilidade, audit log ou leituras reais.

A identidade de quem abriu uma matéria não vem do payload do socket. O jogador grava um sinal em seu próprio documento `User`; o GM deriva a identidade do documento atualizado, valida se aquela matéria estava publicada para esse usuário, registra a leitura e limpa o sinal. Mensagens de socket servem apenas como aviso de que há trabalho pendente.

Detalhes e matriz OWASP: [docs/security-review.md](docs/security-review.md).

## API

O mesmo objeto é exposto em:

```js
game.holosuiteNews
game.modules.get("holosuite-news").api
globalThis.HoloNews
```

Exemplos somente de leitura:

```js
await game.holosuiteNews.getPublications();
await game.holosuiteNews.getPublishedIssues();
await game.holosuiteNews.getPublishedArticles();
game.holosuiteNews.openLatestIssue();
game.holosuiteNews.openArticle("article-id");
```

Métodos administrativos permanecem protegidos no núcleo e rejeitam jogadores mesmo quando chamados diretamente. Consulte [docs/api.md](docs/api.md).

## Desenvolvimento

Requer Node.js 22 ou superior.

```text
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run validate
npm run package
```

`npm run package` produz dois artefatos separados na pasta `outputs` do workspace:

- `holosuite-news-v1.0.0.zip`: pacote instalável, sem fontes e testes;
- `holosuite-news-v1.0.0-source.zip`: snapshot completo para auditoria.

Cada ZIP recebe um arquivo `.sha256` externo. O hash nunca é incluído dentro do próprio ZIP.

## Limites da evidência

Testes unitários, preview, Playwright, build e inspeção de ZIP demonstram apenas comportamento local. Eles não provam persistência real do Foundry, permissões de documento em rede, reconexão, compatibilidade com sistemas de jogo ou propagação multicliente. Esses itens precisam ser executados no procedimento de smoke test antes de classificar o pacote como validado em host real.

## Licença

All rights reserved. Consulte [LICENSE](LICENSE).
