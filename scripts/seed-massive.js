const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CATEGORIES = ['科技','编程','AI','互联网','数码','职场','创业','管理','商业','社会','生活','情感','家庭','健康','哲学','心理','历史','文学','艺术','教育','法律','经济','环境','体育','游戏','娱乐','音乐','电影','美食','旅行','国际','军事']

const TOPIC_TEMPLATES = [
  '{topic}对普通人的影响被高估了', '{topic}应该被强制监管吗', '我们应该担心{topic}的发展速度吗',
  '{topic}的黄金时代已经过去了', '{topic}真的能改变世界吗', '为什么{topic}引发如此大的争议',
  '{topic}的利弊分析：你站哪边', '{topic}未来五年的发展趋势', '普通人如何应对{topic}的变革',
  '{topic}让社会更公平还是更分化', '我们是否过度依赖{topic}', '{topic}的伦理边界在哪里',
]

const COMMENT_POOL = [
  '这个话题确实值得深入讨论。我觉得关键在于如何平衡各方利益，而不是简单地支持或反对。',
  '作为一个从业者，我想说实际情况比媒体报道的复杂得多。很多细节被忽略了。',
  '我理解对方的担忧，但我觉得问题没有想象中那么严重。数据并不支持恐慌。',
  '从历史的角度看，类似的争议每隔几年就会出现一次。但这次确实有一些不同之处。',
  '很多人忽略了一个关键点：技术本身是中立的，问题在于我们如何使用它。',
  '我最近读了几篇相关的研究，发现不同国家的做法差异很大，值得我们借鉴。',
  '作为一个曾经站在反面的人，我最近开始重新思考这个问题。有些新的证据让我改变了看法。',
  '这个问题在不同年龄段的人群中看法差异非常大，代际冲突其实比表面看到的更严重。',
  '我觉得现在讨论这个问题时机正好，因为相关政策的制定正在关键阶段。',
  '看了一圈评论，我觉得大家都说得有道理。但有一个角度似乎很少被提到。',
  '这个问题本质上是个经济问题，而不是道德问题。把账算清楚就明白了。',
  '我在这个领域工作了八年，看着它从边缘走向主流。变化真的很大。',
  '理性讨论，不要被情绪带着走。数据比感觉可靠，尤其是在这种复杂问题上。',
  '作为学生，我觉得我们的声音经常被忽视。其实年轻一代对这个问题的看法和上一代完全不同。',
]

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function main() {
  // 1. Count existing topics
  const { count: existingCount } = await supabase.from('topics').select('*', { count: 'exact', head: true })
  const need = Math.max(0, 300 - (existingCount || 0))
  console.log(`现有 ${existingCount} 个话题，需要创建 ${need} 个`)

  if (need === 0) { console.log('已达标！'); return }

  // 2. Generate new topics
  const topics = []
  for (let i = 0; i < need; i++) {
    const cat = pick(CATEGORIES)
    const tmpl = pick(TOPIC_TEMPLATES)
    const topic = cat + '领域' + rand(1, 100).toString()
    const title = tmpl.replace('{topic}', topic)
    topics.push({ title, description: `关于${topic}的讨论。${pick(COMMENT_POOL)}`, category: cat })
  }

  // 3. Insert topics in batches
  const batchSize = 30
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize).map(t => ({
      title: t.title, description: t.description, category: t.category,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + rand(3, 10) * 86400000).toISOString(),
      status: 'active',
    }))
    const { error } = await supabase.from('topics').insert(batch)
    if (error) console.log(`Batch ${i}: ${error.message}`)
    else console.log(`✅ ${i + batch.length}/${topics.length} topics`)
    await new Promise(r => setTimeout(r, 200))
  }

  // 4. Now bulk-assign affiliations and comments via SQL
  console.log('\nAdding participants and comments via SQL...')
  const https = require('https')
  const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) throw new Error('Missing SUPABASE_ACCESS_TOKEN')
  const sql = `
DO \\$\\$
DECLARE
  t RECORD; u RECORD; split_bias FLOAT; n_participants INT; n_comments INT; i INT;
BEGIN
  FOR t IN SELECT id FROM topics WHERE status = 'active' LOOP
    -- Skip topics that already have many affiliations
    IF (SELECT COUNT(*) FROM affiliations WHERE topic_id = t.id) > 20 THEN CONTINUE; END IF;

    split_bias := 0.35 + random() * 0.3;
    n_participants := 40 + floor(random() * 60)::int;

    FOR u IN SELECT p.id FROM profiles p
      WHERE NOT EXISTS (SELECT 1 FROM affiliations a WHERE a.topic_id = t.id AND a.user_id = p.id)
      ORDER BY random() LIMIT n_participants
    LOOP
      INSERT INTO affiliations (user_id, topic_id, side)
      VALUES (u.id, t.id, CASE WHEN random() < split_bias THEN 'for'::side ELSE 'against'::side END)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Add 2-5 switches
    FOR u IN SELECT a.user_id, a.id as aff_id, a.side FROM affiliations a WHERE a.topic_id = t.id ORDER BY random() LIMIT (2 + floor(random() * 4))::int
    LOOP
      INSERT INTO affiliation_changes (affiliation_id, user_id, topic_id, from_side, to_side)
      VALUES (u.aff_id, u.user_id, t.id, u.side, CASE WHEN u.side = 'for' THEN 'against'::side ELSE 'for'::side END);
      UPDATE affiliations SET side = CASE WHEN side = 'for' THEN 'against'::side ELSE 'for'::side END, changed_at = NOW() WHERE id = u.aff_id;
    END LOOP;

    -- Add 3-7 comments
    n_comments := 3 + floor(random() * 5)::int;
    FOR i IN 1..n_comments LOOP
      INSERT INTO comments (topic_id, user_id, body, side_at_time, upvote_count)
      SELECT t.id, p.id, '${COMMENT_POOL[0]}', CASE WHEN random() < 0.5 THEN 'for'::side ELSE 'against'::side END, floor(random()*35+1)::int
      FROM profiles p
      WHERE NOT EXISTS (SELECT 1 FROM comments c WHERE c.topic_id = t.id AND c.user_id = p.id)
      ORDER BY random() LIMIT 1;
    END LOOP;
  END LOOP;
END;
\\$\\$;`

  const data = JSON.stringify({ query: sql })
  const req = https.request({
    hostname: 'api.supabase.com', path: '/v1/projects/dilacmimmsxosimmkcly/database/query', method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  }, (res) => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>console.log('SQL:',res.statusCode)); })
  req.write(data); req.end()

  console.log('\n🎉 Done!')
}

main().catch(e => console.error(e.message))
