-- =====================================================================================
-- GESTÃO DO FUTEBOL — Schema completo (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase (uma vez só).
-- =====================================================================================

create extension if not exists "pgcrypto";

-- =====================================================================================
-- 1. TIPOS
-- =====================================================================================

create type public.player_status as enum ('pago', 'nao_pago', 'departamento_medico', 'aviso_corte');
create type public.transaction_type as enum ('entrada', 'saida');
create type public.transaction_category as enum ('mensalidade', 'visitante', 'estorno', 'outro');

-- =====================================================================================
-- 2. TABELAS
-- =====================================================================================

-- Perfis de administrador (estende auth.users). Todo usuário autenticado com uma linha
-- aqui é, por definição, administrador — não existe hierarquia adicional de papéis.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  full_name  text not null,
  created_at timestamptz not null default now()
);

-- Os dias de jogo do grupo (ex.: Terça-feira, Quarta-feira). O caixa de cada linha
-- é sempre isolado por day_id em todas as tabelas relacionadas.
create table public.game_days (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  monthly_fee  numeric(10,2) not null default 0 check (monthly_fee >= 0),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id)
);

-- Marca a última vez que os status mensais foram reiniciados para este dia
alter table public.game_days
  add column if not exists last_payment_reset date not null default date_trunc('month', now())::date;

-- Jogadores vinculados a um dia específico.
create table public.players (
  id                    uuid primary key default gen_random_uuid(),
  day_id                uuid not null references public.game_days(id) on delete cascade,
  name                  text not null,
  status                public.player_status not null default 'nao_pago',
  last_transaction_id   uuid,
  created_at            timestamptz not null default now(),
  created_by            uuid references public.profiles(id) default auth.uid(),
  updated_at            timestamptz not null default now(),
  updated_by            uuid references public.profiles(id)
);

-- Tabela de flags do sistema, usada para operações atômicas que precisam
-- suspender temporariamente triggers (ex.: reset mensal de status)
create table if not exists public.system_flags (
  key text primary key,
  value text
);

-- Fluxo financeiro — tabela de auditoria, somente inserção (nunca é editada ou apagada
-- pela aplicação), garantindo o log público e permanente exigido pelo projeto.
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  day_id       uuid not null references public.game_days(id) on delete cascade,
  player_id    uuid references public.players(id) on delete set null,
  type         public.transaction_type not null,
  category     public.transaction_category not null default 'outro',
  visitor_name text,
  visitor_date date,
  amount       numeric(10,2) not null check (amount >= 0),
  description  text not null,
  period       date not null default date_trunc('month', now())::date,
  created_by   uuid not null references public.profiles(id) default auth.uid(),
  created_at   timestamptz not null default now()
);

alter table public.players
  add constraint players_last_transaction_fk
  foreign key (last_transaction_id) references public.transactions(id) on delete set null;

-- Convites de administrador enviados por e-mail.
create table public.admin_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  invited_by   uuid not null references public.profiles(id),
  status       text not null default 'pendente' check (status in ('pendente', 'aceito')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz
);

-- =====================================================================================
-- 3. ÍNDICES (consultas por dia são o caminho mais comum — mantém tudo rápido em escala)
-- =====================================================================================

create index idx_players_day_id on public.players(day_id);
create index idx_transactions_day_id on public.transactions(day_id);
create index idx_transactions_day_created on public.transactions(day_id, created_at desc);
create index idx_admin_invites_email on public.admin_invites(email);

-- =====================================================================================
-- 4. FUNÇÕES E TRIGGERS — automação financeira
-- =====================================================================================

-- 4.1 Cria automaticamente o perfil de administrador quando um novo usuário confirma
--     o cadastro (seja o primeiro admin criado manualmente, seja alguém convidado).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  update public.admin_invites
  set status = 'aceito', accepted_at = now()
  where email = new.email and status = 'pendente';

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4.2 Mantém updated_at / updated_by em game_days sempre que o valor da mensalidade muda.
create or replace function public.set_updated_meta()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger trg_game_days_updated
before update on public.game_days
for each row execute function public.set_updated_meta();

-- 4.3 O CORAÇÃO DA AUTOMAÇÃO FINANCEIRA.
--     Quando o status de um jogador muda PARA 'pago', gera automaticamente uma
--     transação de ENTRADA no valor da mensalidade do dia.
--     Quando o status SAI de 'pago' (o admin corrigiu um marcador incorreto), gera
--     uma transação de SAÍDA de estorno — o histórico nunca é apagado, só compensado,
--     preservando a auditoria pública completa.
create or replace function public.handle_player_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fee   numeric(10,2);
  v_tx_id uuid;
  v_skip  text;
begin
  -- Se a flag estiver ativa, não gerar transações ao atualizar status
  select value into v_skip from public.system_flags where key = 'skip_player_trigger' limit 1;
  if v_skip = '1' then
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
  end if;
  if new.status is distinct from old.status then
    select monthly_fee into v_fee from public.game_days where id = new.day_id;

    if new.status = 'pago' and old.status is distinct from 'pago' then
      insert into public.transactions (day_id, player_id, type, category, amount, description, period, created_by)
      values (new.day_id, new.id, 'entrada', 'mensalidade', v_fee, format('Mensalidade paga de %s', new.name), date_trunc('month', now())::date, auth.uid())
      returning id into v_tx_id;

      new.last_transaction_id := v_tx_id;

    elsif old.status = 'pago' and new.status is distinct from 'pago' then
      insert into public.transactions (day_id, player_id, type, category, amount, description, period, created_by)
      values (new.day_id, new.id, 'saida', 'estorno', v_fee, format('Estorno de mensalidade de %s (status alterado)', new.name), date_trunc('month', now())::date, auth.uid());

      new.last_transaction_id := null;
    end if;
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger trg_player_status_change
before update on public.players
for each row execute function public.handle_player_status_change();

-- 4.3.1 Função para reset mensal: faz update atômico dos status dos jogadores
-- sem disparar o comportamento padrão do trigger (gera entradas/estornos).
create or replace function public.reset_monthly_for_day(p_day_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- ativa a flag para suprimir ações do trigger
  insert into public.system_flags(key, value) values ('skip_player_trigger', '1') on conflict (key) do update set value = '1';

  -- atualiza os jogadores do dia para 'nao_pago'
  update public.players set status = 'nao_pago', last_transaction_id = null, updated_at = now(), updated_by = auth.uid() where day_id = p_day_id;

  -- registra a data do reset no dia
  update public.game_days set last_payment_reset = date_trunc('month', now())::date where id = p_day_id;

  -- desativa a flag
  insert into public.system_flags(key, value) values ('skip_player_trigger', '0') on conflict (key) do update set value = '0';
end;
$$;

-- 4.4 Consulta pública do fluxo financeiro já com o nome do administrador responsável
--     (join feito no servidor, sem precisar expor a tabela profiles publicamente).
create or replace function public.get_transactions_with_admin(p_day_id uuid)
returns table (
  id uuid, day_id uuid, player_id uuid, type public.transaction_type,
  category public.transaction_category, visitor_name text, visitor_date date, amount numeric,
  description text, period date, created_at timestamptz, admin_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.day_id, t.player_id, t.type, t.category, t.visitor_name, t.visitor_date, t.amount, t.description, t.period, t.created_at, p.full_name
  from public.transactions t
  join public.profiles p on p.id = t.created_by
  where t.day_id = p_day_id
  order by t.created_at desc;
$$;

grant execute on function public.get_transactions_with_admin(uuid) to anon, authenticated;

-- =====================================================================================
-- 5. ROW LEVEL SECURITY — transparência total na leitura, escrita restrita a admins
-- =====================================================================================

alter table public.profiles       enable row level security;
alter table public.game_days      enable row level security;
alter table public.players        enable row level security;
alter table public.transactions   enable row level security;
alter table public.admin_invites  enable row level security;

-- --- Leitura pública (qualquer visitante, sem login) ---------------------------------
create policy "Público lê dias de jogo"     on public.game_days   for select using (true);
create policy "Público lê jogadores"        on public.players     for select using (true);
create policy "Público lê transações"       on public.transactions for select using (true);

-- profiles NÃO é público (evita expor e-mails); nomes de admin chegam via
-- get_transactions_with_admin() e via listagem autenticada em /admin/convites.
create policy "Autenticados leem perfis" on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Admin atualiza o próprio perfil" on public.profiles for update
  using (id = auth.uid());

-- --- Escrita restrita a administradores autenticados ----------------------------------
create policy "Admins alteram valor da mensalidade" on public.game_days for update
  using (exists (select 1 from public.profiles where id = auth.uid()))
  with check (exists (select 1 from public.profiles where id = auth.uid()));

create policy "Admins adicionam jogadores" on public.players for insert
  with check (exists (select 1 from public.profiles where id = auth.uid()));

create policy "Admins alteram jogadores" on public.players for update
  using (exists (select 1 from public.profiles where id = auth.uid()));

create policy "Admins removem jogadores" on public.players for delete
  using (exists (select 1 from public.profiles where id = auth.uid()));

-- Transações só são criadas pelo trigger (security definer); nenhum insert client-side
-- é necessário, então não há policy de insert para clientes comuns aqui.

create policy "Admins convidam novos admins" on public.admin_invites for insert
  with check (exists (select 1 from public.profiles where id = auth.uid()));

create policy "Admins veem convites" on public.admin_invites for select
  using (exists (select 1 from public.profiles where id = auth.uid()));

-- =====================================================================================
-- 6. REALTIME — habilita atualização ao vivo para todos os visitantes
-- =====================================================================================

alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.transactions;

-- =====================================================================================
-- 7. SEED — os dois dias de jogo do grupo (ajuste nomes/valores como quiser)
-- =====================================================================================

insert into public.game_days (slug, name, monthly_fee) values
  ('terca',  'Terça-feira',  50.00),
  ('quarta', 'Quarta-feira', 50.00)
on conflict (slug) do nothing;
