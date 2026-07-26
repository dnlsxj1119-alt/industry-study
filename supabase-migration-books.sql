-- Adds the "책" (Book) feature: a books table alongside the existing posts table.
-- This project has no Supabase CLI/migration folder set up, so run this
-- script once in the Supabase Dashboard (SQL Editor) against your project.

CREATE TABLE IF NOT EXISTS books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,               -- 책의 저자
  category text not null,
  status text not null default '읽고 싶은 책'
    check (status in ('읽고 싶은 책', '읽는 중', '완독')),
  reason text,                        -- 읽고 싶은 이유 (읽고 싶은 책 상태에서 입력)
  core_topic text,                    -- 핵심 주제 한 줄 (읽는 중/완독 상태에서 입력)
  learning text,                      -- 배운 점
  application text,                   -- 내 삶에 적용할 점
  contribution_point smallint check (contribution_point between 1 and 3),
  study_date date,                    -- 달력에 표시될 날짜 (읽는 중/완독 상태에서만 의미 있음)
  member text not null,               -- 등록한 스터디 멤버
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- This app has no real authentication (members are just picked by name),
-- so RLS is disabled here to match the same trust model as the other
-- tables (posts, comments, etc). If your other tables use RLS policies
-- instead, replace this line with matching policies for `books`.
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
