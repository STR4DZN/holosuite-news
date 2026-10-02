# API v2

`game.modules.get('holosuite-news').api` e `globalThis.HoloNews` expõem:

| Método            | Resultado                                              |
| ----------------- | ------------------------------------------------------ |
| `openReader()`    | Abre o portal para o usuário atual                     |
| `openManager()`   | Abre o criador/lista; exige GM responsável             |
| `openArticle(id)` | Abre uma notícia se o usuário tiver acesso             |
| `getArticles()`   | Notícias publicadas acessíveis ao usuário atual        |
| `createArticle()` | Cria rascunho e abre editor; exige GM responsável      |
| `exportBackup()`  | Backup completo, incluindo notas; exige GM responsável |

`version` é `2.1.0`. O evento `holosuite-news.ready` recebe a API. Os métodos de edições/publicações da v1 foram removidos por mudança de produto; macros antigas precisam ser ajustadas.

A integração HoloSuite usa `registerApp`, `id=holosuite-news`, `featureId=holosuite-news`, `playerVisible=true` e `premium=false`. O callback abre a lista para GM e o portal para jogadores. A API não aceita userId arbitrário para obter notícias de outro jogador.
