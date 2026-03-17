
-- 1. App role enum
create type public.app_role as enum ('admin', 'user');

-- 2. User roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- 3. has_role function
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- 4. RLS for user_roles
create policy "Users can view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins can manage all roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 5. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 6. Memberships table
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  is_active boolean default false,
  granted_by uuid references auth.users(id),
  granted_at timestamptz,
  expires_at timestamptz,
  plan_name text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create policy "Users can view own membership" on public.memberships for select to authenticated using (auth.uid() = user_id);
create policy "Admins can manage all memberships" on public.memberships for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 7. has_active_membership function
create or replace function public.has_active_membership(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = _user_id
      and is_active = true
      and (expires_at is null or expires_at > now())
  )
$$;

-- 8. Boards table
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create policy "Users can manage own boards" on public.boards for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9. Board lists table
create table public.board_lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  position integer default 0,
  created_at timestamptz default now()
);

create policy "Users can manage lists on own boards" on public.board_lists for all to authenticated
  using (exists (select 1 from public.boards where id = board_id and user_id = auth.uid()))
  with check (exists (select 1 from public.boards where id = board_id and user_id = auth.uid()));

-- 10. Board cards table
create table public.board_cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.board_lists(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  labels jsonb default '[]'::jsonb,
  assignee text,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create policy "Users can manage cards on own boards" on public.board_cards for all to authenticated
  using (exists (select 1 from public.board_lists bl join public.boards b on b.id = bl.board_id where bl.id = list_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.board_lists bl join public.boards b on b.id = bl.board_id where bl.id = list_id and b.user_id = auth.uid()));

-- 11. Admin can view all invoices (for payment proof review)
create policy "Admins can view all invoices" on public.invoices for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update all invoices" on public.invoices for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
