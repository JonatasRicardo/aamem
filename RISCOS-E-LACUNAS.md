# Riscos e Lacunas — aamem

Levantamento feito a partir da análise do código-fonte em 2026-08-26 (branch `main`, commit `e891964`).
Serve como backlog priorizado para a próxima iteração.

**Atualizado em 2026-08-26:** os três itens de severidade Alta (1, 2 e 3) foram implementados.
As seções correspondentes registram o que foi feito e o que ficou de fora.

> Nota: os guias em `node_modules/next/dist/docs/` foram consultados depois da análise inicial e
> corrigiram o enquadramento do item 12.

## Priorização

| # | Item | Severidade | Esforço | Área | Status |
|---|---|---|---|---|---|
| 1 | Endpoint público de pedidos sem proteção contra abuso | Alta | M | Segurança | ✅ resolvido (captcha adiado) |
| 2 | Rota de contato sem verificação de posse | Alta | P | Segurança | ✅ resolvido |
| 3 | Upload de logo sem validação | Alta | P | Segurança | ✅ resolvido |
| 4 | Sem limite de tenants por conta | Média | P | Abuso | pendente |
| 5 | Regras do Firestore/Storage fora do repositório | Média | M | Segurança / IaC | ✅ resolvido |
| 6 | Sem security headers em `next.config.ts` | Média | P | Segurança | pendente |
| 7 | Rota de logo é proxy caro | Média | M | Performance | pendente |
| 8 | Sem CI | Média | P | Processo | pendente |
| 9 | Cobertura de teste desequilibrada | Média | G | Qualidade | pendente |
| 10 | `create-your-own-flow.tsx` com 1017 linhas | Baixa | M | Manutenção | pendente |
| 11 | Impossível apagar a descrição do minisite | Baixa | P | Bug de produto | pendente |
| 12 | Adotar Cache Components em vez de `unstable_cache` | Baixa | M | Dívida técnica | pendente (opcional) |
| 13 | Bucket fora do Firebase Storage: `storage.rules` não se aplica | Média | M | Segurança / IaC | ✅ resolvido |
| 14 | Índice de collection group ausente: SSG silenciosamente desligado | Média | P | Performance | ✅ índice criado (aguardando build) |
| 15 | Limite de 2 MB da logo rejeita imagens já em uso | Média | P | Produto | ✅ decidido: manter 2 MB |

---

## 1. Endpoint público de pedidos de oração sem proteção contra abuso

**Severidade: Alta**

`POST /api/tenants/[tenant]/prayer-requests` (`src/app/api/tenants/[tenant]/prayer-requests/route.ts`)
não exige autenticação — o que é correto por design — mas também não tem rate limit, captcha,
limite de tamanho de mensagem nem verificação de origem.

Agravante: `createPrayerRequest` (`src/lib/tenants/data.ts:541`) valida apenas o **formato** do slug
via `assertTenantSlug`, nunca se o tenant existe ou está publicado. Como o Firestore cria
subcoleções implicitamente na primeira escrita, é possível popular
`tenants/{slug-inexistente}/prayerRequests` com documentos órfãos, inflando custo de armazenamento
e poluindo queries de collection group.

**Ações**
- [x] Em `createPrayerRequest`, carregar o tenant e rejeitar se não existir ou se `status !== "published"`.
- [x] Limitar o tamanho de `message` (2.000 caracteres) além do mínimo de 3 que já existe.
- [x] Adicionar rate limit por IP + por tenant.
- [ ] Avaliar captcha invisível (Turnstile) no formulário público. **Não implementado** — depende de
      conta e chaves do provedor, que são decisão do produto.

**Implementado**

- `createPrayerRequest` (`src/lib/tenants/data.ts`) valida o tenant via `getTenantConfig` e recusa
  qualquer slug que não exista ou não esteja publicado, com `TenantError` de código `not-found`.
- Mensagem limitada por `PRAYER_REQUEST_MIN_LENGTH` (3) e `PRAYER_REQUEST_MAX_LENGTH` (2.000),
  sinalizadas com a nova `ValidationError` e mapeadas para `400`.
- `src/lib/rate-limit.ts` implementa um contador de janela fixa em Firestore — necessário porque um
  limitador em memória não vale nada entre instâncias serverless. A rota aplica 5 pedidos por IP a
  cada 10 min e 60 por tenant por hora, respondendo `429` com header `retry-after`.
- O limitador **falha aberto**: se o Firestore estiver indisponível o pedido passa, porque a escrita
  que ele protege falharia contra o mesmo backend de qualquer forma.
- Os contadores gravam `expiresAt`, então uma política de TTL do Firestore na coleção `rateLimits`
  recolhe os documentos antigos. **Essa política precisa ser criada no console** — sem ela a coleção
  cresce indefinidamente.

## 2. Rota de contato sem verificação de posse

**Severidade: Alta**

`POST /api/tenants/[tenant]/prayer-requests/[requestId]/contact` não tem autenticação nem qualquer
vínculo entre quem criou o pedido e quem adiciona o contato. `addPrayerRequestContact`
(`src/lib/tenants/data.ts:569`) apenas confere que o documento existe e sobrescreve
`contactName`/`contactWhatsapp`, sem limite de repetições.

Os IDs gerados pelo Firestore são aleatórios de 20 caracteres, o que torna a adivinhação
impraticável, mas essa é a única barreira existente — não há defesa em profundidade.

**Ações**
- [x] Emitir um token de curta duração no `POST` de criação do pedido e exigi-lo no `POST` de contato.
- [x] Rejeitar a chamada se `wantsContact` já for `true` (contato só pode ser preenchido uma vez).
- [x] Aplicar o mesmo rate limit do item 1.

**Implementado**

- A criação do pedido gera um `contactToken` de 32 bytes e devolve o valor bruto **apenas na resposta**.
  No documento fica só o SHA-256 (`contactTokenHash`) e um `contactTokenExpiresAt` de 30 minutos.
- `addPrayerRequestContact` compara o hash com `timingSafeEqual`, confere a expiração, recusa pedidos
  que já tenham `wantsContact === true` e apaga o hash no mesmo `update` — o token é de uso único.
- `prayer-request-form-flow.tsx` guarda o token em estado e o envia no segundo passo.
- Rate limit de 10 tentativas por IP a cada 10 min na rota de contato.
- `prayerRequestFromSnapshot` não mapeia os campos de token, então eles nunca chegam ao admin.

## 3. Upload de logo sem validação

**Severidade: Alta**

`POST /api/minisites/[tenant]/logo` (`src/app/api/minisites/[tenant]/logo/route.ts`) aceita qualquer
`File` do `FormData`. Não há limite de tamanho, não há verificação de magic bytes, e a extensão de
destino é derivada do `content-type` enviado pelo cliente, com fallback silencioso para `.jpg`
(`saveTenantLogo`, `src/lib/tenants/data.ts:507`).

A rota exige sessão e posse do tenant, então não é anônima — mas nada impede um usuário legítimo de
enviar um arquivo de centenas de MB ou um conteúdo que não seja imagem.

**Ações**
- [x] Limitar o tamanho do arquivo (2 MB) e rejeitar antes de ler o buffer inteiro.
- [x] Validar o tipo real por magic bytes, não pelo `content-type` declarado.
- [x] Aceitar apenas `image/png`, `image/jpeg` e `image/webp`, rejeitando o resto explicitamente
      em vez de cair no fallback `.jpg`.
- [x] Remover a logo anterior quando a extensão mudar.

**Implementado**

- `src/lib/images.ts` concentra `LOGO_MAX_BYTES` (2 MB) e `detectLogoImageType`, que identifica
  PNG, JPEG e WebP pelas assinaturas binárias. Um container RIFF que não seja WebP é rejeitado.
- A rota confere o `content-length` **antes** de chamar `formData()`, respondendo `413` — sem isso o
  corpo inteiro já teria sido carregado em memória antes de qualquer checagem.
- `saveTenantLogo` revalida o tamanho no buffer, deriva extensão e `content-type` do tipo detectado
  (nunca do que o cliente declarou) e apaga o arquivo anterior quando o caminho muda de formato.
- `ValidationError` é mapeada para `400` na rota.
- Coberto por `src/lib/images.test.ts`.

## 4. Sem limite de tenants por conta

**Severidade: Média**

`POST /api/minisites` (`src/app/api/minisites/route.ts`) exige sessão, mas um usuário autenticado
pode chamá-la repetidamente e reservar quantos slugs quiser. `createDraftTenant`
(`src/lib/tenants/data.ts:217`) só protege contra colisão de slug, não contra volume por dono.

**Ações**
- [ ] Definir um teto de tenants por `ownerUid` (ex.: 5) e validar dentro da transação.
- [ ] Considerar expiração de rascunhos nunca publicados, liberando o slug.

## 5. Regras do Firestore e do Storage fora do repositório

**Severidade: Média**

Não existem `firestore.rules`, `storage.rules` nem `firebase.json` versionados. Todo acesso a dados
hoje passa pelo Admin SDK no servidor (`src/lib/firebase/admin.ts`, protegido por `import "server-only"`),
e o SDK cliente é usado exclusivamente para autenticação (`src/lib/firebase/client.ts`) — então as
regras podem e devem ser `deny-all`. O problema é que esse estado não está no repositório: não há
como revisar, versionar ou reaplicar.

**Ações**
- [x] Commitar `firestore.rules` e `storage.rules` com negação total para acesso direto do cliente.
- [x] Commitar `firebase.json` e `.firebaserc` apontando para essas regras.
- [x] Documentar o comando de deploy das regras no README.
- [ ] Exportar os índices vivos para `firestore.indexes.json` e commitar.
- [ ] Conferir as regras de Storage no console antes do primeiro deploy.

**Implementado**

- `firestore.rules` reproduz o deny-all que já estava no projeto, então o deploy é um no-op sem
  risco. `storage.rules` aplica o mesmo deny-all.
- `firebase.json` aponta para os dois arquivos; `.firebaserc` fixa o projeto `aamem-7df99`.
- Scripts `firebase:rules`, `firebase:indexes` e `firebase:indexes:export` no `package.json`,
  chamando `npx firebase-tools` para não adicionar dependência global nem mexer no lockfile.
- Seção **Firebase Configuration** no README, incluindo os passos manuais que a CLI não cobre.

**Concluído em 2026-08-28**

- `firestore.indexes.json` exportado do estado vivo e estendido com o índice de collection group do
  item 14. Deployado com sucesso.
- Regras do Firestore e do Storage deployadas via CLI (`firebase:rules` e `firebase:rules:storage`),
  ambas deny-all, alinhando os arquivos versionados com o estado vivo.

**Correção de registro:** ao contrário do afirmado anteriormente, a política de TTL **tem**
representação em arquivo — o export trouxe `"ttl": true` no fieldOverride de `rateLimits/expiresAt`,
e o deploy de índices a gerencia. O único passo genuinamente manual foi o bootstrap inicial no
console; daqui em diante o arquivo é a fonte da verdade.

## 6. Sem security headers

**Severidade: Média**

`next.config.ts` está vazio, apenas com o comentário de placeholder. Não há CSP, HSTS,
`X-Content-Type-Options`, `Referrer-Policy` nem `X-Frame-Options`.

**Ações**
- [ ] Adicionar `headers()` com o conjunto básico de headers de segurança.
- [ ] Definir uma CSP compatível com o Firebase Auth popup e com a fonte do Google (Adamina).

## 7. Rota de logo é um proxy caro

**Severidade: Média**

`GET /api/minisites/[tenant]/logo` faz `bucket.file(...).download()` — baixa o arquivo inteiro do
GCS para a memória do servidor — a cada requisição, e devolve com `cache-control: public, max-age=300`
(`src/app/api/minisites/[tenant]/logo/route.ts:28`). Como essa URL é usada tanto na bio pública
quanto no formulário de oração, é caminho quente.

**Ações**
- [ ] Servir a logo por URL pública do bucket ou URL assinada de longa duração, em vez de proxy.
- [ ] Se o proxy for mantido, aumentar o `max-age` e usar `stale-while-revalidate`, com a
      invalidação já coberta pela tag `tenant:{slug}`.
- [ ] Usar `next/image` para otimização e dimensionamento.

## 8. Sem integração contínua

**Severidade: Média**

Não existe `.github/`. Há scripts de `lint`, `test`, `test:coverage` e `test:storybook`, mas nada os
executa automaticamente em pull request.

**Ações**
- [ ] Criar workflow de PR rodando `npm run lint`, `npm run test` e `npm run build`.
- [ ] Avaliar incluir `npm run test:storybook` (requer Playwright/Chromium no runner).

## 9. Cobertura de teste desequilibrada

**Severidade: Média**

São 11 arquivos de teste (9 originais mais `images` e `request`, adicionados junto com os itens 1–3),
concentrados em renderização de template e em helpers pequenos e puros. O núcleo do sistema —
`src/lib/tenants/data.ts`, que contém toda a lógica de posse, publicação, escrita e agora também a
verificação de token de contato — continua sem nenhum teste. Das rotas de API, apenas
`/api/revalidate` é testada.

Isso pesa mais depois dos itens 1–3: as regras novas de posse e de rate limit são exatamente o tipo
de lógica que quebra em silêncio.

**Ações**
- [ ] Testar `getOwnerTenant` nos três caminhos: dono, não-dono, superadmin.
- [ ] Testar `createDraftTenant` (colisão de slug, slug reservado, valores padrão).
- [ ] Testar `publishTenantPages` e `updateTenantConfig`.
- [ ] Testar `createPrayerRequest` (tenant inexistente, tenant em rascunho, limites de tamanho).
- [ ] Testar `addPrayerRequestContact` (token errado, token expirado, token já usado).
- [ ] Testar `enforceRateLimits`, incluindo o comportamento de falha aberta.
- [ ] Testar as rotas de API com foco em auth e mapeamento de erro para status HTTP.
- [ ] Avaliar o emulador do Firestore para os testes de repositório.

## 10. `create-your-own-flow.tsx` com 1017 linhas

**Severidade: Baixa**

O arquivo exporta três templates independentes — `HomeCreateTemplate` (linha 521),
`CreateInstitutionTemplate` (linha 760) e `InstitutionBioTemplate` (linha 963) — mais seis tipos
compartilhados. É o maior ponto de atrito de manutenção da camada de UI e o principal candidato a
conflito de merge.

**Ações**
- [ ] Separar em um arquivo por template, mantendo os tipos compartilhados em um módulo próprio.
- [ ] Manter as stories apontando para os novos caminhos.

## 11. Impossível apagar a descrição do minisite

**Severidade: Baixa — bug de produto**

`updateTenantConfig` (`src/lib/tenants/data.ts:419`) usa checagem de truthiness
(`if (cleanDescription)`), então uma string vazia é silenciosamente ignorada. O usuário consegue
substituir a descrição, mas nunca limpá-la. O mesmo vale para `institutionName` e `themeId`.

**Ações**
- [ ] Distinguir "campo ausente no payload" de "campo enviado vazio" (`undefined` vs `""`).
- [ ] Definir a regra de produto: `institutionName` provavelmente deve continuar obrigatório,
      `description` deve poder ser limpa.

## 12. Adotar Cache Components em vez de `unstable_cache`

**Severidade: Baixa — dívida técnica opcional**

`src/lib/tenants/data.ts` usa `unstable_cache` em `getTenantConfig` e `getTenantPage`.

Os guias do próprio pacote corrigem a leitura inicial: `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
documenta `unstable_cache` como o caminho **suportado** para projetos que não ativaram a flag
`cacheComponents`, introduzida no Next 16. Como `next.config.ts` não ativa essa flag, o uso atual
está correto — é o modelo anterior, não uma API depreciada.

Portanto isto é uma migração opcional, não uma correção. Só vale a pena junto com a decisão de
adotar Cache Components no projeto como um todo.

**Ações**
- [ ] Decidir se o projeto adota `cacheComponents`.
- [ ] Se sim, migrar `getTenantConfig` e `getTenantPage` para `"use cache"` + `cacheTag`/`cacheLife`,
      preservando as tags atuais para não quebrar a invalidação de `revalidateTag`.

---

## 13. O bucket vive fora do Firebase Storage, então `storage.rules` não se aplica

**Severidade: Média** — verificado em 2026-08-27 com credenciais reais.

O bucket de logos é `aamem-7df99-minisite-logos`, um bucket **GCS comum**, criado direto no Google
Cloud e não pelo produto Firebase Storage. Por isso o console do Firebase mostra a tela de
onboarding: o produto nunca foi inicializado, embora o bucket exista e esteja em uso.

Ele contém 7 arquivos e a funcionalidade de logo funciona normalmente em produção
(`GET https://www.aamem.com/api/minisites/rhema-cachamorra/logo` responde 200 `image/jpeg`).

A consequência é de governança, não de disponibilidade: **regras de segurança do Firebase Storage
não governam buckets não registrados no Firebase**. O controle de acesso desse bucket é puramente
IAM do GCS. Ou seja, o `storage.rules` versionado neste repositório é hoje **inerte**, e o script
`npm run firebase:rules:storage` falharia por não haver bucket padrão do Firebase.

Não foi possível confirmar se o bucket está aberto publicamente: a service account
`firebase-adminsdk-fbsvc@` não tem `storage.buckets.getIamPolicy`, então o teste voltou 403. Como o
app serve as imagens por proxy (`GET /api/minisites/[tenant]/logo`), acesso público direto não é
necessário — mas isso precisa ser verificado por alguém com permissão de IAM.

### Arquivos órfãos

Dois objetos não têm tenant correspondente no Firestore:

- `tenants/igreja-da-graca/logo.png`
- `tenants/oooa/logo.jpg` (3 MB)

São restos de tenants excluídos. `deleteOwnerTenants` só apaga logos cujo `logoPath` está registrado
no documento do tenant, então qualquer exclusão por outro caminho deixa o arquivo para trás.

### Resolução em andamento (2026-08-27)

A decisão foi a opção (a), em variante melhor: o Firebase Storage foi provisionado em **modo de
produção** (regras `if false` conferidas no console), criando `aamem-7df99.firebasestorage.app` em
`us-east1`, e os 5 logos referenciados por `logoPath` no Firestore foram **copiados** para ele com
metadados preservados. Os 2 órfãos (`igreja-da-graca`, `oooa`) ficaram para trás de propósito.

Nota de região: o bucket novo está em `us-east1` e o antigo em `southamerica-east1`. Como as
funções da Vercel rodam em `iad1` e toda leitura passa pelo proxy, `us-east1` fica ao lado das
funções — favorável no estado atual. Se as funções migrarem para `gru1`, reavaliar.

**Ações restantes**

- [x] Trocar `FIREBASE_STORAGE_BUCKET` e `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` na **Vercel** para
      `aamem-7df99.firebasestorage.app` e fazer redeploy (feito em 2026-08-28).
- [x] Verificar as logos em produção após o redeploy — `rhema-cachamorra`, `davi` e `noova`
      responderam 200 com cache-buster em 2026-08-28.
- [x] Rodar `npm run firebase:rules:storage` — regras deny-all deployadas em 2026-08-28.
- [ ] Por volta de 2026-09-04, após uma semana estável, excluir o bucket
      `aamem-7df99-minisite-logos` no console do GCS (leva junto os 2 órfãos).

## 14. Índice de collection group ausente

**Severidade: Média** — verificado em 2026-08-27 com credenciais reais.

`getAllPublishedPagesForBuild()` roda:

```ts
.collectionGroup("pages").where("status", "==", "published")
```

e o Firestore responde:

```
9 FAILED_PRECONDITION: The query requires a COLLECTION_GROUP_ASC index
for collection pages and field status.
```

Os índices automáticos do Firestore são de escopo de **coleção**; queries de collection group exigem
índice de escopo de **grupo**, que não é criado sozinho.

Como `generateStaticParams` envolve a chamada em `try/catch` e retorna `[]` no erro, o build nunca
falha — ele apenas **não pré-renderiza nenhuma página de tenant**. Todas as 8 páginas publicadas são
renderizadas sob demanda. O SSG está desligado desde sempre, sem nenhum sinal no log de build.

**Ações**

- [ ] Criar o índice `pages`/`status` com escopo de grupo de coleções. O erro do Firestore traz um
      link direto que já vem pré-preenchido.
- [ ] Registrar o índice em `firestore.indexes.json` (item 5) para não depender do console.
- [ ] Considerar logar o erro no `catch` do `generateStaticParams` em vez de engoli-lo — foi
      justamente o silêncio que escondeu isso.

---

## 15. O limite de 2 MB da logo rejeita imagens já em uso

**Severidade: Média — decisão de produto**

O item 3 introduziu `LOGO_MAX_BYTES = 2 MB`. Os arquivos que já estão no bucket mostram que o limite
é apertado demais para o uso real:

| arquivo | tamanho |
|---|---|
| `tenants/davi/logo.jpg` | **3,8 MB** |
| `tenants/oooa/logo.jpg` | **3,0 MB** |
| os outros 5 | 4–64 KB |

Isso valida o risco original — havia mesmo upload de multi-megabytes sem limite nenhum — mas também
significa que a igreja `davi` **não consegue reenviar a logo que já usa hoje**. O arquivo existente
continua sendo servido normalmente; só um novo upload seria barrado.

A distribuição é bimodal: ou alguns KB, ou alguns MB. Provavelmente a diferença entre quem redimensionou
a imagem e quem mandou a foto original do celular.

**Decisão (2026-08-28):** manter o limite de 2 MB sem mudanças no cliente. Os arquivos grandes
existentes (`davi`, e o órfão `oooa`) serão excluídos futuramente pelo operador. O arquivo atual da
`davi` continua sendo servido normalmente; apenas um novo upload acima de 2 MB é barrado, o que é o
comportamento desejado daqui em diante.

---

## Observações fora do escopo de risco

Pontos notados na análise que não são problemas, mas orientam decisões futuras:

- O campo `blocks[]` das páginas é um esboço de page-builder que hoje não é interpretado: o renderer
  em `src/app/[tenant]/[[...slug]]/page.tsx` decide por comparação de `path`. Se o page-builder
  entrar no roadmap, essa é a costura a puxar.
- O superadmin é definido por comparação de string com `SUPERADMIN_EMAIL`
  (`src/lib/admin/context.ts:22`). Funciona para um operador único; migrar para custom claims do
  Firebase Auth quando houver mais de um.
- Não há `middleware.ts`: cada page e route chama `getCurrentUser()` individualmente. É consistente
  hoje, mas é uma checagem fácil de esquecer ao adicionar rotas novas.
