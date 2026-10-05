# Aparências editoriais — HoloNews 2.6

Abra **Configurações → Aparência** no portal, na lista ou no criador. Prisma mantém a apresentação original; as oito alternativas foram reconstruídas nesta versão. A preferência é individual e não muda o jornal de outros jogadores. Notícias existentes não precisam ser migradas.

| Estilo | Direção | Capa e feed |
| --- | --- | --- |
| Gazeta | Jornal, grafite quente e vermelhão | Marca central, manchete larga, resumo lateral, foto abaixo e três colunas de notícias |
| Obsidiana | Revista de prestígio, preto mineral e dourado | Fotografia dominante, texto lateral, manchetes serifadas e duas colunas sem caixas pesadas |
| Aurora | Revista de comunidade, azul celeste e índigo | Painéis arredondados, navegação em cápsulas, manchete dividida e grade desigual |
| Terminal | Boletim técnico civil, âmbar | Cabeçalho compacto, marca monoespaçada, manchete com foto pequena e feed em lista |
| Dossiê | Arquivo editorial, argila e tons minerais | Abas, lombada, capa enquadrada e registros numerados com texto antes da fotografia |
| Orbital | Edição de estação, azuis de aviação | Foto panorâmica, painel sólido de manchete abaixo e feed em dois painéis horizontais |
| Pulsar | Revista de transmissão, família rosa | Tipografia condensada, capa em blocos e notícias alternando posição da fotografia |
| Nexo | Rede de informação, família jade | Manchete com foto à esquerda e quadro de três colunas com nós e conectores |

## Leitura, editor e cores

As superfícies são escuras, com texto claro suave. Acentos ficam principalmente em ações, identificação e detalhes gráficos. Títulos não precisam contrastar contra a imagem escolhida pelo mestre. O corpo de leitura tem largura controlada e escala ajustável; as fontes WOFF2 acompanham o módulo e não dependem de serviços externos.

As mesmas cores alcançam a lista do mestre, o editor, a prévia e as configurações. A organização de escrever/salvar/publicar é consistente entre estilos. Trocar de aparência conserva o editor rico e o conteúdo em edição.

Todas as alternativas reorganizam capa e cartões em janelas estreitas. A navegação de categorias pode rolar horizontalmente dentro de sua própria faixa; o portal não deve ganhar rolagem horizontal. Notícias sem capa conservam texto e metadados completos.

## Movimento editorial e sci-fi

Em **Posts e páginas**, deixe página e cartões em **Automático** para usar o perfil do tema. As receitas de entrada, capa, conteúdo durante a leitura e alerta continuam independentes no criador. **Ver animações no portal** reapresenta a sequência editorial; **Testar post completo** mostra a notícia e suas receitas durante a rolagem.

Orbital conserva órbitas traçadas e passagem horizontal de luz nas capas. Pulsar conserva onda, espectro e passagem vertical. Nexo conserva circuitos, nós e linha de transmissão. As cores desses efeitos acompanham a paleta de cada tema. As molduras e os gráficos ficam fora do texto; não representam métricas, conexões reais ou estado técnico do mundo.

Os efeitos usam APIs nativas em sequências finitas. **Completo** executa a coreografia. **Sutil** mantém os diagramas estáticos e reduz o movimento editorial. **Reduzido**, a preferência do sistema e a janela oculta interrompem animações. Fechar ou trocar de tema remove as camadas e cancela os efeitos; retornar ao Prisma não deixa decoração dos outros temas.

## Pesquisa e verificação

Consulte [Cor, tipografia e composição](color-design-research.md) para as 18 referências, paletas, decisões de hierarquia, critérios de degradê e medições de contraste.

Os testes de navegador verificam legibilidade calculada, fontes locais, ampliação do texto, composição da capa, acesso à notícia e janelas estreitas. Também conferem os ciclos de animação, a redução de movimento e a identidade do ProseMirror durante a troca de estilos. As capturas incluem portal, feed, notícia, leitura e editor.

A sessão no mundo real da campanha ainda deve seguir [o roteiro Foundry](foundry-smoke-test.md).
