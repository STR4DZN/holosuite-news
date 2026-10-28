# SPAM crítico · direção de arte 2.8.1

## Referências e interpretação

Pesquisa de 28/10/2026. As referências abaixo fundamentam a linguagem visual; a sequência é ficcional, feita para RPG e não é um sistema de alerta público certificado.

- [HSE — Safety signs](https://www.hse.gov.uk/workplacetransport/safetysigns/): perigo genérico com triângulo amarelo e pictograma preto. Aqui, o triângulo é o símbolo dominante, desenhado em SVG próprio. Não se atribui risco biológico/radiológico a uma notícia que não o informou.
- [HSE — L64, pp. 12](https://www.hse.gov.uk/pubns/priced/L64.pdf): vermelho associado a alarme; amarelo/âmbar a advertência. A fonte também alerta contra excesso de sinais em uso real. A sobrecarga aqui é intencional e narrativa, com uma única manchete legível como âncora.
- [NASA — Apollo CSM displays and controls](https://www.nasa.gov/wp-content/uploads/static/history/alsj/CSM10_Displays_%26_Controls_pp83-86.pdf): documento indexado de sistema de caution/warning com indicadores de anomalia e master alarm. Inspiração para o banco de seis anunciadores; não se copiou layout ou logotipo. O endereço direto retornou 404 na consulta; o texto indexado foi acessível na busca.
- [FEMA — IPAWS tip 18](https://www.fema.gov/sites/default/files/2020-08/ipaws-tips_october-2019.pdf): texto indexado orienta identificar a fonte, ameaça e ação. A manchete e resumo do mestre permanecem a fonte dos fatos; o efeito não inventa vítimas, contaminação, evacuação nem contagem regressiva para uma catástrofe. O endereço direto retornou 403; o texto indexado foi acessível na busca.

## Moodboard descrito

Industrial noir de emergência civil: aço pintado em preto, placas esmaltadas vermelhas, fita amarela de interdição, carimbos de prioridade, bordas de sinalização, grandes tipos condensados e gravações monoespaçadas. A tela parece requisitada por um protocolo de emergência que ocupa cada canal disponível.

## Paleta e materiais

| Token | HEX | Papel |
| --- | --- | --- |
| `--spam-red` | #FF382F | Alarme, marca dominante |
| `--spam-amber` | #FFD23F | Triângulo e fitas de interdição |
| `--spam-ink` | #FFF1DC | Manchete sobre superfície escura |
| Base | #070706 | Plano mais profundo |
| Placa | #190E0C | Painéis opacos sobrepostos |
| `--spam-mute` | #C9ADA3 | Metadados secundários |

Materiais: tinta fosca, sinalização chapada, metal profundo; sombras curtas e duras para pilhas de placas. Sem bloom de tela inteira. Uma gravação de baixa opacidade na placa reforça materialidade sem cobrir texto. Iluminação: amarelo da advertência → vermelho do master alarm → marfim da manchete. Cada camada tem uma função.

Tipografia: HN Condensed local para avisos, nomes e carimbos; HN Civic Mono para códigos/estado; HN Civic Sans para resumo e botões.

## Três escolhas e três exclusões

1. Repetir signos de perigo genérico e prioridade com escala e ângulo diferentes.
2. Fazer a tensão aumentar por ocupação, indicadores e encavalamento de sinais.
3. Conservar uma manchete central, conteúdo literal e controles sempre disponíveis.

1. Não adicionar estrobo de tela inteira ou flashes alternados em loop.
2. Não introduzir símbolos de risco específico ou instruções inventadas no conteúdo do mestre.
3. Não sobrepor fitas/carimbos ao texto do painel central nem simular uma tela de erro do computador do usuário.

## Coreografia

| Elemento | Gatilho / início | Propriedade / duração | Easing | Redução |
| --- | --- | --- | --- | --- |
| Alerta de abertura com triângulo | envio / 0 ms | opacity, transform / 950 ms | cubic-bezier(.16,1,.3,1) | oculto |
| Banco de anunciadores | 200 + 330i ms | opacity / 160 ms, acendem uma vez | idem | estático |
| Janelas iniciais | 80 + 125i ms | opacity, transform / 250 ms | idem | ocultas |
| Grade de cobertura | 540–2440 ms | opacity, transform / 250 ms | idem | oculta |
| Ecos inclinados | 2280 + 70i ms | opacity, transform / 250 ms | idem | ocultos |
| Fitas atravessando a tela | 900 / 1950 ms | opacity, translate / 340 ms | idem | ocultas |
| Carimbos | 1580 + 660i ms | opacity, scale / 180 ms | idem | ocultos |
| Master alarm e manchete | 2920 ms | opacity, transform / 300 ms | idem | estáticos |
| Recolhimento | 4800–6650 ms | opacity, scale, translate / 260–510 ms | cubic-bezier(.7,0,.84,0) | oculto |
| Camada completa | 6580 ms | opacity / 420 ms; remoção aos 7000 ms | ease-in | remoção aos 7000 ms |

Modo sutil: menos ecos, sem rotações das janelas, aproximações menores e entradas mais longas. Interrupção: Dispensar, Escape, Abrir notícia, aba oculta, substituição e perda de acesso cancelam tudo. Resize/redução conservam uma placa estática pelo tempo restante. Nenhum efeito é infinito.

## Implementação e aceite

Somente `spam-urgent.ts` e seu CSS mudam a cena; fluxo de envio, permissões, deduplicação, recuperação e alerta gigante são conservados. SVGs inline próprios, sem novas dependências ou rede. Revisar primeiro geometria em desktop e celular; depois sinais, contraste, foco e tempo de limpeza. Capturas são internas, não fazem parte da entrega.
