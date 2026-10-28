# HoloNews 2.8.2 — Entrega dos avisos aos clientes

- Sinal global mínimo em configuração de mundo sincronizada nativamente pelo Foundry, complementar aos hooks de Journal. O GM coordenador confirma localmente o evento persistido.
- Receptor dos avisos inicializado antes de aguardar templates. Aguardam-se até 15 segundos pelo documento público/ownership quando chegam depois do sinal.
- Recepção autenticada do sinal não depende do relógio do jogador; exige correspondência do evento no Journal e permissão de leitura. Nenhum rascunho ou nota privada entra no sinal.
- SPAM recebido em aba oculta aguarda o retorno à tela, em vez de ser descartado. Um envio mais recente substitui o anterior; retirada/revogação cancela o pendente.
- Eventos registrados ao entrar/recarregar não são reproduzidos. Hooks, sinal e confirmação local deduplicam o mesmo envio.
- Falha na sincronização do sinal é informada e mantém operação pendente para Tentar sincronizar. Retry conserva identificador/modo e não regrava sinal já confirmado.
- Novos testes exercitam o adaptador real de armazenamento, a configuração de mundo e os receptores em quatro abas, com transporte do servidor simulado, sem hooks de Journal, atraso e relógio divergente.

**Todos os clientes devem recarregar o Foundry depois da atualização.**
