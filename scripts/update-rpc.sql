CREATE OR REPLACE FUNCTION get_topics_with_counts()
RETURNS TABLE(
  id uuid, title text, description text, status text, category text,
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz,
  for_count bigint, against_count bigint, switch_fa bigint, switch_af bigint,
  top_comment_body text, top_comment_side text, top_comment_username text
) LANGUAGE sql STABLE AS $$
  SELECT
    t.id, t.title, t.description, t.status::text, t.category,
    t.starts_at, t.ends_at, t.created_at,
    COALESCE(fc.cnt,0), COALESCE(ac.cnt,0), COALESCE(sf.cnt,0), COALESCE(sa.cnt,0),
    tc.body, tc.side_at_time::text, tc.username
  FROM topics t
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliations WHERE topic_id = t.id AND side = 'for') fc ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliations WHERE topic_id = t.id AND side = 'against') ac ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliation_changes WHERE topic_id = t.id AND from_side = 'for' AND to_side = 'against') sf ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliation_changes WHERE topic_id = t.id AND from_side = 'against' AND to_side = 'for') sa ON true
  LEFT JOIN LATERAL (SELECT c.body, c.side_at_time, p.username FROM comments c JOIN profiles p ON p.id = c.user_id WHERE c.topic_id = t.id ORDER BY c.upvote_count DESC LIMIT 1) tc ON true
  ORDER BY t.created_at DESC;
$$;

-- 分页版：支持 offset/limit 和分类过滤，用于首页无限滚动
CREATE OR REPLACE FUNCTION get_topics_paginated(
  offset_val INT DEFAULT 0,
  limit_val INT DEFAULT 20,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id uuid, title text, description text, status text, category text,
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz,
  for_count bigint, against_count bigint, switch_fa bigint, switch_af bigint,
  top_comment_body text, top_comment_side text, top_comment_username text,
  content_type text, options jsonb, is_anonymous boolean
) LANGUAGE sql STABLE AS $$
  SELECT
    t.id, t.title, t.description, t.status::text, t.category,
    t.starts_at, t.ends_at, t.created_at,
    COALESCE(fc.cnt,0), COALESCE(ac.cnt,0), COALESCE(sf.cnt,0), COALESCE(sa.cnt,0),
    tc.body, tc.side_at_time::text, tc.username,
    t.content_type, t.options, t.is_anonymous
  FROM topics t
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliations WHERE topic_id = t.id AND side = 'for') fc ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliations WHERE topic_id = t.id AND side = 'against') ac ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliation_changes WHERE topic_id = t.id AND from_side = 'for' AND to_side = 'against') sf ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) as cnt FROM affiliation_changes WHERE topic_id = t.id AND from_side = 'against' AND to_side = 'for') sa ON true
  LEFT JOIN LATERAL (SELECT c.body, c.side_at_time, p.username FROM comments c JOIN profiles p ON p.id = c.user_id WHERE c.topic_id = t.id ORDER BY c.upvote_count DESC LIMIT 1) tc ON true
  WHERE (category_filter IS NULL OR t.category = category_filter)
  ORDER BY t.created_at DESC
  LIMIT limit_val OFFSET offset_val;
$$;
