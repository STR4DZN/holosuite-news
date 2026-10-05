# HoloNews 2.7.0 — Dois GMs e transmissão urgente

Todos os GMs agora podem abrir e usar o módulo simultaneamente. A escolha de um coordenador vale para a fila de gravações e deixa de bloquear lista e criador. As operações do segundo GM passam pela mesma fila, mantendo a verificação de revisão para impedir sobrescritas.

No criador, **Texto → Publicação e alcance → Transmissão urgente → Enviar alerta global** salva o texto atual e publica essa versão como urgente para todos. Um painel aparece na tela dos clientes conectados, mesmo com o portal fechado, com **Abrir notícia** e **Dispensar**.

- Paleta de urgência em vermelho quente/âmbar, painel legível, linha de transmissão, molduras e pulsos finitos.
- Movimento reduzido mantém comunicado e botões sem animação; ativar redução durante o efeito cancela a sequência.
- Reenvio explícito, sem duplicação por hooks repetidos ou replay ao reconectar.
- Notas privadas fora da notícia e do alerta; permissão de leitura revalidada ao abrir.
- Encaminhamento dos GMs pelo compêndio privado, com origem verificada nos hooks nativos. Sem socket customizado ou dependência adicional.
- Notícias diferentes podem ser editadas pelos dois GMs; uma revisão antiga da mesma notícia é rejeitada preservando o texto na janela.
- Prisma e as oito identidades editoriais mantidos.

Validação: TypeScript, lint, 48 testes unitários e 52 de navegador. A suíte inclui testes unitários de dois GMs, conflitos, origem, recuperação e timeout; testes de navegador com dois leitores, portal fechado, redução de movimento, conteúdo longo, reenvio, reconexão e abertura da notícia. A validação no mundo real Foundry 13 + HoloSuite Core continua pendente.

**Todos os clientes, incluindo os dois GMs e os jogadores, devem recarregar o Foundry depois da atualização.**

Guia: `docs/global-urgent.md`. Roteiro do mundo real: `docs/foundry-smoke-test.md`.
