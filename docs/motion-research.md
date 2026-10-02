# Pesquisa de motion e aplicação ao HoloNews 2.1

Consulta em 02/10/2026. Foram examinadas 14 referências distintas: galerias de design, documentação de engines de animação, fundamentos de interface, desempenho e uma discussão pública entre desenvolvedores. A comunidade não tem uma escolha unânime de biblioteca. A seleção abaixo combina referências recorrentes e fontes oficiais; as decisões para o HoloNews são escolhas de projeto.

## Referências examinadas

| Referência           | Página consultada                                                                                                    | Contribuição à decisão                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Awwwards             | https://www.awwwards.com/websites/gsap/                                                                              | Galeria de sites com animação; observar composição e continuidade entre estados.                                                                       |
| Codrops              | https://tympanus.net/codrops/2025/02/19/motion-highlights-2/ e https://tympanus.net/Tutorials/GridLayoutTransitions/ | Entradas em sequência, transições de grids e hierarquia temporal. Inspiração para capa, cartões e lista.                                               |
| Motion               | https://motion.dev/docs/animate e https://motion.dev/docs/inview                                                     | Stagger, easing e animação disparada pela visibilidade. A documentação distingue sua versão mini da híbrida e descreve uso de APIs nativas.            |
| GSAP                 | https://gsap.com/resources/getting-started/Staggers/                                                                 | Distribuição temporal entre elementos em vez de mover toda a interface simultaneamente.                                                                |
| Anime.js             | https://animejs.com/documentation/                                                                                   | Referência de engine para animações de elementos e timelines; avaliada como alternativa de implementação.                                              |
| Hoverstat.es         | https://www.hoverstat.es/                                                                                            | Curadoria de web design experimental; referência para identidade de interação e movimento.                                                             |
| Lapa Ninja           | https://www.lapa.ninja/                                                                                              | Galeria com capturas e registros de sites; referência para composições editoriais e apresentação clara.                                                |
| Rive                 | https://rive.app/                                                                                                    | Animações autoradas interativas; avaliado para elementos de marca.                                                                                     |
| LottieFiles          | https://lottiefiles.com/                                                                                             | Catálogo e ferramentas para animações autoradas; avaliado para respostas visuais pequenas.                                                             |
| Easings.net          | https://easings.net/                                                                                                 | Curvas de aceleração/desaceleração; chegada com desaceleração, sem movimento linear rígido.                                                            |
| Carbon Design System | https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview                                       | Diferença entre movimento expressivo e movimento funcional. A abertura pode ter personalidade; salvar/editar exige respostas rápidas e claras.         |
| MDN                  | https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API                     | API nativa usada no projeto, controle de efeitos e ciclo de vida.                                                                                      |
| web.dev              | https://web.dev/articles/animations-guide                                                                            | Priorizar transform e opacity, observar custos de renderização e não presumir desempenho só pela escolha de biblioteca.                                |
| r/webdev             | https://www.reddit.com/r/webdev/comments/1uq4xdn/gsap_motion_or_animejs_whats_your_choice/                           | Discussão de GSAP, Motion, Anime.js e CSS, especialmente em mobile. Relatos são experiências individuais; não foram tratados como benchmark universal. |

## Decisão técnica

Implementação com Web Animations API e CSS, sem incluir as bibliotecas avaliadas como novas dependências. O módulo é uma interface do Foundry que recria partes do DOM: os movimentos precisam ser locais, canceláveis e capazes de encerrar quando a janela muda. A implementação captura a ideia dos exemplos e cria uma linguagem própria; não copia código, ilustrações ou animações autoradas dos sites.

`src/ui/motion.ts` concentra entrada, visibilidade, transições, feedback e limpeza. `styles/motion.css` contém microinterações e estados. A mesma camada é usada no runtime e na prévia independente.

## Linguagem aplicada

| Área                  | Movimento implementado                                                                                          | Intenção                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Marca do portal       | Símbolo e identificação entram em etapas; trilho de transmissão recebe três pequenos pacotes finitos.           | Rede civil sci-fi com uma assinatura própria.        |
| Manchete              | Texto, chamada e imagem entram com pequenos atrasos; imagem acomoda sua escala.                                 | Dar prioridade à notícia principal.                  |
| Cartões               | Entrada ao alcançar a área visível, com atrasos limitados; imagem aproxima suavemente no hover.                 | Movimento acompanhando o olhar e a rolagem.          |
| Categorias            | Indicador desliza de uma categoria para outra, ajustando sua escala.                                            | Mostrar continuidade entre filtros.                  |
| Abertura da matéria   | Imagem parte das medidas da capa clicada e se acomoda na matéria; título, resumo e autoria entram em sequência. | Preservar a relação entre chamada e notícia.         |
| Leitura               | Barra fina acompanha a rolagem da matéria.                                                                      | Dar referência de progresso sem controlar a rolagem. |
| Lista do mestre       | Novas linhas entram em sequência; linhas existentes deslocam-se para a posição nova após mudanças.              | Tornar organização e filtros legíveis.               |
| Criador               | Campos e prévia entram em etapas curtas; seções recolhíveis abrem/fecham com transição.                         | Organizar a tela e reduzir saltos bruscos.           |
| Prévia                | Atualização breve de opacidade e deslocamento após a pausa na digitação.                                        | Mostrar atualização sem interromper a escrita.       |
| Salvamento/publicação | Estado de salvamento, indicador durante gravação e confirmação animada ao publicar/retirar.                     | Comunicar o resultado da ação.                       |
| Botões                | Resposta de pressão, hover e expansão local de tinta nos botões principais.                                     | Tornar ações táteis no mouse e teclado.              |

Durações principais: 170–560 ms; abertura de marca/imagem até cerca de 760 ms. Atrasos de cartões e linhas são limitados a 180–220 ms. O corpo de notícias não tem caracteres separados ou animações repetidas durante a leitura.

## Leveza, acesso e limpeza

- Efeitos de entrada, marca, cartões e transição são finitos. Não existe parallax em loop, WebGL, vídeo de fundo ou animação contínua de textos.
- Cartões usam IntersectionObserver. Não há polling ou loop permanente para procurar elementos.
- A barra de leitura recebe eventos passivos de scroll e limita atualizações a um requestAnimationFrame pendente.
- A animação localizada de abrir/recolher detalhes modifica altura por 220 ms; é a exceção deliberada à prioridade de transform/opacity para acompanhar a mudança real do formulário. Não roda durante digitação ou scroll.
- A indicação de gravação gira somente enquanto o estado é Salvando, e termina quando a operação conclui ou falha.
- Efeitos, observers, eventos e elementos temporários são limpos ao fechar ou remontar. A ocultação da aba encerra os efeitos ativos.
- `prefers-reduced-motion` e a preferência do módulo desativam movimentos no portal e no criador. A preferência pode mudar enquanto a tela está aberta, sem recriar o formulário.
- Jogadores não recebem controles de criar/editar/publicar/importar/exportar. Operações administrativas continuam protegidas fora da interface. Janelas privadas são ocultadas/fechadas se o usuário perde o papel de mestre.
- A prévia simula os papéis: escolha Mestre para ver o criador; Jogador/Íris exibem apenas o jornal. Essa simulação não substitui a autoridade real do Foundry.

## Evidência e limite

32 testes unitários e 14 testes de navegador cobrem publicação, dados, acesso, término de motion, preferência do sistema, redução manual e abertura rápida de seções sem perder valores. A prévia independente foi testada também sem servidor HTTP. Ainda é necessário o roteiro no Foundry v13 + HoloSuite Core para validar os componentes nativos e a integração. Não foi feito benchmark de FPS em hardware do usuário; desempenho percebido depende também do mundo, imagens e demais módulos.
