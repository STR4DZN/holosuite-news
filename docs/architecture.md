# Arquitetura v2

`Article` contém os campos da notícia e audiência. `NewsItem` contém draft, notes, published, revisões e estado de sincronização. A camada Newsroom valida e serializa operações; os adaptadores implementam armazenamento.

Um JournalEntry por notícia no compêndio de mundo privado guarda o NewsItem. Um JournalEntry de mundo por notícia publicada guarda somente o Article. Não há Master v2 monolítico, cópia por jogador, reconstrução a cada rascunho ou atualização periódica.

Publicar: grava snapshot desejado e pending=true no armazenamento privado; atualiza só o documento público correspondente com ownership substituído integralmente; marca pending=false. Retirar usa o mesmo fluxo com snapshot=null. Se a operação falha entre as escritas, o estado desejado permanece e pode ser repetido no painel ou na próxima inicialização do GM responsável.

Não há transação atômica entre documentos. Durante uma falha, a versão pública anterior pode continuar visível até a recuperação. O estado de sincronização pendente é exibido. Escritas são limitadas ao GM ativo de menor ID, com fila local e comparação de revisões por notícia. Isso não é CAS de servidor; troca do GM durante uma operação precisa ser testada no ambiente real.

Publicação é ordenada pela primeira data de publicação real, enquanto a data mostrada é um campo fictício livre. Destaques recebem prioridade na capa. Busca indexa título, resumo, autor, categoria e tags; o corpo não é enriquecido nem percorrido a cada busca. A interface renderiza 12 notícias por página, e só enriquece o texto da matéria aberta.

O Foundry carrega os Journals públicos do mundo; ainda existe custo proporcional ao arquivo público. A v2 elimina multiplicação por jogador e gravação global, mas não promete custo constante para arquivos ilimitados.
