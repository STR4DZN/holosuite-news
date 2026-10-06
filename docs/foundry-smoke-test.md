# Teste obrigatório em Foundry v13 + HoloSuite Core

Use uma cópia de teste do mundo e sessões separadas de GM, jogador e jogador selecionado. A entrega não executou este roteiro em servidor Foundry licenciado.

1. Instalar/ativar e confirmar o tile HoloNews no HoloSuite sem duplicação. Conferir abertura de portal para jogador e lista para GM.
2. Criar notícia; confirmar compêndio `world.holonews-workspace`, permissões PLAYER/TRUSTED=NONE, ASSISTANT/GAMEMASTER=OWNER. Como jogador, tentar carregar o compêndio e o ID de um rascunho; o servidor precisa negar.
3. Digitar no editor ProseMirror, formatar, inserir link de documento, escolher capa no File Picker e conferir prévia/legenda. Esperar autosave, fechar e reabrir; conteúdo precisa continuar salvo.
4. Publicar para todos. Abrir como player; conferir corpo, views, data e imagem. Verificar flags do Journal público: nenhum notes, draft ou backup.
5. Editar título/corpo/contador/visibilidade; esperar autosave. Player precisa continuar vendo a versão anterior. Publicar revisão e conferir atualização sem reabrir janela.
6. Publicar para jogador selecionado. GM e selecionado podem ler; outro jogador não vê no portal e não tem OBSERVER no Journal. Trocar para GM-only e conferir remoção da permissão anterior.
7. Retirar do portal, duplicar, excluir com confirmação. Fechar portal; uma alteração posterior não deve reabri-lo.
8. Exportar/importar backup; importação cria rascunhos novos com notas. Simular erro de gravação pública; pending aparece e tentar sincronizar recupera o estado.
9. Conectar dois GMs: ambos abrem a lista e o criador sem bloqueio. Criar/editar/publicar pelo segundo GM. Editar notícias diferentes simultaneamente; ambas devem persistir. Abrir a mesma notícia nos dois clientes: a segunda gravação da revisão antiga deve ser rejeitada sem apagar o texto da janela. Desconectar o coordenador, conferir mudança de responsabilidade e recuperação.
10. Mundo v1: clicar Trazer notícias antigas. Conferir backup integral, rascunhos/notes/views/autores/atualizações, execução repetida sem duplicatas e manutenção dos documentos antigos. Revisar público antes de publicar. Validar antes de remover documentos v1.
11. Recarregar com GM offline: portal deve continuar lendo as publicadas. Conferir janela redimensionada, teclado, busca e preferência de redução de movimento.

Se algum passo falhar, não use a v2 no mundo principal até corrigir e repetir esse passo. Registre versão exata do Foundry/Core, navegador e erro do console.

12. Motion: conferir abertura, cartões, troca de categoria, capa/matéria, progresso de leitura, novas linhas e seções do criador. Alterar a preferência Reduzir animações com o editor aberto; não deve apagar valores nem remontar o formulário. Ocultar a aba e fechar/reabrir repetidamente; não deve acumular efeitos.
13. Rebaixar a função do GM numa sessão de teste: as janelas administrativas precisam desaparecer imediatamente e novas chamadas de criar/publicar/exportar devem ser recusadas. Voltar a GM e reabrir normalmente.

## Regressões do criador (2.1.1)

- Deixe a lista de notícias aberta atrás do criador. Digite título, resumo e texto com pausas maiores que um segundo: o autosave deve concluir sem trazer a lista para frente ou tirar o foco do campo.
- Confira texto, títulos, listas, negrito e cursor no campo Texto da notícia, além da prévia. Feche e reabra: o HTML do rascunho deve persistir.
- Feche imediatamente depois de digitar; aguarde alguns segundos. Não deve aparecer erro de querySelector. Repita fechando a lista antes de fechar o criador: a lista não deve reabrir.
- O teste automatizado do adaptador usa as classes reais do módulo com contratos simulados de ApplicationV2 e estrutura ProseMirror; ele não executa o engine licenciado do Foundry.


## Transmissão urgente — 2.7

- Recarregar todos os clientes após atualizar. Conectar dois GMs e dois jogadores, um deles com o portal fechado.
- Pelo segundo GM, preencher título/resumo/corpo e notas privadas; clicar Enviar alerta global. Conferir que ambos os jogadores recebem um painel grande vermelho e preto no centro da tela; Abrir notícia fecha o alerta antes de mostrar o mesmo texto. Notas não podem aparecer.
- Repetir com uma notícia antes restrita: o botão informa publicação para todos e deve atualizar audiência/ownership para todos, além de marcar urgência.
- Conferir que salvar, publicar normalmente ou marcar apenas Notícia urgente não dispara o painel global.
- Dispensar; reenviar explicitamente; conferir novo alerta, sem duplicar por callbacks repetidos. Recarregar um cliente: o alerta antigo não se repete.
- Com movimento reduzido, enviar novamente: comunicado estático e botões presentes. Ativar redução durante a animação: os efeitos param. Ocultar a aba e voltar: não deve haver animação infinita ou camadas acumuladas.
- Retirar/excluir a notícia ou revogar permissão nativa com o alerta aberto: o overlay deve ser removido.
- Como jogador, tentar uma publicação ou um comando no compêndio privado: o servidor deve negar. Hooks sem userId de GM não devem emitir alerta global.
