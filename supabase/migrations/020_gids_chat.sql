-- B2B-chat tussen premium zaken (zoekertjes + dienstenprofielen)

create table if not exists public.gids_chat_threads (
  id uuid primary key default gen_random_uuid(),
  context_type text not null check (context_type in ('zoekertje', 'diensten_listing')),
  context_id uuid not null,
  seller_listing_id uuid not null references public.gids_listings (id) on delete cascade,
  buyer_listing_id uuid not null references public.gids_listings (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint gids_chat_threads_distinct_participants check (seller_listing_id <> buyer_listing_id),
  unique (context_type, context_id, buyer_listing_id)
);

create index if not exists gids_chat_threads_buyer_idx on public.gids_chat_threads (buyer_listing_id, last_message_at desc);
create index if not exists gids_chat_threads_seller_idx on public.gids_chat_threads (seller_listing_id, last_message_at desc);
create index if not exists gids_chat_threads_context_idx on public.gids_chat_threads (context_type, context_id);

create table if not exists public.gids_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.gids_chat_threads (id) on delete cascade,
  sender_listing_id uuid not null references public.gids_listings (id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists gids_chat_messages_thread_idx on public.gids_chat_messages (thread_id, created_at asc);

create table if not exists public.gids_chat_read_state (
  thread_id uuid not null references public.gids_chat_threads (id) on delete cascade,
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, listing_id)
);

alter table public.gids_chat_threads enable row level security;
alter table public.gids_chat_messages enable row level security;
alter table public.gids_chat_read_state enable row level security;

-- Alleen server (service role) via Next API
