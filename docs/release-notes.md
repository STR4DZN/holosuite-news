O visual Prisma passa a ser a identidade do HoloNews no portal dos jogadores, na leitura de notícias e nas ferramentas exclusivas do mestre.

- **Identidade:** logo geométrica redesenhada, fundo escuro, degradês roxos e ciano, cores por categoria e detalhes editoriais nas capas e nos cards.
- **Leitura:** tempo estimado, identificação do autor, apresentação de notícias sem capa e layouts adaptados a janelas estreitas e texto ampliado.
- **Mestre:** redação e lista de notícias com o mesmo visual, editor rico legível e autosave sem interromper a digitação ou levantar a lista de notícias.
- **Campanha:** cabeçalho usa o nome, slogan e rede configurados; os jogadores continuam vendo apenas conteúdo publicado e autorizado.

Sem novas dependências de execução. Inclui uma prévia HTML independente para experimentar o portal e o criador.

## Instalação / atualização

Atualize HoloNews nos módulos do Foundry. Se necessário, reinstale pelo mesmo manifesto:

```text
https://github.com/STR4DZN/holosuite-news/releases/latest/download/module.json
```

A tag é **v2.2.0** e o pacote instalável é `holosuite-news-v2.2.0.zip`. Requer Foundry v13 e HoloSuite Core. Recarregue o navegador depois da atualização.

Validação: TypeScript, lint, 34 testes unitários, 21 testes de navegador e conferência do pacote. Os testes incluem texto, formatação, autosave, permissões, categorias e janelas estreitas. Os testes do adaptador não substituem a validação dentro de um mundo real do Foundry.
