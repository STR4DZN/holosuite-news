# Changelog

## 2.2.0 — Prisma

- Prisma integrado ao portal, à notícia aberta, à lista e ao criador do mestre.
- Nova logo geométrica com facetas, H e órbita; símbolo vetorial incluído no pacote.
- Tema escuro com degradês de violeta e ciano, capa panorâmica, cortes diagonais e hierarquia editorial.
- Cores consistentes por categoria, incluindo categorias próprias da campanha, e estimativa de leitura.
- Nome, slogan e rede configuráveis preservados; nenhuma data ou edição fictícia fixa no runtime.
- Layouts para matérias sem imagem, texto ampliado e janelas estreitas.
- ProseMirror nativo com superfícies escuras, texto e cursor legíveis; correções de autosave da 2.1.1 preservadas.
- Motion finito e preferência de movimento reduzido mantidos, sem novas bibliotecas no runtime.

## 2.1.1 — Correções do criador no Foundry

- Autosave não redesenha a lista do mestre enquanto um criador está aberto; a lista atualiza ao fechar a edição.
- Atualizações automáticas não forçam a reabertura de janelas fechadas.
- ProseMirror configurado como editor sempre ativo, sem colaboração, com altura explícita e layout flexível para exibir texto e formatação.
- Cor, cursor e espaçamento do texto corrigidos no editor nativo em tema claro.
- Eventos do formulário são removidos ao fechar/remontar; debounce e prévias assíncronas não acessam formulários destruídos.
- 34 testes unitários e 18 testes de navegador, incluindo quatro regressões do adaptador/estrutura do editor Foundry.

## 2.1.0 — Motion editorial e acesso do mestre

- Pesquisa de 14 referências de design/motion e documentação de escolhas.
- Motion nativo nos portais do jogador e mestre, transição capa/matéria, entradas em sequência e microinterações.
- Criador com seções animadas, prévia suave e estados de salvar/publicar.
- Redução de movimento do sistema e do módulo em ambas as interfaces, com cancelamento e limpeza de efeitos.
- Prévia com administração exclusiva da simulação Mestre; jogador vê apenas notícias.
- Verificação de acesso ao construir/montar janelas e fechamento imediato ao perder papel de mestre.
- 32 testes unitários e 14 testes de navegador.

## 2.0.0 — Reformulação

- Notícias individuais substituem publicações, edições, páginas e blocos.
- Portal editorial claro com identidade sci-fi civil, categorias, busca e paginação.
- Criador com texto rico nativo, autosave de rascunho e prévia ao lado.
- Revisão separada da notícia publicada, contador narrativo, público e notas privadas.
- Dados por notícia, sem cópias completas por jogador ou sinais de leitura real.
- Compêndio privado para rascunhos; publicação individual com recuperação de falhas.
- Migração v1 preservada em backup e importada como rascunhos.
- Prévia independente, empacotamento portátil e testes de fluxos completos.

As versões 1.x e suas decisões permanecem no histórico Git.
