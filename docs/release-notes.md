# HoloNews 2.7.2 — Alerta central de emergência

O alerta global agora ocupa um painel grande no centro da tela, com fundo preto, faixa vermelha de emergência, manchete ampla e símbolo de perigo. Faixas diagonais em movimento, indicador de transmissão e pulsos vermelhos na moldura reforçam a urgência. Os efeitos são finitos e respeitam movimento reduzido.

No criador, **Texto → Publicação e alcance → Transmissão urgente → Enviar alerta global** salva e publica a notícia atual para todos. O comunicado aparece mesmo com o portal fechado. **Abrir notícia** fecha o alerta imediatamente antes de abrir a matéria; **Dispensar** também remove o painel.

O centro do painel acompanha a tela em desktop, celular e janelas baixas. Resumos longos rolam dentro do painel e os botões continuam visíveis. Notas privadas ficam fora da transmissão. A edição pelos dois GMs e a proteção contra sobrescritas continuam disponíveis.

Validação: TypeScript, lint, 48 testes unitários e 53 de navegador, incluindo centralização, cores, texto longo, envio a dois leitores e fechamento antes da abertura. A conferência em servidor Foundry 13 licenciado continua pendente.

**Todos os clientes, incluindo os dois GMs e os jogadores, devem recarregar o Foundry depois da atualização.**
