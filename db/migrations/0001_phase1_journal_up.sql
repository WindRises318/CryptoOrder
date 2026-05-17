-- CryptoOrder V1 Schema (PostgreSQL)
-- Scope: Trade -> Journal -> Daily Review (Phase 1)

create extension if not exists "pgcrypto";

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  display_name varchar(80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trades (closed trades only for journal ingestion)
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  symbol varchar(20) not null,
  side varchar(10) not null check (side in ('long','short')),
  entry_price numeric(20,8) not null,
  exit_price numeric(20,8) not null,
  qty numeric(20,8) not null check (qty > 0),
  fee numeric(20,8) not null default 0,
  realized_pnl numeric(20,8) not null,
  opened_at timestamptz not null,
  closed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closed_at >= opened_at)
);
create index if not exists idx_trades_user_closed_at on trades(user_id, closed_at desc);
create index if not exists idx_trades_user_symbol on trades(user_id, symbol);

-- Journals (1:1 with trade)
create table if not exists journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  trade_id uuid not null unique references trades(id) on delete cascade,
  symbol varchar(20) not null,
  side varchar(10) not null check (side in ('long','short')),
  entry_price numeric(20,8) not null,
  exit_price numeric(20,8) not null,
  qty numeric(20,8) not null,
  fee numeric(20,8) not null default 0,
  realized_pnl numeric(20,8) not null,
  duration_sec int not null check (duration_sec >= 0),
  mae numeric(20,8),
  mfe numeric(20,8),
  status varchar(20) not null default 'draft' check (status in ('draft','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_journals_user_created_at on journals(user_id, created_at desc);
create index if not exists idx_journals_user_status on journals(user_id, status);
create index if not exists idx_journals_user_symbol on journals(user_id, symbol);

-- Journal subjective note
create table if not exists journal_notes (
  journal_id uuid primary key references journals(id) on delete cascade,
  entry_reason text,
  emotion varchar(20) check (emotion in ('calm','fomo','revenge','fear','greed')),
  execution_score int check (execution_score between 1 and 5),
  lessons_learned text,
  plan_sl numeric(20,8),
  actual_sl numeric(20,8),
  updated_at timestamptz not null default now()
);

-- Tags
create table if not exists journal_tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(40) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists journal_tag_rel (
  journal_id uuid not null references journals(id) on delete cascade,
  tag_id uuid not null references journal_tags(id) on delete cascade,
  primary key (journal_id, tag_id)
);
create index if not exists idx_journal_tag_rel_tag on journal_tag_rel(tag_id, journal_id);

-- Daily review metrics snapshot
create table if not exists daily_review_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  review_date date not null,
  total_trades int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  win_rate numeric(7,4) not null default 0,
  net_pnl numeric(20,8) not null default 0,
  avg_pnl numeric(20,8) not null default 0,
  max_single_loss numeric(20,8) not null default 0,
  top_error_pattern varchar(80),
  generated_at timestamptz not null default now(),
  unique (user_id, review_date)
);
create index if not exists idx_daily_review_user_date on daily_review_metrics(user_id, review_date desc);

-- Trigger: updated_at auto update
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users for each row execute procedure set_updated_at();

drop trigger if exists trg_trades_updated_at on trades;
create trigger trg_trades_updated_at before update on trades for each row execute procedure set_updated_at();

drop trigger if exists trg_journals_updated_at on journals;
create trigger trg_journals_updated_at before update on journals for each row execute procedure set_updated_at();
