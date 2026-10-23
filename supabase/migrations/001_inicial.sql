-- tabelas
-- ======================================================
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text check (char_length(display_name) <= 60),
    created_at timestamptz not null default now()
);

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name text not null check (char_length(name) between 1 and 40),
    type text not null check (type in ('income', 'expense')),
    color text not null default '#8b8b93' check (color ~ '^#[0-9a-fA-F]{6}$'),
    monthly_limit numeric(12, 2) check (monthly_limit > 0),
    created_at timestamptz not null default now(),
    unique (user_id, name, type)
);

create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    type text not null check (type in ('income', 'expense')),
    amount numeric(12, 2) not null check (amount > 0),
    category_id uuid references public.categories (id) on delete set null,
    description text check (char_length(description) <= 140),
    transaction_date date not null default current_date,
    created_at timestamptz not null default now()
);

create table public.events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    title text not null check (char_length(title) between 1 and 80),
    description text check (char_length(description) <= 500),
    start_at timestamptz not null,
    end_at timestamptz,
    reminder_at timestamptz,
    created_at timestamptz not null default now(),
    check (end_at is null or end_at >= start_at)
);

create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    title text not null check (char_length(title) between 1 and 80),
    description text check (char_length(description) <= 500),
    due_at timestamptz,
    priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),
    completed boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.widget_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    widget_type text not null check (widget_type in ('saldo', 'financas', 'agenda', 'tarefas', 'relogio', 'lembretes')),
    position integer not null default 0,
    size text not null default 'm' check (size in ('s', 'm', 'l')),
    settings jsonb not null default '{}'::jsonb,
    visible boolean not null default true,
    unique (user_id, widget_type)
);


-- índices
-- ======================================================
create index categories_user_idx on public.categories (user_id);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_category_idx on public.transactions (category_id);
create index events_user_start_idx on public.events (user_id, start_at);
create index tasks_user_idx on public.tasks (user_id, completed, due_at);
create index widget_preferences_user_idx on public.widget_preferences (user_id);


-- segurança (RLS): cada utilizador só vê e altera o que é seu
-- ======================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.widget_preferences enable row level security;

create policy "perfil: ver o próprio" on public.profiles
    for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: alterar o próprio" on public.profiles
    for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "categorias: ver" on public.categories
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "categorias: criar" on public.categories
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categorias: alterar" on public.categories
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categorias: apagar" on public.categories
    for delete to authenticated using ((select auth.uid()) = user_id);

create policy "movimentos: ver" on public.transactions
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "movimentos: criar" on public.transactions
    for insert to authenticated with check (
        (select auth.uid()) = user_id
        and (category_id is null or exists (
            select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())
        ))
    );
create policy "movimentos: alterar" on public.transactions
    for update to authenticated using ((select auth.uid()) = user_id) with check (
        (select auth.uid()) = user_id
        and (category_id is null or exists (
            select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())
        ))
    );
create policy "movimentos: apagar" on public.transactions
    for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eventos: ver" on public.events
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "eventos: criar" on public.events
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eventos: alterar" on public.events
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eventos: apagar" on public.events
    for delete to authenticated using ((select auth.uid()) = user_id);

create policy "tarefas: ver" on public.tasks
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "tarefas: criar" on public.tasks
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tarefas: alterar" on public.tasks
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tarefas: apagar" on public.tasks
    for delete to authenticated using ((select auth.uid()) = user_id);

create policy "widgets: ver" on public.widget_preferences
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "widgets: criar" on public.widget_preferences
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "widgets: alterar" on public.widget_preferences
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "widgets: apagar" on public.widget_preferences
    for delete to authenticated using ((select auth.uid()) = user_id);


-- conta nova: perfil e categorias padrão
-- ======================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), 60));

    insert into public.categories (user_id, name, type, color) values
        (new.id, 'Salário', 'income', '#3df2a0'),
        (new.id, 'Outros rendimentos', 'income', '#6ee7b7'),
        (new.id, 'Alimentação', 'expense', '#ffb547'),
        (new.id, 'Casa', 'expense', '#60a5fa'),
        (new.id, 'Transporte', 'expense', '#a78bfa'),
        (new.id, 'Lazer', 'expense', '#f472b6'),
        (new.id, 'Saúde', 'expense', '#ff5c6c'),
        (new.id, 'Outros', 'expense', '#8b8b93');

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();


-- resumo financeiro (o saldo é calculado na base de dados, não no JS)
-- ======================================================
create function public.resumo_financeiro(inicio date default null, fim date default null)
returns table (rendimentos numeric, despesas numeric, saldo numeric)
language sql
stable
security invoker
set search_path = ''
as $$
    select
        coalesce(sum(amount) filter (where type = 'income'), 0),
        coalesce(sum(amount) filter (where type = 'expense'), 0),
        coalesce(sum(case when type = 'income' then amount else -amount end), 0)
    from public.transactions
    where user_id = (select auth.uid())
      and (inicio is null or transaction_date >= inicio)
      and (fim is null or transaction_date <= fim);
$$;

create function public.despesas_por_categoria(inicio date, fim date)
returns table (category_id uuid, nome text, cor text, total numeric, limite numeric)
language sql
stable
security invoker
set search_path = ''
as $$
    select c.id, coalesce(c.name, 'Sem categoria'), coalesce(c.color, '#8b8b93'), sum(t.amount), c.monthly_limit
    from public.transactions t
    left join public.categories c on c.id = t.category_id
    where t.user_id = (select auth.uid())
      and t.type = 'expense'
      and t.transaction_date between inicio and fim
    group by c.id, c.name, c.color, c.monthly_limit
    order by sum(t.amount) desc;
$$;


-- tempo real
-- ======================================================
alter publication supabase_realtime add table public.transactions, public.events, public.tasks;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
