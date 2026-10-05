# Cor, tipografia e composição — HoloNews 2.6

Pesquisa consultada em 5 de outubro de 2026. Aplicação: jornal civil de campanha para Foundry VTT, com portal, notícias, editor e movimento editorial. O Prisma é a primeira aparência e foi excluído da reconstrução.

## Diagnóstico e critério de reconstrução

As alternativas anteriores ainda herdavam a geometria do Prisma: cabeçalho, divisão da manchete, cartões, famílias tipográficas e ornamentação. Trocar algumas variáveis não bastava para construir identidades. A mesma dupla cromática também alimentava marca, categoria, ação e efeito, aproximando coisas com funções diferentes.

Nesta versão, cada alternativa tem uma direção editorial, uma família de cores, uma hierarquia de títulos e uma composição de capa/feed. A administração continua reconhecível entre temas, porque escrever, salvar e publicar são as mesmas operações. As referências abaixo orientam escolhas; não são modelos reproduzidos nem alegações de endosso.

## Referências de fundamentos e sistemas

| Referência primária | O que foi estudado | Decisão aplicada |
| --- | --- | --- |
| [Adobe Color — roda cromática](https://color.adobe.com/create/color-wheel?content_language=English) | Relações monocromáticas, análogas e complementares | As famílias de acento são curtas e identificáveis. Harmonia cromática organiza a paleta; contraste de luminância decide se o texto é legível. |
| [Adobe — paletas](https://www.adobe.com/uk/creativecloud/design/discover/color-palette.html) | Consistência de uma seleção de cores e adequação ao contexto | Cada tema documenta base, superfície, texto e acento. Não se distribuem cores novas em cada componente. |
| [Adobe — cores complementares](https://www.adobe.com/uk/creativecloud/design/discover/complementary-colors.html) | Oposição e destaque | Complementares não são uma obrigação. A urgência usa cor semântica própria e rótulo; a superfície de leitura evita competição entre acentos. |
| [Adobe — degradês](https://www.adobe.com/uk/creativecloud/design/discover/color-gradient.html) | Transições, contexto, legibilidade e uso contido | Degradês percorrem matizes próximos ou variações da mesma família. Fundos de texto são sólidos; a maioria das ações é sólida. Pulsar concentra o tratamento de transmissão em poucos componentes. |
| [Carbon — visão geral de cor](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview) | Cor como parte de um sistema consistente | Variáveis têm funções, não apenas nomes de matizes: `paper`, `surface`, `field`, `body`, `muted`, `accent` e `on-accent`. |
| [Carbon — diretrizes de cor](https://www.carbondesignsystem.com/building-blocks/foundations/color/guidelines) | Camadas, campos, bordas e estados em temas escuros | Separação entre borda decorativa e borda de controle. Campos, painéis e fundo possuem níveis distintos; a seleção tem forma e estado além da cor. |
| [Carbon — tipografia](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview) | Hierarquia, escala e expressão em interfaces | Títulos expressivos separados de texto corrido e controles. Monoespaçada se concentra em metadados; texto corrido recebe família adequada à leitura. |
| [NN/g — bons exemplos de design visual](https://www.nngroup.com/articles/good-visual-design/) | Escala, alinhamento, grade e estratégia de cor | Manchete, resumo e imagem têm prioridade deliberada. Alinhamentos e intervalos se repetem dentro de cada identidade. |
| [NN/g — cinco princípios](https://www.nngroup.com/articles/principles-visual-design/) | Hierarquia, contraste, equilíbrio, escala e Gestalt | A diferenciação vem também da proximidade, do espaço e das proporções, não apenas da decoração. |
| [W3C — contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Luminância relativa e critérios para texto | Meta mínima de 4,5:1 inclusive para os pares testados de texto secundário; não depender da exceção de texto grande. |
| [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Uso da cor e contraste de elementos de interface | Urgência tem texto explícito; foco tem contorno; bordas necessárias para identificar controles são testadas a 3:1. |
| [W3C — CSS Color 4](https://www.w3.org/TR/css-color-4/) | Espaços de cor, luminância e interpolação | Harmonia e contraste são verificações diferentes. O CSS entregue usa hexadecimal e interpolação sRGB compatível; não presume implementação em OKLCH. |

## Referências editoriais e sci-fi

| Referência | Observação e aplicação própria |
| --- | --- |
| [The Guardian — design](https://design.theguardian.com/) | Referência de publicação editorial, com atenção à relação entre identidade, tipografia e organização de notícias. Gazeta privilegia regras, colunas e manchete serifada. |
| [Financial Times — guia histórico de interface](https://github.com/Financial-Times/ui-style-guide/blob/master/index.md) | O guia histórico explicita papéis para cores de marca e elementos de interface. A lição aplicada é distinguir identidade de ações; não copiar o rosa do jornal nem apresentar o guia antigo como norma atual. |
| [Pentagram — Netflix Queue](https://www.pentagram.com/work/netflix-queue) | Publicação com identidade constante e tratamentos editoriais expressivos, incluindo adaptação digital e capas animadas. Obsidiana explora fotografia dominante e manchetes serifadas; Pulsar, escala condensada e ritmo de cartaz. |
| [Territory Studio — Blade Runner 2049](https://territorystudio.com/project/blade-runner-2049/) | Interfaces desenhadas para contextos e tecnologias daquele universo. Aplicação: evitar um único “HUD sci-fi” em todo tema; preservar a função de jornal e escolher detalhes compatíveis com cada rede. |
| [Territory Studio — Dune](https://territorystudio.com/project/dune/) | Integração da linguagem visual com instrumentos, materiais e mundo narrativo. Dossiê usa composição de arquivo, separadores e bordas; a referência não vira uma tela de controle militar. |
| [Territory Studio — The Martian](https://territorystudio.com/project/the-martian/) | Interfaces utilitárias e linguagem visual vinculada ao equipamento. Terminal concentra densidade, metadados e listas; Orbital usa painéis e organização de uma edição entre estações. |

São 18 referências de fundamentos, sistemas, editoriais e interfaces narrativas. A seleção combina documentação de quem mantém os sistemas, estudos dos próprios estúdios e fontes normativas. Materiais de projetos cinematográficos inspiram contexto e composição, não comprovam usabilidade de um portal de notícias.

## Oito identidades implementadas

Todas mantêm superfícies escuras. Valores representam fundo, superfície, texto principal e acento; campos, textos secundários, bordas e estados também têm valores próprios no CSS.

| Tema | Paleta base / superfície / texto / acento | Tipografia de destaque | Composição |
| --- | --- | --- | --- |
| Gazeta | `#1f201e` / `#2b2c29` / `#f0ece3` / `#f49a85` | Source Serif 4, peso 700 | Jornal: marca central, manchete larga, resumo lateral, imagem abaixo e três colunas delimitadas por regras. Grafite quente, marfim e vermelhão contido. |
| Obsidiana | `#171619` / `#242227` / `#f2ede4` / `#dfc58f` | Source Serif 4, peso 400 e itálico | Revista de prestígio: fotografia ocupa cerca de dois terços da manchete; texto na lateral, feed de duas colunas sem caixas pesadas e imagens em alturas distintas. Família dourada. |
| Aurora | `#142235` / `#1c3048` / `#edf3fa` / `#b2d7fa` | IBM Plex Sans, peso 500 | Revista de comunidade: cabeçalho inserido, navegação em cápsulas, manchete dividida e grade de duas colunas desiguais. Azul celeste/índigo análogos. |
| Terminal | `#1a1913` / `#29271c` / `#f0ebd7` / `#f3cf72` | IBM Plex Sans; IBM Plex Mono na identidade | Boletim técnico civil: cabeçalho compacto, manchete centrada no texto, foto menor e feed em lista com miniaturas à direita. Família âmbar. |
| Dossiê | `#292624` / `#36312d` / `#f2eae0` / `#e7b092` | Source Serif 4, peso 600 | Arquivo editorial: navegação em abas, lombada, manchete enquadrada e duas colunas de registros numerados, com texto acima das fotos. Tons minerais e argila. |
| Orbital | `#111d30` / `#1b2d46` / `#edf4fc` / `#a8cfff` | Space Grotesk, peso 500 | Edição de estação: fotografia panorâmica com painel sólido de título abaixo, feed em dois painéis horizontais, órbitas discretas. Família de azuis de aviação. |
| Pulsar | `#24121f` / `#351c2d` / `#fbecf4` / `#f5a9ca` | Barlow Condensed, peso 600 | Revista de transmissão: título grande e condensado, capa em dois blocos, notícias alternando foto à esquerda e à direita. Família rosa, sinal e onda discretos. |
| Nexo | `#172323` / `#223433` / `#edf4f0` / `#a3dbc7` | Space Grotesk, peso 600 | Rede de informação: cabeçalho compacto, foto à esquerda da manchete e quadro de três colunas com nós e conectores. Família jade. |

As fontes são subconjuntos WOFF2 locais de famílias abertas. As famílias derivadas foram renomeadas, com copyrights e licenças OFL preservados em `assets/fonts`. A distribuição inclui esses avisos. Não há busca de fontes em CDN durante a execução. Alfabeto latino, extensões e pontuação estão incluídos; outros alfabetos usam fallback.

## Regras práticas adotadas

1. **Função antes de matiz.** Acento orienta ações e elementos da identidade. Texto de notícia usa tons neutros claros. Metadados continuam legíveis, sem receber a mesma intensidade da manchete.
2. **Degradê com propósito.** A variável da marca é separada da aparência dos botões. Sete temas usam ações principais sólidas; Pulsar usa transição curta da própria família em componentes específicos. As transições não atravessam pares arbitrários de cores opostas.
3. **Contraste em toda a transição.** Foram amostradas 11 posições por intervalo entre paradas. A verificação não se limita às duas extremidades. É uma amostragem do degradê sRGB entregue, não uma prova matemática de todos os pixels.
4. **Texto fora da fotografia.** Nenhuma manchete depende da imagem enviada pelo mestre para contrastar. Orbital pode levantar seu painel sobre a borda da capa, mas o título permanece em superfície sólida.
5. **Editorial antes de efeito.** Tipografia, fotografia, grade e espaço definem a identidade. Não há contadores técnicos inventados, texto ilegível de cenário ou ruído sobre os parágrafos.
6. **Sinais estáveis.** O rótulo “Urgente” acompanha a cor. Foco visível e seleção têm forma. Bordas decorativas podem ser discretas; bordas necessárias para identificar campos recebem uma variável de contraste própria.
7. **Leitura contínua.** Corpo de notícia com aproximadamente 64 caracteres de largura, tamanho base de 18 px e entrelinha de 1,8. A preferência de escala continua disponível; o editor usa a família de leitura do tema.
8. **Movimento finito.** As receitas de entrada, página, cartões, capa, conteúdo e alerta permanecem. Diagramas de Orbital/Pulsar/Nexo conservam seu ciclo de cancelamento; elementos herdados que repetiam a aparência do Prisma foram suprimidos nas alternativas.

## Evidência de verificação

A prévia usa os templates e os estilos do módulo. Foram capturados portal, feed, artigo, corpo de leitura, editor e janela de 390 px em cada uma das oito alternativas. A inspeção compara hierarquia, recorte das fotos, bordas, fontes e separação entre título e imagem.

Os testes de navegador medem os pares de tokens e também as cores computadas dos textos e fundos sólidos renderizados. Conferem carregamento das fontes, ampliação de texto em 140%, janelas de 760 e 390 px, ausência de sobreposição entre título e foto e oito assinaturas distintas de composição. A estrutura de teste do Foundry verifica que trocar qualquer tema mantém a mesma instância e o valor do ProseMirror.

| Tema | Menor contraste entre pares de texto testados | Menor contraste de borda de controle | Menor amostra de degradê / texto de ação |
| --- | --- | --- | --- |
| Gazeta | 6,56:1 | 4,62:1 | 5,25:1 |
| Obsidiana | 7,49:1 | 4,72:1 | 7,19:1 |
| Aurora | 7,09:1 | 5,20:1 | 8,15:1 |
| Terminal | 7,25:1 | 5,33:1 | 5,68:1 |
| Dossiê | 6,21:1 | 4,54:1 | 6,71:1 |
| Orbital | 6,88:1 | 5,72:1 | 6,98:1 |
| Pulsar | 7,11:1 | 4,80:1 | 7,14:1 |
| Nexo | 6,75:1 | 5,21:1 | 7,04:1 |

As medições de paleta são calculadas pela fórmula de luminância relativa do WCAG. A tabela inclui degradês de marca mesmo quando não são usados como fundo de botão; nesses casos representa uma verificação preventiva da combinação. Ela não deve ser interpretada como certificação de conformidade WCAG da aplicação inteira.

O arquivo `styles/prisma.css` permanece intacto. A captura da primeira aparência foi comparada com a captura anterior à reconstrução; a área do módulo manteve os mesmos pixels e medidas. A barra externa de demonstração recebe somente a nova identificação de versão.

Limites: Chromium e estrutura de teste de Foundry não substituem uma sessão em um mundo real Foundry 13 + HoloSuite Core. Fotografias da campanha, conteúdo enriquecido de terceiros e monitores diferentes podem alterar a experiência. O roteiro `docs/foundry-smoke-test.md` continua necessário para integração real; não há declaração de versão Foundry verificada no manifesto.
