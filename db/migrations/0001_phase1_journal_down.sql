-- down migration: phase1 journal

drop trigger if exists trg_journals_updated_at on journals;
drop trigger if exists trg_trades_updated_at on trades;
drop trigger if exists trg_users_updated_at on users;

drop function if exists set_updated_at();

drop table if exists daily_review_metrics;
drop table if exists journal_tag_rel;
drop table if exists journal_tags;
drop table if exists journal_notes;
drop table if exists journals;
drop table if exists trades;
drop table if exists users;
