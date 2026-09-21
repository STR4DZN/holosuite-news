# Smoke test real no Foundry v13

Este procedimento é o gate de host e multiplayer. Não substitua seus resultados por testes unitários, preview ou inspeção de ZIP.

## Ambiente

Registre antes do teste:

- versão exata do Foundry v13 e build;
- sistema de jogo e versão;
- HoloSuite Core e versão;
- HoloNews e hash SHA-256 do ZIP;
- navegador de cada cliente;
- mundo novo ou cópia descartável usada no teste.

Use pelo menos dois clientes simultâneos: um GM e um jogador sem privilégios. Para visibilidade específica, use também um segundo jogador.

## Preparação

1. Instale o ZIP runtime com `module.json` na raiz de `Data/modules/holosuite-news`.
2. Ative HoloSuite Core e HoloNews.
3. Abra o console do GM e dos jogadores; preserve logs desde o carregamento do mundo.
4. Confirme que existe exatamente um mosaico HoloNews no HoloSuite.
5. Confirme que não apareceu launcher concorrente em Scene Controls.

## Fluxo vertical obrigatório

1. Como GM, abra HoloNews e crie uma Publicação.
2. Crie uma Edição e confirme que a Capa inicial foi criada.
3. Crie uma Matéria com título, ProseMirror formatado, imagem, texto alternativo e `18.432` views.
4. Faça preview como jogador e confirme ausência de notas, regras de visibilidade, audit log e controles de edição.
5. Publique a Edição explicitamente.
6. No cliente jogador, abra HoloSuite, HoloNews, a Capa e a Matéria.
7. Confirme `18.432` visualizações e nenhum controle administrativo.
8. Como GM, abra **Leituras reais** e confirme que o jogador correto foi registrado.

## Segurança e permissões

1. Crie um rascunho e confirme que nenhum jogador recebe título, ID, corpo ou bloco relacionado.
2. Crie uma Matéria `specific-users` para Jogador A. Confirme que A vê e B não vê.
3. Crie uma Matéria `exclude-users` excluindo A. Confirme que A não vê e B vê.
4. Desative uma Publicação e confirme sua remoção das projeções.
5. Pelo console do jogador, tente chamar `createPublication`, `publishIssue`, `importBackup` e `openManager`; confirme rejeição ou bloqueio antes de mutação.
6. Inspecione os `JournalEntry` disponíveis ao jogador. O Master data não pode aparecer; apenas sua projeção deve ser legível.
7. Envie mensagens de socket com `userId`, tipo desconhecido e campos extras; confirme que não há mutação.

## Ciclo de vida e rede

1. Publique, despublique e arquive uma Edição; verifique ambos os clientes a cada transição.
2. Desconecte o GM, abra uma matéria como jogador e reconecte o GM; confirme processamento posterior do sinal pendente.
3. Mantenha dois GMs ativos; confirme que uma leitura incrementa apenas uma vez.
4. Crie e exclua um usuário; confirme reconstrução e remoção das projeções correspondentes.
5. Recarregue o módulo/mundo; confirme registro HoloSuite sem duplicação e persistência de dados.
6. Agende uma Edição para dois minutos no futuro; confirme publicação por um único GM primário.

## UI e acessibilidade

1. Teste Reader em 320×568, 360×800, 390×844 e 430×932.
2. Teste Mesa editorial em 1366×768 e 1920×1080.
3. Navegue somente com teclado; confirme foco visível, ordem lógica e retorno por Escape.
4. Ative alto contraste, escala máxima de texto e redução de movimento.
5. Teste os sete temas, títulos longos, matéria extensa, imagem vertical, horizontal e ausente.
6. Confirme ausência de scroll horizontal da janela inteira; tabelas podem usar o contêiner dedicado.

## Evidência mínima

Preserve:

- screenshots de Capa, Matéria, Mesa editorial e visibilidade específica;
- console e network logs dos clientes;
- vídeo curto ou trace do fluxo vertical;
- lista dos documentos visíveis a cada função;
- versão, ambiente, data, operador e resultado de cada caso;
- falhas com passos reprodutíveis, resultado esperado e resultado observado.

Classifique a entrega como validada em Foundry somente quando todos os casos obrigatórios passarem em um host real.
