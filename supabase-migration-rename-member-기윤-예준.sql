-- 멤버 이름 변경: '기윤' -> '예준'
-- Supabase CLI/마이그레이션 폴더가 없으므로 Supabase 대시보드 SQL Editor에서 1회 실행하세요.
-- 실행 전 백업 권장.

BEGIN;

-- 1. 멤버 이름이 저장되는 컬럼 (정확히 일치하는 값만 변경)
UPDATE posts          SET author       = '예준' WHERE author       = '기윤';
UPDATE comments       SET author       = '예준' WHERE author       = '기윤';
UPDATE bookmarks      SET author       = '예준' WHERE author       = '기윤';
UPDATE presentations  SET author       = '예준' WHERE author       = '기윤';
UPDATE updates        SET author_id    = '예준' WHERE author_id    = '기윤';
UPDATE books          SET member       = '예준' WHERE member       = '기윤';
UPDATE notifications  SET recipient_id = '예준' WHERE recipient_id = '기윤';
UPDATE notifications  SET actor_id     = '예준' WHERE actor_id     = '기윤';

-- 2. 자유 텍스트(본문/제목 등) 안에 언급된 '기윤'도 모두 치환
UPDATE posts SET
  title   = REPLACE(title,   '기윤', '예준'),
  summary = REPLACE(summary, '기윤', '예준'),
  opinion = REPLACE(opinion, '기윤', '예준'),
  content = REPLACE(content, '기윤', '예준')
WHERE title LIKE '%기윤%' OR summary LIKE '%기윤%' OR opinion LIKE '%기윤%' OR content LIKE '%기윤%';

UPDATE comments SET content = REPLACE(content, '기윤', '예준')
WHERE content LIKE '%기윤%';

UPDATE presentations SET
  title   = REPLACE(title,   '기윤', '예준'),
  content = REPLACE(content, '기윤', '예준')
WHERE title LIKE '%기윤%' OR content LIKE '%기윤%';

UPDATE updates SET
  title   = REPLACE(title,   '기윤', '예준'),
  content = REPLACE(content, '기윤', '예준')
WHERE title LIKE '%기윤%' OR content LIKE '%기윤%';

UPDATE books SET
  reason      = REPLACE(reason,      '기윤', '예준'),
  core_topic  = REPLACE(core_topic,  '기윤', '예준'),
  content     = REPLACE(content,     '기윤', '예준'),
  learning    = REPLACE(learning,    '기윤', '예준'),
  application = REPLACE(application, '기윤', '예준')
WHERE reason LIKE '%기윤%' OR core_topic LIKE '%기윤%' OR content LIKE '%기윤%'
   OR learning LIKE '%기윤%' OR application LIKE '%기윤%';

UPDATE notifications SET message = REPLACE(message, '기윤', '예준')
WHERE message LIKE '%기윤%';

COMMIT;
