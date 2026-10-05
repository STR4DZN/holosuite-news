# HoloNews 2.6.0 — Oito identidades editoriais

Gazeta, Obsidiana, Aurora, Terminal, Dossiê, Orbital, Pulsar e Nexo reconstruídos com paletas, fontes, hierarquia e composição próprias. **Prisma preservado.**

- **Gazeta:** jornal serifado, grafite quente, vermelhão, marca central e feed em três colunas.
- **Obsidiana:** revista com fotografia dominante, serifas em itálico, dourado e amplo espaço entre notícias.
- **Aurora:** revista de comunidade em azuis próximos, painéis arredondados e grade desigual.
- **Terminal:** boletim civil âmbar, identidade monoespaçada, manchete centrada no texto e feed em lista.
- **Dossiê:** arquivo em tons minerais, abas, lombada e registros numerados.
- **Orbital:** azuis de aviação, capa panorâmica com painel sólido de manchete e notícias em painéis horizontais.
- **Pulsar:** família rosa, títulos condensados, capa em blocos e fotografias alternadas no feed.
- **Nexo:** família jade, manchete dividida e quadro de notícias com nós e conectores.

Texto de leitura em superfícies sólidas, funções de cor separadas e degradês restritos a matizes próximos. Fontes WOFF2 locais com licenças OFL incluídas. Portal, leitura, lista, editor e configurações acompanham o tema; trocar a aparência mantém o editor rico e o texto.

As animações de posts, páginas, cartões, capas e leitura continuam disponíveis. Orbital, Pulsar e Nexo conservam seus diagramas e movimentos finitos, com cancelamento ao navegar, fechar, ocultar a janela ou reduzir movimento.

Pesquisa com 18 referências primárias: Adobe, Carbon, W3C, NN/g, The Guardian, Financial Times, Pentagram e Territory Studio. Guia, decisões e contraste em `docs/color-design-research.md`.

Validação: TypeScript, lint, 38 testes unitários e 46 de navegador. Novas verificações incluem cores computadas renderizadas, fontes locais, texto em 140%, oito composições distintas e preservação do ProseMirror. Inspeção de portal, feed, artigo, leitura, editor e janela de 390 px nas oito alternativas. O CSS Prisma permanece intacto e a comparação de captura verifica a área do módulo.

A integração em um mundo real Foundry 13 + HoloSuite Core continua pendente; o manifesto não declara uma versão verificada. Use `docs/foundry-smoke-test.md`.
