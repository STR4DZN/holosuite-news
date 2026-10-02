# Segurança e permissões v2

Rascunhos e notas são guardados em um compêndio com PLAYER/TRUSTED=NONE e ASSISTANT/GAMEMASTER=OWNER. O adaptador rejeita acesso do GM se esse compêndio estiver configurado para jogadores. O módulo não coloca drafts, notes ou backups em novos documentos públicos.

A audiência pública é validada na projeção do portal e nas permissões nativas do JournalEntry. Ao mudar a audiência, o mapa ownership inteiro é substituído, removendo permissões obsoletas. Dados recebidos anteriormente por um jogador não podem ser revogados retroativamente. A confidencialidade de flags em documentos de mundo depende do comportamento do servidor Foundry, não de esconder botões; a v2 evita guardar segredos administrativos nesses documentos.

HTML é enriquecido com secrets=false e sanitizado. Sem DOMPurify, uma lista de elementos/atributos e URLs permitidos remove scripts, handlers e protocolos executáveis. Textos comuns e atributos dos templates são escapados pelo Handlebars. As imagens são validadas na gravação e leitura.

Backups exportados contêm segredos e são exclusivos do GM responsável. Importação valida o arquivo completo antes da primeira gravação, gera IDs novos e nunca publica. A migração preserva um backup completo v1 no compêndio privado, mas não apaga os antigos Journals v1: suas permissões/comportamento preexistentes permanecem até a limpeza manual.

Testes com mocks cobrem negar jogadores/segundo GM, negar compêndio aberto, substituição de ownership e não publicar notas. Falta teste real com sessões GM/player separadas para comprovar o controle de acesso servidor, o fluxo de Compendium e enriquecimentos nativos.

Os construtores de janelas administrativas, preparação de contexto e ligação de eventos revalidam o papel do usuário. Perder o papel de mestre fecha o criador/lista e cancela seus timers. Motion nunca clona rascunhos, notas ou a interface inteira em overlays; a transição da imagem usa somente a capa já visível na notícia.
