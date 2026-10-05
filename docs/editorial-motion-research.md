# HoloNews 2.4 — pesquisa e aplicação de motion editorial

Pesquisa em 05/10/2026. Escopo: posts, páginas, capas, navegação, leitura e ferramentas de edição. A 2.3 trouxe alertas configuráveis e entradas de notícia, mas manteve os cartões e a navegação quase fixos. Esta entrega completa essas superfícies.

## Referências estudadas e decisões

| Fonte primária | Contribuição | Aplicação no HoloNews |
| --- | --- | --- |
| [Carbon — visão geral](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) | Distingue movimento produtivo e expressivo | Edição recebe respostas curtas; abertura e capas recebem expressão |
| [Carbon — coreografia](https://www.carbondesignsystem.com/building-blocks/foundations/motion/choreography) | Continuidade espacial, sequência e atrasos limitados | Cartões entram em grupos visíveis, com atraso máximo de 150 ms; a interface não espera terminar para responder |
| [Fluent 2 — motion](https://fluent2.microsoft.design/motion) | Movimento como orientação e relação entre elementos | A direção de anterior/voltar é inversa à de próxima/abrir; retornos preservam posição e foco |
| [Material — implementação de transições](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md) | Transformação de contêiner e eixo compartilhado | A imagem do cartão fornece o retângulo de origem para a capa da notícia; interpretação própria para DOM, sem portar biblioteca Android |
| [Motion — view animations](https://motion.dev/docs/animate-view) | Relações entre vistas, animações de entrada e saída, correspondência de elementos | Referência para continuidade; não foi adotada uma transição global do documento do Foundry |
| [Motion — stagger](https://motion.dev/docs/stagger) | Atrasos entre elementos de um grupo | Montagem editorial separa imagem, manchete e metadados; o atraso não cresce indefinidamente com a lista |
| [GSAP — Flip](https://gsap.com/docs/v3/Plugins/Flip/) | Capturar geometria e interpolar entre estados | A continuidade da capa usa translação e escala a partir da geometria anterior; a lista editorial conserva sua reorganização existente |
| [web.dev — animações de alto desempenho](https://web.dev/articles/animations-guide) | Priorizar transform e opacity; medir pintura e layout | As novas receitas usam transform/opacity; não adicionam canvas, partículas, blur animado ou loops de renderização |
| [MDN — Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) | Observação assíncrona de interseção com um contêiner | Parágrafos, listas, títulos, citações e imagens entram ao alcançar a área de leitura; cada bloco executa uma vez por abertura |
| [MDN — Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel) | Cancelar efeitos e tratar a promessa de conclusão rejeitada | Navegação, fechamento e mudança de preferência cancelam animações e removem camadas temporárias |
| [W3C — C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) e [web.dev — reduced motion](https://web.dev/articles/prefers-reduced-motion) | Respeitar preferência de movimento reduzido | Preferência do sistema e opção pessoal prevalecem; nenhuma notícia depende da animação para ficar legível |

Os nomes, combinações e desenhos abaixo são escolhas deste projeto, não prescrições copiadas das fontes. A pesquisa avaliou padrões de interação e APIs; não mede o desempenho da mesa do usuário.

## Catálogo implementado

### Páginas — seis receitas e desligamento

- Dissolução: mudança curta de opacidade, sem deslocamento.
- Deslizamento direcional: avanço ou retorno lateral conforme a ação.
- Profundidade: aproximação curta com escala e elevação.
- Virada editorial: perspectiva discreta em torno do eixo vertical.
- Abertura em camadas: seções se organizam a partir de lados alternados, com traço de abertura.
- Transmissão: estabilização da página e percurso de uma linha luminosa.

Aplicam-se à abertura do portal, troca de categoria, busca, paginação, abertura de notícia e volta à lista. A animação é da vista que chega; não é uma promessa de morph completo de cada elemento nem de transição de saída da página inteira.

### Posts na lista — cinco receitas e desligamento

Cascata vertical, alternância lateral, profundidade, desdobramento em perspectiva e montagem editorial. Esta última coordena a imagem, a manchete e os metadados. IntersectionObserver limita execução aos cartões que entram na área visível.

A interação oferece elevação, aproximação da imagem e moldura luminosa. Mouse e foco por teclado recebem o mesmo vocabulário. Cada gesto é finito; não há movimento permanente durante a leitura.

### Capas — quatro receitas novas

Aproximação cinematográfica, travessia da imagem, revelação em cinco faixas e moldura em construção. Também é possível acompanhar a entrada existente da notícia ou desligar o movimento da capa. Ritmo e intensidade usam os controles existentes do post.

### Corpo da notícia — quatro receitas

Fluxo de leitura, entrada lateral, camadas de profundidade e filetes editoriais. Os blocos ficam legíveis mesmo se a API não estiver disponível; a animação não é responsável por revelar um elemento escondido permanentemente. Filetes em títulos e citações usam camadas absolutas que não mudam a altura do texto.

O mestre escolhe capa e leitura por notícia. Os valores acompanham rascunho, publicação e backup pela mesma validação do perfil de motion. Notícias antigas recebem os padrões compatíveis. A prévia usa o mesmo código do leitor, e a rolagem da prévia dispara o movimento do corpo.

## Combinações por tema

| Tema | Página | Cartões |
| --- | --- | --- |
| Prisma | Transmissão | Profundidade |
| Gazeta | Virada editorial | Montagem editorial |
| Obsidiana | Abertura em camadas | Desdobramento |
| Aurora | Profundidade | Cascata |
| Terminal | Transmissão | Alternância lateral |
| Dossiê | Deslizamento | Desdobramento |

“Conforme o tema” é o padrão. Cada leitor pode substituir página, cartões e interação em Configurações → Posts e páginas. A escolha de tema mantém sua identidade visual; o movimento não troca tipografia, cores ou composição estática.

## Fluxo e robustez

Ao abrir um post, o portal guarda posição da lista e identidade do botão. Voltar restaura ambos, inclusive em movimento reduzido. O progresso de leitura existente continua funcionando. Trocas rápidas cancelam os efeitos da vista anterior. Ao ocultar a aba, os efeitos encerram; voltar não repete toda a abertura. Preferências mudam sem recriar o editor de texto.

A edição possui entrada curta de painel ao alternar abas. Atualizações automáticas da prévia não executam movimento; o botão “Testar post completo” permite avaliar a apresentação explicitamente. Alertas continuam disponíveis como outra opção da publicação.

## Tecnologia escolhida e limites

Foi mantida a Web Animations API já usada pelo módulo, com CSS para as camadas decorativas. Motion e GSAP foram referências de composição; adicionar um motor só para reproduzir essas receitas aumentaria a dependência sem resolver uma necessidade atual. A View Transition API global afetaria o documento compartilhado com o Foundry, portanto não foi usada.

Não há garantia de FPS para toda instalação. As animações de expansão de detalhes que já existiam ainda interpolam altura; os novos efeitos editoriais se concentram em composição. A validação local usa navegador Chromium e o adaptador de testes, sem representar uma sessão licenciada completa de Foundry com todos os módulos da mesa.
