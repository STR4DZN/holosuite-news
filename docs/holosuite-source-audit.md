# Auditoria do contrato HoloSuite Core

## Fonte verificada

- repositório: HoloSuite Core;
- commit inspecionado: `38b825e836ca837210875958b8afd3aa631a033d`;
- versão do módulo: 1.0.12;
- compatibilidade declarada: Foundry 12 mínimo, 14 verificado.

## Contrato encontrado

`registerApp` recebe `id`, `title`, `icon`, `premium`, `playerVisible`, `description`, `featureId` e `open`. Registros com o mesmo ID substituem a entrada anterior no `Map`, o que torna a repetição segura.

O Core emite `holosuite-core.apiReady` quando expõe sua API e repete a exposição nos ciclos `init` e `ready`. HoloNews escuta esse hook e também tenta registrar no próprio `ready` e em hot reload.

O filtro de aplicações respeita `playerVisible` e a opção global de desativar aplicações para jogadores. O callback `open` é avaliado no cliente atual: GMs recebem a Mesa editorial e jogadores recebem o Reader.

## Badge

O Core não oferece um provedor genérico de badge para aplicações externas. O método de badge atual reconhece IDs internos conhecidos. HoloNews não modifica DOM ou código do Core; o total de não lidas aparece dentro do Reader. Uma extensão de badge externo pertence ao roadmap do Core, não ao contrato desta versão.

## Decisão

HoloNews exige HoloSuite Core 1.0.12 e usa exclusivamente o registro oficial. A API própria continua disponível para macros e testes, mas nenhum launcher concorrente é criado.
