Correção dos problemas de edição relatados no Foundry após a versão 2.1.0.

- **Autosave:** a janela Notícias do mestre aguarda o fechamento dos criadores para atualizar sua lista; ela não deve interromper a digitação. Atualizações automáticas não reabrem janelas fechadas.
- **Texto da notícia:** editor ProseMirror sempre ativo, com altura explícita, layout flexível, texto/cursor legíveis e espaçamento para formatação.
- **Erro querySelector:** remoção dos eventos ao fechar/remontar, proteção de timers e descarte de prévias de formulários antigos.

## Instalação / atualização

Atualize HoloNews nos módulos do Foundry. Se necessário, reinstale pelo mesmo manifesto:

```text
https://github.com/STR4DZN/holosuite-news/releases/latest/download/module.json
```

A tag é **v2.1.1** e o pacote instalável é `holosuite-news-v2.1.1.zip`. Requer Foundry v13 e HoloSuite Core. Recarregue o navegador depois da atualização.

34 testes unitários e 18 testes de navegador passaram, incluindo regressões de autosave/foco, estrutura do editor, HTML formatado, eventos tardios e prévias assíncronas. A simulação do adaptador não substitui o teste do engine nativo em um mundo real do Foundry.
