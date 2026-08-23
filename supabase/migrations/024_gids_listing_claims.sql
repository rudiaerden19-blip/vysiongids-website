-- Zaak claimen: Vysion-lijst blijft claimed_at NULL + geen pin_hash tot goedgekeurde claim.
-- Zaak toevoegen zet pin_hash; claimed_at pas na goedgekeurde claim (zie APPROVE_CLAIM_ACTIVATE_OWNER.sql).

alter table public.gids_listings
  add column if not exists claimed_at timestamptz;

comment on column public.gids_listings.claimed_at is
  'Gezet bij self-service registratie of na goedgekeurde claim; NULL = nog niet geclaimd door ondernemer.';

create table if not exists public.gids_listing_claim_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  contact_name text not null check (char_length(trim(contact_name)) >= 2),
  contact_email text not null check (char_length(trim(contact_email)) >= 5),
  contact_phone text not null check (char_length(trim(contact_phone)) >= 6),
  btw_number text,
  message text check (message is null or char_length(message) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists gids_listing_claim_requests_listing_idx
  on public.gids_listing_claim_requests (listing_id, created_at desc);

create index if not exists gids_listing_claim_requests_status_idx
  on public.gids_listing_claim_requests (status, created_at desc);

alter table public.gids_listing_claim_requests enable row level security;

-- Geen anon/authenticated policies: alleen service role via Next.js API.

grant select, insert, update on public.gids_listing_claim_requests to service_role;
