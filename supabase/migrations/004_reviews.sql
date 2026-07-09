-- User review system: per-user ratings + review text, with an aggregate
-- rating/review_count denormalized onto items (recomputed by the API on submit).

alter table items add column if not exists review_count integer not null default 0;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  item_slug text not null references items(slug) on delete cascade,
  user_id uuid not null,
  author_name text,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_slug, user_id)
);
create index if not exists reviews_item_slug_idx on reviews(item_slug);

alter table reviews enable row level security;
create policy "reviews public read" on reviews for select using (true);
