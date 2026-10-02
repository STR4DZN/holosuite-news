HoloNews foi reconstruído como um jornal do RPG, com notícias individuais e um criador exclusivo do mestre.

- Portal com manchete, capas, categorias, busca, leitura e visualizações narrativas configuráveis.
- Criador com texto rico, capa, autor, data fictícia, público, notas privadas, prévia e salvamento automático.
- Rascunhos separados da versão publicada; publicar aplica a revisão, retirar preserva o rascunho.
- Motion no portal e no criador com animações nativas, opção de reduzir movimento e nenhuma biblioteca adicional no runtime.
- Jogadores veem somente o jornal; operações de criação, edição e administração são exclusivas do mestre.
- Migração de matérias v1 como rascunhos, backup e importação. As releases anteriores permanecem disponíveis.

## Instalação

No Foundry, abra **Add-on Modules → Install Module** e cole em **Manifest URL**:

```text
https://github.com/STR4DZN/holosuite-news/releases/latest/download/module.json
```

Alvo: Foundry VTT v13. Requer **HoloSuite Core**. O arquivo `holosuite-news-v2.1.0.zip` é o pacote instalável; o ZIP `-source` contém o código e a prévia independente.

32 testes unitários e 14 testes de navegador passaram. A integração em um mundo real do Foundry v13 ainda precisa ser validada; a release não declara uma versão verificada. Para atualizar a partir de v1, faça backup do mundo e revise as matérias migradas antes de publicá-las.
