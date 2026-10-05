-- 随辩 数据库 Schema
-- 在 Supabase SQL Editor 中运行此文件

-- 1. 用户表 (由 Supabase Auth 自动管理 auth.users)
-- 这里创建公开的 profiles 表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 2 AND 20),
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 话题表
CREATE TYPE topic_status AS ENUM ('active', 'closed');

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status topic_status DEFAULT 'active',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  final_for_count INT DEFAULT 0,
  final_against_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 阵营表 (每个用户每个话题一条记录)
CREATE TYPE side AS ENUM ('for', 'against');

CREATE TABLE affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  side side NOT NULL,
  changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- 4. 阵营变更日志
CREATE TABLE affiliation_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliation_id UUID NOT NULL REFERENCES affiliations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  from_side side NOT NULL,
  to_side side NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  side_at_time side NOT NULL,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 点赞表
CREATE TABLE upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

-- Profiles: 所有人可读，仅本人可更新
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Topics: 所有人可读，仅管理员可创建/更新
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_read_all" ON topics FOR SELECT USING (true);
CREATE POLICY "topics_insert_admin" ON topics FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "topics_update_admin" ON topics FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Affiliations: 所有人可读（统计用），登录用户可创建/更新自己的
ALTER TABLE affiliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliations_read_all" ON affiliations FOR SELECT USING (true);
CREATE POLICY "affiliations_insert_own" ON affiliations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "affiliations_update_own" ON affiliations FOR UPDATE
  USING (auth.uid() = user_id);

-- Affiliation changes: 所有人可读
ALTER TABLE affiliation_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "changes_read_all" ON affiliation_changes FOR SELECT USING (true);
CREATE POLICY "changes_insert_own" ON affiliation_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments: 所有人可读，登录用户可创建/更新自己的
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Upvotes: 所有人可读，登录用户可创建/删除自己的
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upvotes_read_all" ON upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_insert_own" ON upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upvotes_delete_own" ON upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_affiliations_topic ON affiliations(topic_id);
CREATE INDEX idx_affiliations_user ON affiliations(user_id);
CREATE INDEX idx_comments_topic ON comments(topic_id, created_at DESC);
CREATE INDEX idx_comments_upvotes ON comments(topic_id, upvote_count DESC);
CREATE INDEX idx_upvotes_comment ON upvotes(comment_id);
CREATE INDEX idx_affiliation_changes_topic ON affiliation_changes(topic_id);
CREATE INDEX idx_topics_status_ends ON topics(status, ends_at);

-- ============================================
-- 自动结算函数 (可通过 Supabase Edge Function 或 pg_cron 定时执行)
-- ============================================
CREATE OR REPLACE FUNCTION settle_topic(topic_id UUID)
RETURNS void AS $$
DECLARE
  for_cnt INT;
  against_cnt INT;
BEGIN
  -- 统计当前阵营人数
  SELECT
    COUNT(*) FILTER (WHERE side = 'for'),
    COUNT(*) FILTER (WHERE side = 'against')
  INTO for_cnt, against_cnt
  FROM affiliations
  WHERE topic_id = settle_topic.topic_id;

  -- 更新话题统计
  UPDATE topics
  SET
    status = 'closed',
    final_for_count = for_cnt,
    final_against_count = against_cnt,
    updated_at = NOW()
  WHERE id = settle_topic.topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
