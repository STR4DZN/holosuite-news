# HoloNews 2.7 · Transmissão urgente

Um portal de notícias para o universo do seu RPG, integrado ao HoloSuite Core e destinado ao Foundry VTT 13. A versão 2 substitui o CMS de publicações/edições/páginas por notícias individuais.

## O que está pronto

- Nove aparências individuais: Prisma original, Gazeta, Obsidiana, Aurora, Terminal, Dossiê, Orbital, Pulsar e Nexo. Preferências de fonte, espaçamento e movimento salvas por usuário.
- Portal responsivo, com manchete, capas, categorias, busca sem acentos, paginação e leitura completa.
- Criador com título, resumo, texto rico do Foundry, capa pelo File Picker, legenda, categoria, autor, tags e data fictícia.
- Destaque, notícia urgente e contador narrativo de visualizações definido pelo mestre.
- Salvamento automático de rascunhos, prévia ao lado e publicação explícita. Editar uma notícia publicada mantém sua versão atual no portal até publicar a revisão.
- Público: todos, jogadores selecionados ou somente mestres. Notas privadas separadas.
- Lista única de notícias com filtros, duplicação, retirada do portal, exclusão confirmada, backup e importação.
- Recuperação de publicação interrompida e migração das matérias v1 como rascunhos.

## Instalação pelo Foundry

Em **Add-on Modules → Install Module → Manifest URL**, cole:

```text
https://github.com/STR4DZN/holosuite-news/releases/latest/download/module.json
```

O pacote v2.7.1 inclui o ZIP instalável, o código e a prévia independente. O manifesto usa a release mais recente publicada no GitHub. HoloSuite Core precisa estar instalado e ativo.

## Instalação manual

1. Faça backup do seu mundo e da pasta do módulo antigo antes de substituí-lo.
2. Feche o mundo. Extraia **holosuite-news-v2.7.1.zip** em `Data/modules/holosuite-news/`; `module.json` precisa ficar diretamente nessa pasta.
3. Reinicie o Foundry, ative HoloSuite Core e HoloNews. Abra o app HoloNews pelo HoloSuite.
4. O mestre verá **Suas notícias**; jogadores verão o portal. Nome, slogan e identificação da rede podem ser alterados nas configurações do módulo.

A URL estável do manifesto acompanha a release mais recente; o download do ZIP aponta para a versão exata do módulo.

## Uso

Clique em **Nova notícia**, escreva e ajuste a capa. **Salvar rascunho** nunca publica. A prévia mostra o texto atual, e **Publicar notícia** ou **Publicar revisão** atualiza o portal. **Retirar do portal** mantém o rascunho. O contador de visualizações representa pessoas no universo da campanha; abrir uma matéria não altera esse número.

O texto aceita links de documentos e enriquecimentos do Foundry. Não existe edição, página montável, agenda de publicação, rede de vários jornais, anúncio ou painel de leituras reais.

Rascunhos e notas ficam no compêndio de mundo **HoloNews · Rascunhos do mestre**, com acesso negado a PLAYER/TRUSTED e permitido a ASSISTANT/GAMEMASTER. Cada publicação gera um JournalEntry separado, sem notas ou texto de revisões não publicadas. O portal aplica a audiência e a permissão nativa do documento.

Todos os GMs podem abrir, criar, editar e publicar simultaneamente. Um GM ativo coordena a fila de gravações; os demais encaminham suas operações pelo compêndio privado do Foundry. Notícias abertas com uma revisão antiga são recusadas ao salvar, evitando sobrescrever a revisão mais recente. A lista se atualiza sem remontar o texto rico que você está editando.

## Aparência e animações

Use **Configurações** no portal, na lista ou no criador. Cada jogador e mestre escolhe sua própria aparência. Os temas usam fundos suaves, texto de alto contraste e fontes de leitura coerentes. Prisma mantém a marca orbital, os degradês violeta/ciano e a capa cinematográfica original.

Gazeta, Obsidiana, Aurora, Terminal, Dossiê, Orbital, Pulsar e Nexo foram reconstruídos com hierarquias, fontes, grades e paletas próprias. Os três estilos sci-fi conservam diagramas e movimento de transmissão, com cor subordinada à leitura. Veja [o guia de aparências](docs/scifi-themes.md) e [a pesquisa de cor e composição](docs/color-design-research.md). Em **Posts e páginas**, ajuste as transições, entradas de cartões e interações; **Automático** usa a combinação de cada tema.

No criador, abra **Animações** para escolher uma das oito entradas animadas (ou nenhuma), um dos seis alertas (ou nenhum), intensidade, ritmo e importância. Também há efeitos para capa e conteúdo durante a leitura; use **Testar post completo** e role a prévia. **Testar entrada** e **Testar alerta** são prévias locais; a notificação aos leitores acontece ao publicar. Os perfis acompanham o rascunho, a publicação, as cópias e os backups. Notícias antigas continuam abrindo normalmente.

Alertas aparecem somente para quem pode ler a publicação e possui permissão nativa no documento. Revisões em rascunho não notificam. A leitura permanece disponível depois que o movimento termina; o leitor pode abrir ou dispensar o aviso. Movimento reduzido do sistema ou do usuário tem prioridade sobre os efeitos da notícia.

O modo **Foco** amplia a escrita e **Ctrl/Cmd+S** salva o rascunho. Mudar a aparência ou a aba mantém o editor rico e o texto em edição.

Depois de atualizar para 2.3.0, recarregue todos os clientes do Foundry. Esta versão remove integralmente a antiga integração que alterava rolagens.

## Enviar uma notícia urgente para todos

No criador, abra **Texto → Publicação e alcance → Transmissão urgente** e clique em **Enviar alerta global**. O botão salva o texto atual, publica a notícia como urgente para todos e exibe um painel de alerta na tela dos clientes conectados, mesmo com o portal fechado. **Abrir notícia** leva à matéria; **Dispensar** fecha o alerta. As notas privadas continuam fora da publicação.

O alerta tem paleta própria de urgência, pulsos e entrada finitos. Movimento reduzido mantém o comunicado e os botões sem animação. Marcar apenas **Notícia urgente** ou salvar o rascunho não dispara esse painel global. É possível reenviar pelo mesmo botão; atualizar a página não repete alertas antigos.

Depois da atualização, **todos os clientes precisam recarregar o Foundry**, incluindo os dois GMs. Veja [o guia da função](docs/global-urgent.md).

## Conteúdo da versão anterior

A lista oferece **Trazer notícias antigas** quando encontra o Master v1. A operação cria um backup integral v1 no compêndio privado e traz as matérias como rascunhos, mantendo autores, categorias, capas, contadores, notas e atualizações do texto. É repetível: matérias já importadas não são duplicadas. Publicações, edições, páginas e blocos permanecem no backup; não viram estruturas de administração da v2.

Revise o público e publique as matérias desejadas. Exclusões de jogadores e hierarquias de visibilidade antigas tornam-se rascunhos exclusivos dos mestres para revisão. Os documentos originais v1 não são apagados automaticamente. Mantenha o backup original do mundo até concluir a migração. Depois de conferir, o mestre pode remover os antigos Journals de Master/projeções pelo Foundry.

## Backup

**Exportar backup** inclui notas privadas; guarde o arquivo como conteúdo do mestre. **Importar backup** valida o arquivo inteiro e cria cópias em rascunho com novos IDs. Não sobrescreve notícias nem publica automaticamente. Limite da interface: 32 MB e 5.000 notícias. Se a gravação do Foundry falhar no meio, as cópias já gravadas permanecem; a notificação informa a falha, e elas podem ser removidas antes de repetir a importação.

## Prévia e desenvolvimento

O ZIP do código inclui `HoloNews-Preview.html`: abra no navegador para testar portal, criador, publicação, público e backup com dados de demonstração. Selecione **Mestre** na barra de demonstração para ver o criador. **Jogador** e **Íris** veem somente o jornal. Os dados ficam no armazenamento local desse navegador. A prévia usa os mesmos modelos, serviço de notícias, templates, estilos e sessão do editor; o componente de texto e o armazenamento são adaptações locais, não um servidor Foundry.

```sh
npm ci
npm run preview        # http://127.0.0.1:4173/preview/
npm run validate       # TypeScript, lint, testes e build de runtime
npx playwright install chromium
npm run test:e2e       # fluxos da prévia no navegador
npm run package       # ZIP instalável e código + prévia independente
```

Node 22+ e Python 3 são necessários para gerar os ZIPs. O runtime não depende de Node/Python no cliente. Para um Chromium já instalado: `HN_BROWSER_PATH=/caminho/chromium npm run test:e2e`.

## Validação e limites

A suíte cobre domínio, permissões, adaptadores, editor nativo, prévia e fluxos no navegador. TypeScript, lint, build e integridade dos ZIPs são verificados na preparação do pacote. As oito alternativas usam fontes WOFF2 locais, com licenças incluídas; o Prisma conserva suas fontes originais. O runtime usa APIs nativas de animação, sem novas bibliotecas de editor ou motion.

A validação em um mundo real Foundry v13 + HoloSuite Core ainda precisa ser feita. O manifesto declara v13 como alvo mínimo/máximo e **não declara uma versão verificada**. Veja [roteiro de teste](docs/foundry-smoke-test.md), especialmente criação do compêndio, edição rica, permissão de usuários e recarregamento. Seleção de público segue as permissões nativas do Foundry; não constitui criptografia ou revogação de cópias já recebidas.

## Identidade Prisma

A versão 2.2 adota a composição aprovada do Prisma: cabeçalho com marca orbital, cores por categoria, capa panorâmica, cartões editoriais e notícia completa. Roxo e ciano aparecem nos degradês e nos elementos de destaque sobre superfícies escuras. Nome, slogan e rede continuam configuráveis. A estimativa de leitura é calculada a partir do texto; o contador de visualizações continua narrativo e controlado pelo mestre.

A logo está em `dist/assets/holonews-mark.svg`. As ilustrações de demonstração pertencem à prévia e não são inseridas nas notícias do mundo.

## Motion e separação de acesso

A versão 2.1 inclui abertura em sequência, assinatura de transmissão, cartões ao entrar na área visível, transição da capa para a matéria, indicador de categoria deslizante, progresso de leitura, lista com movimento e respostas de salvar/publicar. Seções do criador abrem e fecham com transição. A preferência **Reduzir animações** vale para jogador e mestre, inclusive enquanto a tela está aberta, e a preferência do sistema operacional também é respeitada.

Jogadores veem apenas o portal. Criador, adição, publicação, importação, exportação e notas são exclusivos do mestre. A API e os construtores de janelas verificam permissão; controles ocultos não são a barreira de segurança. Perder o papel de mestre fecha as janelas administrativas.

A [pesquisa de motion](docs/motion-research.md) registra 14 referências, técnicas escolhidas e limites de desempenho. A implementação usa CSS e APIs nativas, sem engines adicionais de animação.


## Motion editorial 2.4

Configurações → Posts e páginas: transições, cartões e interação. Criador → Animações: entrada, capa e conteúdo durante a leitura. Use Testar post completo e role a prévia. Pesquisa e decisões em [docs/editorial-motion-research.md](docs/editorial-motion-research.md).
