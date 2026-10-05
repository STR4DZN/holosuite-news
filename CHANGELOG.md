# Changelog

## 2.5.0 — Três redes sci-fi

- Orbital, Pulsar e Nexo acrescentados à escolha individual de aparência, totalizando nove temas.
- Três composições editoriais próprias: painéis orbitais, capa de transmissão e feed conectado.
- Diagramas vetoriais, molduras, índices, traçado de rotas, espectro e varreduras finitas nas capas.
- Portal, leitura, lista, criador e configurações com superfícies escuras e tipografia legível.
- Animações canceladas ao fechar ou reduzir movimento; decoração estática no modo sutil.
- Troca de tema preserva o ProseMirror e o texto, sem camadas residuais ao voltar ao Prisma.
- 38 testes unitários e 37 de navegador; nove aparências conferidas em janela estreita.


## 2.4.0 — Motion editorial


A configuração **Posts e páginas** acrescenta seis transições de página, cinco entradas de cartões e três efeitos de interação, além de desligamento e combinações automáticas para os seis temas.

No criador, **Animações** agora separa entrada da notícia, movimento da capa, conteúdo durante a leitura e alerta. Quatro novas apresentações de capa e quatro receitas de leitura executam no leitor e na prévia. Use **Testar post completo** e role a prévia.

Abrir um post aproveita a posição da imagem de origem. Voltar recupera a rolagem e o foco na lista. As abas do editor têm resposta breve, e digitar não faz a prévia pulsar.

Efeitos finitos, cancelamento em navegação e movimento reduzido, sem dependência nova de animação. Prisma e os outros estilos conservam sua apresentação. Notícias e backups 2.3 recebem os novos padrões automaticamente. A integração de alteração de dados permanece removida.

Pesquisa e decisões: `docs/editorial-motion-research.md`. Validação com TypeScript, lint, testes unitários, testes de navegador e inspeção visual; a sessão final no Foundry da mesa continua sendo a verificação do ambiente real.

## 2.3.0 — Aparências e alertas

- Prisma original preservado: marca orbital, degradês violeta/ciano, categorias coloridas e capa cinematográfica.
- Cinco estilos adicionais com composição própria: Gazeta, Obsidiana, Aurora, Terminal e Dossiê.
- Configurações individuais de tema, fonte, espaçamento e movimento, aplicadas sem recriar o texto rico.
- Oito entradas e seis alertas por notícia, além das opções sem efeito; intensidade, ritmo e importância configuráveis.
- Prévia local dos efeitos e notificações de publicação com audiência e permissões nativas verificadas.
- Efeitos finitos, limpeza ao fechar e interrupção imediata com movimento reduzido.
- Foco na escrita, atalho de salvar e prévia preservada quando não mudou.
- Perfis de animação preservados na publicação, revisão, duplicação e backup; compatibilidade com notícias existentes.
- Removida completamente a integração de alteração dos dados.


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

