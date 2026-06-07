-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (linked to Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- Point actions (things boyfriend can do to earn points)
create table public.point_actions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  emoji text not null default '⭐',
  points integer not null check (points > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Rewards (things boyfriend can redeem)
create table public.rewards (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  emoji text not null default '🎁',
  points_required integer not null check (points_required > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Point transactions
create table public.point_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action_id uuid references public.point_actions(id) on delete set null,
  points integer not null,
  note text,
  awarded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Redemptions
create table public.redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  reward_title text not null,
  reward_emoji text not null default '🎁',
  points_spent integer not null,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Computed view: current balance per user
create or replace view public.user_balances as
select
  p.id as user_id,
  p.display_name,
  coalesce(sum(pt.points), 0) - coalesce(
    (select sum(r.points_spent) from public.redemptions r where r.user_id = p.id), 0
  ) as balance
from public.profiles p
left join public.point_transactions pt on pt.user_id = p.id
group by p.id, p.display_name;

-- ========== Row Level Security ==========

alter table public.profiles enable row level security;
alter table public.point_actions enable row level security;
alter table public.rewards enable row level security;
alter table public.point_transactions enable row level security;
alter table public.redemptions enable row level security;

-- Profiles: users see own profile, admin sees all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Admin can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admin can update profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Point actions: everyone can read active ones, admin can manage
create policy "Anyone can view active actions" on public.point_actions
  for select using (active = true);
create policy "Admin can manage actions" on public.point_actions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Rewards: everyone can read active ones, admin can manage
create policy "Anyone can view active rewards" on public.rewards
  for select using (active = true);
create policy "Admin can manage rewards" on public.rewards
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Point transactions: users see own, admin sees all
create policy "Users can view own transactions" on public.point_transactions
  for select using (auth.uid() = user_id);
create policy "Admin can view all transactions" on public.point_transactions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admin can insert transactions" on public.point_transactions
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Redemptions: users can create own, see own; admin sees all
create policy "Users can create own redemptions" on public.redemptions
  for insert with check (auth.uid() = user_id);
create policy "Users can view own redemptions" on public.redemptions
  for select using (auth.uid() = user_id);
create policy "Admin can view all redemptions" on public.redemptions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ========== Seed Data ==========

insert into public.point_actions (title, emoji, points) values
  ('幫忙做家事', '🧹', 10),
  ('煮飯給我吃', '🍳', 15),
  ('主動關心我', '💬', 5),
  ('陪我看電影', '🎬', 10),
  ('買禮物給我', '🎁', 20),
  ('按時回訊息', '📱', 5),
  ('幫我按摩', '💆', 15),
  ('帶我出去約會', '🌹', 25);

insert into public.rewards (title, emoji, points_required) values
  ('一頓大餐', '🍜', 50),
  ('牽手散步', '🚶', 30),
  ('電影院約會', '🎬', 60),
  ('一個大擁抱', '🤗', 20),
  ('幫我按摩30分鐘', '💆', 40),
  ('週末出遊', '🏖️', 100),
  ('親親', '💋', 25);
