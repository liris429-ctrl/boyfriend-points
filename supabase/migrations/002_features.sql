-- 許願獎勵 (boyfriend suggests a reward he'd like)
create table public.reward_wishes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  emoji text not null default '✨',
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reply text,
  created_at timestamptz not null default now()
);

alter table public.reward_wishes enable row level security;

create policy "Users can view own wishes" on public.reward_wishes
  for select using (auth.uid() = user_id);
create policy "Users can insert own wishes" on public.reward_wishes
  for insert with check (auth.uid() = user_id);
create policy "Admin can view all wishes" on public.reward_wishes
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admin can update wishes" on public.reward_wishes
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 申請給點 (boyfriend requests credit for something he did)
create table public.point_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  points_suggested integer check (points_suggested > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reply text,
  awarded_points integer,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.point_requests enable row level security;

create policy "Users can view own requests" on public.point_requests
  for select using (auth.uid() = user_id);
create policy "Users can insert own requests" on public.point_requests
  for insert with check (auth.uid() = user_id);
create policy "Admin can view all requests" on public.point_requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admin can update requests" on public.point_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
