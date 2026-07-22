# Gestão do Futebol

Site de gestão financeira e de presença para os dias de jogo do grupo (ex.: Terça-feira
e Quarta-feira). Leitura pública em tempo real, edição restrita a administradores.

## Stack e por quê

| Camada       | Escolha                                   | Motivo |
|--------------|--------------------------------------------|--------|
| Framework    | Next.js 14 (App Router) + TypeScript       | Server Components para o primeiro carregamento (rápido, indexável), Client Components só onde há interatividade. |
| Estilo       | Tailwind CSS + tokens via CSS variables    | Dark/light mode instantâneo, sem duplicar classes; zero CSS-in-JS em runtime. |
| Banco + Auth | Supabase (Postgres + Auth + Realtime)      | Row Level Security nativa (a própria regra de "público lê, admin escreve" vira SQL, não lógica de app), Realtime para atualização ao vivo, escala horizontalmente sem servidor próprio para manter. |
| Automação    | Triggers/funções em Postgres               | A regra "marcar Pago gera uma Entrada" roda **dentro do banco**, atomicamente, então nunca fica inconsistente — não importa por onde a alteração chegue. |

Tudo o que muda o dado (marcar status, adicionar jogador, editar mensalidade) é uma
chamada direta do navegador para o Supabase, protegida por Row Level Security — não há
um servidor de aplicação no meio para virar gargalo. A única rota de servidor
(`/api/invite`) existe porque convidar um admin exige a *service role key*, que nunca
pode chegar ao navegador.

## Arquitetura de dados

```
game_days (Terça, Quarta, ...)
   └─ players (nome, status)         -> trigger ao mudar status
         └─ transactions (entrada/saída, valor, descrição, quem fez)
   └─ admin_invites (convites por e-mail)

profiles (1 admin = 1 linha; não há hierarquia de papéis)
```

Todo o histórico financeiro é **append-only**: nada é apagado ou reescrito. Corrigir um
status gerado por engano cria um lançamento de estorno, não some com o anterior — é o
que garante a auditoria pública exigida pelo projeto.

O isolamento entre os dois dias vem de uma coluna: **tudo tem `day_id`** (jogadores,
transações) e toda consulta — inclusive a função `get_transactions_with_admin` — filtra
por ela. Não existe caminho de código em que o caixa de Terça apareça somando com o de
Quarta.

### O gatilho de automação (o pedido central do projeto)

Em `supabase/schema.sql`, a função `handle_player_status_change()`:

1. Dispara em `before update on players`.
2. Se o novo status é `'pago'` e o antigo não era, insere uma `transaction` do tipo
   `entrada` no valor da mensalidade do dia, com a descrição `Mensalidade paga de
   [Nome]`.
3. Se o status **sai** de `'pago'` (o admin corrigiu um marcador errado), insere uma
   `saída` de estorno — o registro anterior continua visível no histórico.
4. `auth.uid()` dentro do trigger já é o administrador autenticado que fez a chamada,
   então `created_by` nunca precisa ser passado manualmente pelo front-end — impossível
   forjar esse campo pelo cliente.

A tela (`AuditLog`) compõe o formato pedido — `[Valor] | [Descrição] | Adicionado por:
[Admin]` — a partir desses três campos já normalizados, em vez de depender de uma string
solta gravada no banco.

## Rodando o projeto

### 1. Crie o projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) → **New Project**.
2. Em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode uma vez. Isso cria
   tabelas, triggers, políticas de RLS, habilita Realtime e semeia os dois dias
   (Terça/Quarta — ajuste nomes e valores na própria tabela `game_days` se quiser).
3. Em **Authentication → URL Configuration**, defina:
   - Site URL: `http://localhost:3000` (troque pela URL de produção depois)
   - Redirect URLs: adicione `http://localhost:3000/auth/callback` (e a versão de produção)
4. Em **Authentication → Providers**, mantenha **Email** habilitado. Convites usam o
   fluxo padrão de e-mail do Supabase.

### 2. Configure as variáveis de ambiente
```bash
cp .env.local.example .env.local
```
Preencha com os valores de **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (fica só no servidor — nunca commitar, nunca expor com `NEXT_PUBLIC_`)

### 3. Instale e rode
```bash
npm install
npm run dev
```
Abra `http://localhost:3000`. Sem login, você já vê os dois dias, jogadores e o
financeiro — a transparência é o comportamento padrão.

### 4. Crie o primeiro administrador
Como convidar exige *já ser* administrador, o primeiro é criado manualmente:
1. No painel do Supabase, vá em **Authentication → Users → Add user**.
2. Marque "Auto Confirm User", defina e-mail e senha.
3. O trigger `handle_new_user()` cria o perfil de administrador automaticamente.
4. Faça login em `/login` com esse e-mail/senha. A partir daí, use **Convidar
   administrador** (em `/admin/convites`) para adicionar o restante do grupo — cada
   pessoa convidada recebe um e-mail, define sua própria senha em `/definir-senha` e já
   entra com permissão total de edição.

### 5. Deploy
Funciona bem em qualquer host Next.js (ex.: Vercel):
```bash
vercel deploy
```
Configure as mesmas três variáveis de ambiente no projeto do host, e atualize
`NEXT_PUBLIC_SITE_URL` e as Redirect URLs do Supabase para a URL final.

## Estrutura de pastas

```
app/                    Rotas (App Router)
  page.tsx              Home — seleção dos dois dias
  dia/[slug]/page.tsx   Painel de um dia (SSR + realtime)
  login/, definir-senha/  Autenticação
  admin/convites/       Gestão de administradores (protegida)
  api/invite/           Único endpoint de servidor (envia convite com service role key)
  auth/callback/        Troca o link de convite por sessão

components/
  day/                  Mensalidade, tabela de jogadores, seletor de status, financeiro
  audit/                Log público de auditoria
  admin/, auth/         Convite de admin, login, definição de senha
  layout/, theme/, ui/  Header, footer, dark mode, primitivos (Button, Modal)

hooks/
  use-realtime-day.ts   Assina Supabase Realtime (players + transactions) por dia
  use-current-admin.ts  Sessão do administrador logado

lib/
  supabase/             Clientes (browser, server, middleware)
  queries/               Leituras tipadas do banco
  types.ts, constants.ts, utils.ts

supabase/schema.sql     Schema completo: tabelas, triggers, RLS, seed
```

## Extensões sugeridas (fora do escopo inicial)
- Exportar o histórico de um dia em CSV/PDF.
- Notificação (e-mail/WhatsApp) quando alguém é marcado como "Aviso de Possível Corte".
- Gráfico de evolução do saldo mês a mês por dia.

## Deploy — `.env.production` e reset do banco

1) Arquivo de ambiente de produção

Crie um arquivo local chamado `.env.production` (NÃO commite) com estas variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # SÓ no servidor (secret)
```

Defina `SUPABASE_SERVICE_ROLE_KEY` como secret na sua plataforma de deploy (Vercel/Netlify/etc.) — nunca exponha essa chave no cliente.

2) Reset parcial (apagar transações)

Se você quiser limpar apenas o histórico financeiro e manter jogadores/profiles, use o arquivo `supabase/reset_transactions.sql` no SQL Editor do Supabase. Ele faz:

- `DELETE FROM public.transactions;`
- `UPDATE public.players` para limpar `last_transaction_id` e marcar `status = 'nao_pago'`
- limpa `admin_invites`

3) Reset completo dos dados gerenciados pela aplicação

Se preferir um estado totalmente limpo (jogadores, transações, convites, perfis e dias), rode `supabase/reset_all.sql` no SQL Editor. Atenção: isto remove perfis e convites — você precisará recriar o primeiro administrador via **Authentication → Users → Add user** no painel do Supabase.

4) Como executar os scripts

- Pelo painel Supabase: **SQL Editor** → cole o conteúdo de um dos arquivos acima e execute.
- Ou, se preferir CLI (instale `supabase`):

```bash
# exemplo: sobe o arquivo para o editor e executa a query
supabase db query "$(cat supabase/reset_transactions.sql)"
```

5) Recriar administrador inicial

Após um reset completo, crie o primeiro usuário manualmente em **Authentication → Users → Add user** (marque auto confirm). O trigger `handle_new_user()` criará automaticamente a linha em `profiles`.

6) Deploy rápido (Vercel)

- No Vercel, adicione as variáveis de ambiente (veja acima).
- `Build Command`: `npm run build` (padrão)
- Deploy.

Depois do deploy, atualize as **Redirect URLs** em Supabase para incluir `https://your-production-domain.com/auth/callback`.
