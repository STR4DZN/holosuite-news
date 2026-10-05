# Três redes sci-fi — HoloNews 2.5

## Escolha e uso

Abra **Configurações → Aparência** no portal, na lista ou no criador e selecione Orbital, Pulsar ou Nexo. A preferência é individual: não troca o jornal de outros jogadores. Nenhuma notícia precisa ser migrada.

Em **Posts e páginas**, deixe página e cartões em **Automático** para usar a composição de movimento do tema. As receitas da notícia (entrada, capa, leitura e alerta) continuam independentes, no criador. **Ver animações no portal** reapresenta a sequência editorial; **Testar post completo** mostra a notícia e suas receitas durante a rolagem.

| Estilo | Composição | Detalhes e movimento automático |
| --- | --- | --- |
| Orbital | Manchete à esquerda, imagem em painel à direita, feed em duas colunas | Elipses e rotas de estação se traçam; nós aparecem em sequência; moldura angular se forma; passagem horizontal de luz, transição de profundidade e cartões articulados |
| Pulsar | Capa ampla com proteção de contraste sob o texto; feed em colunas assimétricas | Onda civil, círculos de frequência e espectro se formam; molduras duplas; passagem vertical de luz; página com assinatura de transmissão e cartões alternados |
| Nexo | Cabeçalho em painel, manchete acima da imagem, feed vertical conectado com cartões horizontais | Circuitos e nós ativados em sequência; índices das matérias; linha de transmissão nas imagens; abertura em partes e entrada editorial de foto, título e metadados |

Os gráficos são decoração, ignorada por tecnologia assistiva; não simulam uma métrica, cronologia real, conexão do servidor ou estado técnico do mundo. Nome, slogan, rede, datas e categorias continuam vindos das configurações e notícias.

## Leitura e responsividade

As superfícies são escuras, com corpo de texto em tons claros suaves. Cor de acento fica nos títulos, controles, molduras e diagramas. A largura de leitura e o contraste são preservados; imagens recebidas do mestre mantêm seu conteúdo original. O gráfico do cabeçalho recua em janelas estreitas.

Orbital empilha os painéis em janelas médias. Nexo reduz a coluna da foto e empilha os cartões em janelas pequenas. Os três estilos mostram uma coluna de cartões quando necessário. Notícias sem capa permanecem com texto e metadados completos.

## Animação e ciclo de vida

Os novos diagramas e detalhes de imagem usam Web Animations API, em ciclos únicos de aproximadamente 380–850 ms, com pequenos atrasos em sequência. Não há animação infinita, canvas, vídeo, filtro global ou dependência extra. A decoração estática permanece após o movimento.

**Completo** executa a coreografia. **Sutil** conserva os detalhes estáticos e reduz o movimento editorial existente. **Reduzido**, a preferência de reduzir movimento do sistema e a janela oculta interrompem os efeitos. Fechar ou trocar de tema remove as camadas e cancela as animações. Mudar a aparência não recria o ProseMirror nem apaga o texto em edição.

## Verificação

Testes de navegador conferem diagrama único, término das animações, composição do feed, acesso à notícia, redução de movimento, ausência de rolagem horizontal e limpeza ao retornar ao Prisma. A estrutura de teste Foundry confere a identidade e o valor do ProseMirror durante a troca dos três temas. Capturas incluem portal, feed, notícia, editor e janela de 390 px. Use também o roteiro `docs/foundry-smoke-test.md` no mundo real.
