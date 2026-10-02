# Contexto de manutenção

A branch reformulation/holonews-v2 substitui o CMS v1 por um portal simples com notícias individuais. A v1 continua recuperável pelo histórico do Git. Não reintroduza publicações/edições/páginas/blocos, rastreamento real de leitura ou agendamento sem uma decisão de produto explícita.

Regras: rascunho separado da versão publicada; GM notes somente no compêndio privado; notícias publicadas sem dados de administração; escritas por GM responsável; verificação de revisão por notícia; falhas de publicação duráveis e recuperáveis; importação como novos rascunhos.

A integração HoloSuite continua usando registerApp e evento apiReady. Não modifica launcher ou shell do Core. O alvo é Foundry v13; ainda falta smoke test em um mundo real. A prévia reutiliza serviço, modelos, templates e estilos, mas adapta o editor e armazenamento.
