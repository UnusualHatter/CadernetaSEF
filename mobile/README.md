# Agenda Contábil — app de celular

Versão para celular da agenda do projeto Sustentabilidade Econômica e Financeira.
É um PWA: abre no navegador do celular, pode ser instalado na tela inicial e
funciona sem internet. Por enquanto roda sozinho, com dados fictícios salvos no
próprio aparelho. Não precisa de servidor, build nem `npm install`.

Telas: login, início (resumo do dia), agenda (semana, dia e mês), atendidos
(busca, ficha e cadastro), novo atendimento em 3 passos, detalhe do atendimento
(status, documentos, lembrete, histórico, reagendamento), painel de impacto com
exportação em CSV e administração de serviços e documentos. Tema claro, escuro e
automático.

## Rodando

```sh
cd mobile
python3 -m http.server 8080
```

No notebook, abra `http://localhost:8080`. Em tela larga o app aparece dentro de
uma moldura de celular. No celular, abra `http://<ip do notebook>:8080` (os dois
na mesma rede Wi-Fi).

O modo instalável e o uso sem internet só funcionam em HTTPS ou em `localhost`.
Para a apresentação, o jeito mais simples é publicar a pasta `mobile/` em
qualquer hospedagem estática (GitHub Pages, Netlify, Vercel): abra o endereço no
Chrome do celular, abra o menu e escolha "Instalar app" ou "Adicionar à tela
inicial". Depois de aberto uma vez, ele funciona offline.

Login de demonstração (já vem preenchido): `admin@agenda.local` / `password`.
Também existem `equipe@agenda.local` e `visualizador@agenda.local`, com a mesma
senha. O perfil também troca pelo menu do avatar, sem sair.

Antes de apresentar, abra o menu do avatar e use "Restaurar dados de
demonstração". A agenda é montada em torno do dia em que os dados são criados;
se você testar um dia e apresentar em outro, o "hoje" fica vazio até restaurar.

Se alterar algum arquivo, aumente o número em `CACHE` no `sw.js`. Sem isso o
celular continua mostrando a versão antiga que está no cache.

## Testes

```sh
npm test
```

Cobrem as regras do PRD: conflito de horários, transições de status, cópia do
checklist ao agendar, permissões por perfil, lembretes, cadastro de atendidos e
os indicadores do painel.

## Estrutura

```
index.html, manifest.webmanifest, sw.js   PWA
css/app.css                               mesmos tokens do sistema web
js/data.js                                status, serviços e documentos
js/domain.js                              regras de negócio (agendar, conflito, status, permissões)
js/queries.js                             indicadores do painel de impacto
js/seed.js                                dados fictícios
js/store.js                               onde os dados ficam (localStorage)
js/views/                                 uma tela por arquivo
tests/                                    node --test
```

Toda regra mora em `domain.js` e todo acesso a dados passa por `store.js`. As
telas só chamam `store.commit(...)` e leem `store.state`.

## Ligando ao servidor

Quando a API do Milestone 6 existir, só `store.js` e as funções de `domain.js`
precisam trocar de `localStorage` para requisições. As telas continuam iguais.
Hoje as telas leem `store.state` de forma síncrona; com a API, `store` passa a
carregar os dados com `fetch` ao abrir cada tela e `commit` vira uma chamada
`POST`/`PATCH` que devolve o registro atualizado.

| Ação no app (`domain.js`) | Endpoint |
| --- | --- |
| `store.login` | `POST /api/v1/login` (Sanctum, devolve token e usuário com `role`) |
| `searchClients` | `GET /api/v1/clients?search=&type=` |
| `saveClient` (novo) | `POST /api/v1/clients` |
| `saveClient` (editar) | `PATCH /api/v1/clients/{id}` |
| `clientAppointments` | `GET /api/v1/appointments?client_id=` |
| `appointmentsInRange` | `GET /api/v1/appointments?from=&to=&responsible_id=&status=` |
| `scheduleAppointment` | `POST /api/v1/appointments` |
| `rescheduleAppointment` | `PATCH /api/v1/appointments/{id}` (`starts_at`, `ends_at`, `responsible_user_id`) |
| `changeStatus` | `PATCH /api/v1/appointments/{id}/status`; cancelar também em `POST /api/v1/appointments/{id}/cancel` |
| `toggleDocument` | `PATCH /api/v1/appointments/{id}/documents/{document}` |
| `sendReminder` | `POST /api/v1/appointments/{id}/reminder` |
| `restoreAppointment` (desfazer) | `PATCH` com o status anterior; hoje a transição de volta não é permitida pelo enum, então o servidor precisa de uma regra de desfazer |
| `state.services` | `GET /api/v1/services` (com categoria e documentos) |
| `addServiceDocument`, `removeServiceDocument`, `setServiceActive` | `/api/v1/services/{id}` e `/api/v1/services/{id}/documents` (só administrador) |
| `indicators` | `GET /api/v1/reports/impact?from=&to=` e `GET /api/v1/reports/impact.csv` |

O que o servidor precisa devolver além do PRD:

- `users` com `id`, `name`, `role` e `active`, para o seletor de responsável;
- em cada atendimento: `documents` (com `received_at`), `activities` e
  `reminder_sent_at`;
- erros de regra (conflito, transição inválida, permissão) como `422` com a
  mesma mensagem em português que `domain.js` usa em `ValidationError`, para o
  app só mostrar o texto.

Datas: o app guarda horários em milissegundos locais. A API usa UTC (RNF-004);
converta para `America/Sao_Paulo` ao exibir.

## Pendências conhecidas

- E-mail e telefone do projeto vêm da ficha de papel
  (`projetosustentabilidade@feevale.br`, `99125-1538`). O DDD `51` foi suposto.
  Ajuste em `PROJECT` no `js/data.js`.
- O lembrete por e-mail é simulado no app (só marca como enviado). O envio real
  é do Laravel (`appointments:send-reminders`). O botão do WhatsApp já abre a
  conversa de verdade com a mensagem pronta.
- O link de confirmar/cancelar do lembrete depende do servidor (URL assinada).
