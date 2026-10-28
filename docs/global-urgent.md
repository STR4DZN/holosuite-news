# Dois GMs e transmissão urgente — HoloNews 2.7

## Abertura e edição

Todos os GMs podem abrir a lista e o criador, criar notícias, salvar, publicar, importar e retirar matérias. A escolha de um coordenador serve somente à fila de gravações; não limita a abertura do aplicativo.

Se dois GMs editarem a mesma notícia a partir da mesma revisão, apenas a primeira gravação é aceita. O outro conserva sua edição na janela e recebe um erro de revisão; reabra a notícia para conferir a versão atual antes de refazer a alteração. Editar notícias diferentes simultaneamente não bloqueia um dos mestres.

## Enviar o alerta

1. No criador, escreva título, resumo e corpo.
2. Em **Texto → Publicação e alcance → Transmissão urgente**, clique em **Enviar alerta global**.
3. O botão salva o rascunho atual e publica essa versão como **urgente para todos**. Notas privadas não são incluídas.
4. O comunicado aparece na tela dos clientes conectados, com o portal aberto ou fechado. **Abrir notícia** fecha imediatamente o alerta e mostra a matéria; **Dispensar** remove o alerta.

O painel grande fica centralizado na tela, com fundo preto, faixa vermelha de emergência, manchete ampla, triângulo de alerta, faixas de perigo em movimento e pulsos vermelhos na moldura. Os efeitos terminam; a notícia e os botões continuam disponíveis. Títulos e resumos longos rolam dentro do painel, mantendo as ações acessíveis.

Marcar apenas **Notícia urgente**, salvar rascunho ou publicar normalmente não equivale a enviar esse painel global. O botão é uma ação explícita e informa que torna a notícia pública para todos, mesmo se o rascunho estivesse restrito.

Pode reenviar pelo mesmo botão. Cada envio tem um identificador novo; callbacks repetidos e recuperação de uma gravação pendente preservam o identificador existente. Recarregar/reconectar registra os eventos antigos sem apresentá-los. Jogadores offline no momento do envio continuam podendo ler a notícia publicada ao entrar.

## SPAM de alertas — 2.8

Abaixo do envio original há um segundo controle: **Enviar SPAM de alertas**. A mesma fila salva e publica a versão atual como urgente para todos, mas o evento carrega `mode: "spam"`. Sem modo, ou com `mode: "panel"`, o receptor conserva o painel original. Cada envio recebe um identificador; retry conserva identificador e modo.

**Prévia só para mim** usa o formulário atual, sem publicar nem transmitir. Abrir notícia nessa prévia leva à prévia da matéria no criador.

| Elemento | Início | Duração / saída | Movimento reduzido |
| --- | --- | --- | --- |
| Retícula de interceptação | 0 ms | 1100 ms | Oculta |
| Três primeiras janelas | 0 / 180 / 360 ms | Entrada 390 ms; saída escalonada | Ocultas |
| Onda que cobre o viewport | 540–2440 ms | Entrada 390 ms; saída de 4820–6650 ms | Oculta |
| Ecos diagonais | 2480–3200 ms | Entrada 390 ms; contração e retração em ordem reversa | Ocultos |
| Manchete central | 3100 ms | Entrada 480 ms; saída 5620–6040 ms | Estática desde o início |
| Barra de tempo | 0 ms | 7000 ms, linear | Estática |
| Camada completa | 6580 ms | Fade 420 ms; remoção em 7000 ms | Remoção em 7000 ms |

A 2.8.1 intensifica sinais e movimentos. Consulte [a pesquisa e a coreografia atual](spam-art-direction.md); os timings da tabela acima registram a primeira versão 2.8.0.

Entradas usam `cubic-bezier(.16,1,.3,1)`; saídas, `cubic-bezier(.7,0,.84,0)`. São animações WAAPI locais de opacity/transform/scale/translate, sem loops. A grade opaca sobrepõe as bordas e cobre a área útil em telas desktop e móveis. O modo sutil reduz ecos e remove rotações. A contagem máxima é limitada a 60 janelas.

**Abrir notícia** fecha antes de navegar e revalida acesso. **Dispensar** e **Escape** encerram imediatamente. O foco fica nos controles e retorna ao elemento anterior se ainda existir. Uma única região anuncia o comunicado; duplicatas decorativas ficam `aria-hidden`.

Mudar para movimento reduzido ou redimensionar cancela a cascata e mantém a manchete estática somente pelo tempo restante. Ocultar a aba encerra a sequência; voltar não repete. Substituição, retirada, exclusão e perda de acesso removem os elementos e cancelam todos os timers, listeners e animações. Não há áudio automático.

## Movimento e privacidade

O modo reduzido do usuário ou do sistema mantém o painel estático. Ativar redução ou ocultar a aba cancela os efeitos. Os efeitos são locais, finitos e usam APIs nativas, sem áudio automático, vídeo, canvas ou engine extra.

O conteúdo vem do Journal publicado, sujeito à audiência e à permissão nativa. O caminho dos hooks confere o userId nativo; o sinal alternativo usa uma configuração de mundo cuja gravação é controlada pelo servidor Foundry. Perder a permissão, retirar a notícia ou excluí-la remove o alerta. Abrir notícia revalida a leitura antes de navegar. Textos recebidos entram por textContent, sem executar HTML de títulos/resumos.

## Implementação e limites

As gravações dos GMs passam pela mesma fila do coordenador. O encaminhamento usa registros temporários no compêndio privado com PLAYER/TRUSTED=NONE. O servidor do Foundry aplica acesso ao compêndio, e os hooks fornecem o usuário que modificou o documento. As operações aceitas são explícitas; não há socket customizado com autoridade baseada em um campo de remetente enviado pelo cliente.

O fluxo atende documentos já em cache e o hook updateCompendium com alterações apenas no índice. Se o coordenador muda durante uma requisição ou não responde, a interface informa a falha; ela não repete uma gravação de resultado incerto automaticamente.

Referências oficiais consultadas: [updateDocument, v13](https://foundryvtt.com/api/v13/functions/hookEvents.updateDocument.html), [updateCompendium, v13](https://foundryvtt.com/api/v13/functions/hookEvents.updateCompendium.html) e [CompendiumCollection, v13](https://foundryvtt.com/api/v13/classes/foundry.documents.collections.CompendiumCollection.html).

A prévia permite testar o envio entre abas do mesmo navegador. Os testes automatizados simulam o contrato do Foundry e não substituem o servidor licenciado. Execute [o roteiro no mundo real](foundry-smoke-test.md), com dois GMs e jogadores separados.

**Após instalar 2.8.2, todos os clientes devem recarregar o Foundry.** Um cliente ainda executando a versão antiga não possui o novo encaminhamento e receptor de alerta.


## Entrega aos clientes — 2.8.2

A publicação pública continua contendo o evento `urgentBroadcast`. Depois de concluir a gravação do Journal, o coordenador grava `holosuite-news.globalBroadcast`, uma configuração de mundo interna, com somente `id`, `articleId`, `documentId`, `sentAt` e `mode`. O `onChange` nativo entrega a referência aos clientes. A confirmação local do adaptador atende o coordenador mesmo se seu callback não ocorrer. Os hooks de Journal permanecem como caminho complementar.

O receptor é iniciado antes da espera dos templates. Quando a notícia/ownership ainda não chegou ao cache, tenta resolver a referência local por até 15 segundos. Só apresenta notícia urgente, pública, validada e com leitura nativa permitida, cujo evento corresponda ao sinal. O sinal entregue ao vivo não compara o relógio local com o do GM. Ao carregar, a última referência e eventos existentes são registrados como histórico, sem replay.

Se o sinal não puder ser salvo, o envio não apresenta sucesso: a publicação permanece pendente e informa Tentar sincronizar. Retry conserva o mesmo evento e não regrava um sinal já confirmado. O identificador deduplica hooks, callback e confirmação local.

SPAM recebido enquanto a aba está oculta aguarda visibilidade no cliente conectado. Somente o mais recente fica aguardando; retirada, mudança de alcance/permissão ou exclusão cancela. Ocultar a aba depois que uma sequência começou continua encerrando a animação ativa. Recarregar descarta pendências locais e não repete a última transmissão.

Referências oficiais v13: [ClientSettings](https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html), [SettingConfig](https://foundryvtt.com/api/v13/interfaces/foundry.types.SettingConfig.html), [WorldSettings](https://foundryvtt.com/api/v13/classes/foundry.documents.collections.WorldSettings.html), [updateDocument](https://foundryvtt.com/api/v13/functions/hookEvents.updateDocument.html).

Os testes com quatro abas usam armazenamento, configuração e receptores reais do módulo, mas simulam a distribuição do servidor Foundry. Não equivalem a uma conferência em servidor licenciado. Após instalar, recarregar todos os clientes e reenviar explicitamente um alerta de cada tipo.
