# HoloNews 2.1

Um portal de notícias para o universo do seu RPG, integrado ao HoloSuite Core e destinado ao Foundry VTT 13. A versão 2 substitui o CMS de publicações/edições/páginas por notícias individuais.

## O que está pronto

- Portal claro, responsivo, com manchete, capas, categorias, busca sem acentos, paginação e leitura completa.
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

A release [v2.1.0](https://github.com/STR4DZN/holosuite-news/releases/tag/v2.1.0) inclui o manifesto, o ZIP instalável, o código e a prévia independente. HoloSuite Core precisa estar instalado e ativo.

## Instalação manual

1. Faça backup do seu mundo e da pasta do módulo antigo antes de substituí-lo.
2. Feche o mundo. Extraia **holosuite-news-v2.1.0.zip** em `Data/modules/holosuite-news/`; `module.json` precisa ficar diretamente nessa pasta.
3. Reinicie o Foundry, ative HoloSuite Core e HoloNews. Abra o app HoloNews pelo HoloSuite.
4. O mestre verá **Suas notícias**; jogadores verão o portal. Nome, slogan e identificação da rede podem ser alterados nas configurações do módulo.

A URL estável do manifesto acompanha a release mais recente; o download do ZIP aponta para a versão exata do módulo.

## Uso

Clique em **Nova notícia**, escreva e ajuste a capa. **Salvar rascunho** nunca publica. A prévia mostra o texto atual, e **Publicar notícia** ou **Publicar revisão** atualiza o portal. **Retirar do portal** mantém o rascunho. O contador de visualizações representa pessoas no universo da campanha; abrir uma matéria não altera esse número.

O texto aceita links de documentos e enriquecimentos do Foundry. Não existe edição, página montável, agenda de publicação, rede de vários jornais, anúncio ou painel de leituras reais.

Rascunhos e notas ficam no compêndio de mundo **HoloNews · Rascunhos do mestre**, com acesso negado a PLAYER/TRUSTED e permitido a ASSISTANT/GAMEMASTER. Cada publicação gera um JournalEntry separado, sem notas ou texto de revisões não publicadas. O portal aplica a audiência e a permissão nativa do documento.

Se vários mestres estiverem conectados, o GM ativo com menor ID será o responsável pelas escritas. O erro indica seu nome. Isso evita dois clientes publicando simultaneamente; outras janelas do mesmo mestre usam revisões por notícia e rejeitam versões antigas.

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

32 testes de domínio/adaptador/integração e 14 testes de navegador passaram nesta entrega. TypeScript, lint, build e integridade dos ZIPs também foram verificados. JS de runtime: cerca de 40 kB; CSS: cerca de 24 kB, sem fontes ou bibliotecas de editor adicionais carregadas pelo módulo.

A validação em um mundo real Foundry v13 + HoloSuite Core ainda precisa ser feita. O manifesto declara v13 como alvo mínimo/máximo e **não declara uma versão verificada**. Veja [roteiro de teste](docs/foundry-smoke-test.md), especialmente criação do compêndio, edição rica, permissão de usuários e recarregamento. Seleção de público segue as permissões nativas do Foundry; não constitui criptografia ou revogação de cópias já recebidas.

## Motion e separação de acesso

A versão 2.1 inclui abertura em sequência, assinatura de transmissão, cartões ao entrar na área visível, transição da capa para a matéria, indicador de categoria deslizante, progresso de leitura, lista com movimento e respostas de salvar/publicar. Seções do criador abrem e fecham com transição. A preferência **Reduzir animações** vale para jogador e mestre, inclusive enquanto a tela está aberta, e a preferência do sistema operacional também é respeitada.

Jogadores veem apenas o portal. Criador, adição, publicação, importação, exportação e notas são exclusivos do mestre. A API e os construtores de janelas verificam permissão; controles ocultos não são a barreira de segurança. Perder o papel de mestre fecha as janelas administrativas.

A [pesquisa de motion](docs/motion-research.md) registra 14 referências, técnicas escolhidas e limites de desempenho. A implementação usa CSS e APIs nativas, sem engines adicionais de animação.
