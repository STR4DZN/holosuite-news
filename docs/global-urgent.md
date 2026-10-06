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

## Movimento e privacidade

O modo reduzido do usuário ou do sistema mantém o painel estático. Ativar redução ou ocultar a aba cancela os efeitos. Os efeitos são locais, finitos e usam APIs nativas, sem áudio automático, vídeo, canvas ou engine extra.

O conteúdo vem do Journal publicado, sujeito à audiência e à permissão nativa. A origem do envio é conferida pelo userId do hook nativo. Perder a permissão, retirar a notícia ou excluí-la remove o alerta. Abrir notícia revalida a leitura antes de navegar. Textos recebidos entram por textContent, sem executar HTML de títulos/resumos.

## Implementação e limites

As gravações dos GMs passam pela mesma fila do coordenador. O encaminhamento usa registros temporários no compêndio privado com PLAYER/TRUSTED=NONE. O servidor do Foundry aplica acesso ao compêndio, e os hooks fornecem o usuário que modificou o documento. As operações aceitas são explícitas; não há socket customizado com autoridade baseada em um campo de remetente enviado pelo cliente.

O fluxo atende documentos já em cache e o hook updateCompendium com alterações apenas no índice. Se o coordenador muda durante uma requisição ou não responde, a interface informa a falha; ela não repete uma gravação de resultado incerto automaticamente.

Referências oficiais consultadas: [updateDocument, v13](https://foundryvtt.com/api/v13/functions/hookEvents.updateDocument.html), [updateCompendium, v13](https://foundryvtt.com/api/v13/functions/hookEvents.updateCompendium.html) e [CompendiumCollection, v13](https://foundryvtt.com/api/v13/classes/foundry.documents.collections.CompendiumCollection.html).

A prévia permite testar o envio entre abas do mesmo navegador. Os testes automatizados simulam o contrato do Foundry e não substituem o servidor licenciado. Execute [o roteiro no mundo real](foundry-smoke-test.md), com dois GMs e jogadores separados.

**Após instalar 2.7.3, todos os clientes devem recarregar o Foundry.** Um cliente ainda executando a versão antiga não possui o novo encaminhamento e receptor de alerta.
