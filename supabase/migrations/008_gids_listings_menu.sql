-- Menu: externe link en/of PDF in storage (bucket gids-listing-photos, pad {listing_id}/menu.pdf)

alter table public.gids_listings
  add column if not exists menu_url text,
  add column if not exists menu_pdf_path text,
  add column if not exists menu_pdf_public_url text;
