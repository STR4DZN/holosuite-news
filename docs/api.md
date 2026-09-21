# API do HoloNews

## Disponibilidade

O objeto público é exposto durante `init` em `game.holosuiteNews`, `game.modules.get("holosuite-news").api` e `globalThis.HoloNews`.

O hook `holosuite-news.ready` recebe a API depois do ciclo `ready`. Por compatibilidade com integrações anteriores, `newspaperReady` recebe o mesmo objeto.

## Leitura

| Método | Resultado |
|---|---|
| `open()` | Abre Mesa editorial para GM ou Reader para jogador |
| `openReader()` | Abre o Reader |
| `openLatestIssue()` | Abre a edição atual |
| `openIssue(id)` | Abre uma Edição publicada |
| `openArticle(id)` | Abre uma Matéria publicada |
| `getProjection(userId?)` | Retorna a projeção publicada; jogadores são sempre fixados ao próprio usuário |
| `getPublications()` | Lista Publicações permitidas |
| `getPublishedIssues()` | Lista Edições permitidas |
| `getPublishedArticles()` | Lista Matérias permitidas |

## Administração

Os métodos abaixo chamam o `Newsroom`, que verifica autoridade GM antes de ler ou alterar Master data:

- `createPublication`, `updatePublication`, `deletePublication`;
- `createIssue`, `updateIssue`, `publishIssue`, `unpublishIssue`, `archiveIssue`, `deleteIssue`, `duplicateIssue`;
- `createArticle`, `updateArticle`, `deleteArticle`, `duplicateArticle`, `setPublicViews`;
- `createPage`, `updatePage`, `deletePage`, `duplicatePage`;
- `createTemplate`, `createTemplateFromIssue`, `createIssueFromTemplate`, `deleteTemplate`;
- `exportBackup`, `importBackup`.

Uma tentativa feita por jogador retorna `HoloNewsError` com o código `NEWSPAPER_PERMISSION_DENIED`.

## Hooks emitidos

| Hook | Payload | Momento |
|---|---|---|
| `holosuite-news.ready` | API | Inicialização concluída |
| `newspaperReady` | API | Alias legado do hook de ready |
| `holosuite-news.projectionUpdated` | número da projeção | Todas as projeções de jogador foram reconstruídas |

## Erros estáveis

- `NEWSPAPER_PERMISSION_DENIED`
- `NEWSPAPER_NOT_FOUND`
- `NEWSPAPER_INVALID_DATA`
- `NEWSPAPER_STORAGE_ERROR`
- `NEWSPAPER_INTEGRATION_ERROR`
- `NEWSPAPER_MIGRATION_ERROR`
- `NEWSPAPER_REVISION_CONFLICT`
