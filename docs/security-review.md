# Revisão de segurança

Data da revisão: 20 de setembro de 2026  
Escopo: código-fonte, dependências, templates Handlebars, protocolo de socket, armazenamento Foundry e artefato de distribuição do HoloNews 1.0.0.

## Resultado executivo

Nenhum achado aberto de severidade crítica ou alta foi identificado na revisão local. O módulo separa dados editoriais privados das projeções entregues aos jogadores, exige autoridade de GM para mutações, não confia em identidade enviada por socket e saneia todo conteúdo rico antes dos quatro pontos de renderização Handlebars com chaves triplas.

Esta conclusão cobre análise estática, testes automatizados e preview em navegador. Ela não substitui a verificação das permissões reais de `JournalEntry`, do socket e do comportamento multiplayer em uma instalação licenciada do Foundry VTT 13.

## Modelo de confiança

- O `MasterState`, incluindo notas do GM, leituras e auditoria, reside em um `JournalEntry` sem acesso padrão e só é carregado ou salvo por um GM.
- Cada jogador recebe um `JournalEntry` de projeção próprio, com nível Observer, contendo apenas conteúdo publicado e autorizado para aquele usuário.
- Chamadas de API de jogador sempre usam `game.user.id`; um `userId` fornecido por outro módulo não pode selecionar a projeção de outra pessoa.
- Mensagens de socket são apenas sinais. O GM resolve a identidade pelo documento `User`, confere a visibilidade atual da matéria e registra a leitura com o relógio do GM.
- Somente o GM ativo primário processa sinais e reconstruções, evitando processamento duplicado entre vários GMs.

## OWASP Top 10 — Web Applications 2021

| Categoria | Resultado | Controles verificados |
| --- | --- | --- |
| A01 Controle de acesso quebrado | Aprovado localmente | `assertGM()` em toda mutação; projeções por usuário; leitura pública vinculada ao usuário conectado; relações de matérias também são filtradas. |
| A02 Falhas criptográficas | Não aplicável ao módulo | O módulo não armazena credenciais nem implementa criptografia própria. Confidencialidade depende das permissões de documentos e do transporte do Foundry. |
| A03 Injeção | Aprovado localmente | Rich text passa por DOMPurify ou por allowlist defensiva; esquemas executáveis são removidos; CSS aceita apenas hex de seis dígitos; não há `eval`, `new Function` ou shell com entrada do usuário. |
| A04 Design inseguro | Aprovado localmente | Master/projeção, publicação explícita, revisão otimista, validação referencial, limites de importação e eleição de GM primário são invariantes do domínio. |
| A05 Configuração insegura | Aprovado localmente | Manifesto exige Foundry 13 e HoloSuite Core 1.0.12; ZIP de runtime exclui fontes, testes e dependências; sourcemap permanece intencional para diagnóstico local. |
| A06 Componentes vulneráveis | Aprovado | `npm audit` reportou zero vulnerabilidades após a atualização do Vitest para 4.1.11. |
| A07 Identificação e autenticação | Herdado do Foundry | O módulo usa `game.user` e as permissões nativas; não cria autenticação paralela. |
| A08 Integridade de software e dados | Aprovado localmente | Importação exige schema conhecido, limites, referências consistentes e revisão esperada; artefatos recebem SHA-256 externo; schemas futuros são recusados. |
| A09 Logging e monitoramento | Aprovado com limite | Ações editoriais entram em auditoria privada limitada a 10.000 registros; erros de socket inválido e persistência são registrados sem despejar o estado editorial. |
| A10 SSRF | Não aplicável no servidor | O módulo não busca URLs no backend. URLs HTTP(S) de imagens podem ser carregadas diretamente pelo navegador do jogador, conforme conteúdo escolhido pelo GM. |

## Varreduras e testes de segurança

- Semgrep 1.177.0: 74 regras TypeScript/JavaScript, 32 arquivos, zero achados.
- Auditoria de dependências npm: zero vulnerabilidades conhecidas.
- Busca de segredos: nenhum token, chave privada, credencial ou string de conexão de alta confiança encontrado fora de dependências e artefatos.
- Testes unitários cobrem IDOR de projeção, vazamento de IDs relacionados, contrabando de identidade por socket, injeção CSS, URL `javascript:`, SVG `data:` executável, sanitização sem Foundry/DOMPurify, visibilidade e sinais de leitura.

## Riscos residuais e limites

1. **Permissões do host ainda precisam de smoke real.** A semântica Observer/Owner e a atualização de flags foram implementadas segundo a API do Foundry VTT 13, mas devem ser confirmadas com um GM e dois jogadores reais.
2. **Imagens externas têm impacto de privacidade.** Um GM pode cadastrar uma imagem HTTP(S); ao abrir o jornal, o cliente do jogador contata esse host. Use arquivos armazenados no Foundry quando a campanha exigir privacidade de rede.
3. **Conteúdo editorial vem de usuários confiáveis com papel de GM.** O módulo protege jogadores e o host contra conteúdo executável, mas não tenta separar privilégios entre GMs da mesma mesa.
4. **Sourcemap no runtime.** `dist/main.js.map` é distribuído para facilitar suporte. Removê-lo reduz exposição do código legível, mas não é um controle de segurança efetivo para JavaScript entregue ao cliente.

## Gate para publicação

Antes de publicar em produção, execute o roteiro em `docs/foundry-smoke-test.md` com Foundry VTT 13, HoloSuite Core 1.0.12, um GM e pelo menos dois jogadores. Qualquer acesso cruzado a projeção, leitura de notas do GM ou possibilidade de edição do documento de projeção pelo jogador bloqueia a entrega.
