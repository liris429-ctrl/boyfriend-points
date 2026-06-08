-- 每日任務
create table public.daily_tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  emoji text not null default '📋',
  points integer not null default 10 check (points > 0),
  task_date date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.daily_tasks enable row level security;
create policy "Authenticated can view daily tasks" on public.daily_tasks
  for select using (auth.uid() is not null);
create policy "Admin can manage daily tasks" on public.daily_tasks
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 紀念日特別加倍
create table public.special_dates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text not null default '🎊',
  date date not null,
  repeat_yearly boolean not null default true,
  bonus_multiplier numeric not null default 2 check (bonus_multiplier >= 1),
  created_at timestamptz not null default now()
);
alter table public.special_dates enable row level security;
create policy "Authenticated can view special dates" on public.special_dates
  for select using (auth.uid() is not null);
create policy "Admin can manage special dates" on public.special_dates
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 心情留言板
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  mood_emoji text not null default '😊',
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "Authenticated can view messages" on public.messages
  for select using (auth.uid() is not null);
create policy "Users can send own messages" on public.messages
  for insert with check (auth.uid() = sender_id);
create policy "Users can delete own messages" on public.messages
  for delete using (auth.uid() = sender_id);

-- 跑馬燈自訂文字
create table public.marquee_messages (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.marquee_messages enable row level security;
create policy "Authenticated can view active marquee" on public.marquee_messages
  for select using (auth.uid() is not null);
create policy "Admin can manage marquee" on public.marquee_messages
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 限時獎勵：為 rewards 新增到期時間
alter table public.rewards add column expires_at timestamptz;

-- 兌換後確認：為 redemptions 新增兌現狀態
alter table public.redemptions add column fulfilled boolean not null default false;
alter table public.redemptions add column fulfilled_at timestamptz;

-- 讓管理員可以更新 redemptions（標記已兌現）
create policy "Admin can update redemptions" on public.redemptions
  for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 預設跑馬燈文字
insert into public.marquee_messages (content, sort_order) values
  ('💕 歡迎來到男友積分本！', 1),
  ('✨ 繼續努力，累積積分換獎勵！', 2),
  ('💌 今天有乖嗎？', 3);
