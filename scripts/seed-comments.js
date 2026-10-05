const { Pool } = require('pg')

const pool = new Pool({
  connectionString:
    'postgresql://postgres:Wkl060816yyds@db.dilacmimmsxosimmkcly.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  // Get admin user
  const { rows: users } = await pool.query(
    "SELECT id, username FROM profiles WHERE email = 'namelesss689@gmail.com'"
  )
  const admin = users[0]
  if (!admin) {
    console.log('❌ 未找到管理员用户')
    process.exit(1)
  }
  console.log(`用户: ${admin.username} (${admin.id.substring(0, 8)}...)`)

  // Get all active topics
  const { rows: topics } = await pool.query(
    "SELECT id, title FROM topics WHERE status = 'active' ORDER BY created_at"
  )

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    console.log(`\n📌 ${topic.title}`)

    // Pick side: alternate for variety, but ensure both sides have representation
    const adminSide = i % 2 === 0 ? 'for' : 'against'

    // Create affiliation for admin
    await pool.query(
      `INSERT INTO affiliations (user_id, topic_id, side)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, topic_id) DO NOTHING`,
      [admin.id, topic.id, adminSide]
    )
    console.log(`   ✅ 管理员选择: ${adminSide === 'for' ? '正方' : '反方'}`)

    // Add a sample switch for topic 0 to demonstrate the feature
    if (i === 0) {
      // Switch admin from for to against then back to for
      const affResult = await pool.query(
        'SELECT id FROM affiliations WHERE user_id = $1 AND topic_id = $2',
        [admin.id, topic.id]
      )
      const affId = affResult.rows[0]?.id
      if (affId) {
        // Record a switch: for -> against
        await pool.query(
          `INSERT INTO affiliation_changes (affiliation_id, user_id, topic_id, from_side, to_side)
           VALUES ($1, $2, $3, 'against', 'for')`,
          [affId, admin.id, topic.id]
        )
        // Update affiliation to show it was changed
        await pool.query(
          `UPDATE affiliations SET changed_at = NOW(), side = 'for' WHERE id = $1`,
          [affId]
        )
        console.log(`   🔄 添加了一次阵营切换记录`)
      }
    }

    // Create 2-3 comments per topic
    const comments = getCommentsForTopic(i)
    for (const c of comments) {
      await pool.query(
        `INSERT INTO comments (topic_id, user_id, body, side_at_time, upvote_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [topic.id, admin.id, c.body, c.side, c.upvotes]
      )
    }
    console.log(`   💬 添加了 ${comments.length} 条示例评论`)
  }

  console.log('\n🎉 种子评论创建完成！')
  await pool.end()
}

function getCommentsForTopic(index) {
  const all = [
    // Topic 0: AI 取代程序员
    [
      { body: '我用了一年 Cursor，确实效率提升巨大。但我认为 AI 取代的是「不思考的码农」，真正理解业务和架构的工程师反而更有价值。初级程序员如果能利用 AI 作为杠杆，成长速度会比以前更快。', side: 'for', upvotes: 12 },
      { body: '我从培训机构出来的，刚入行一年。现在每天 70% 的代码是 AI 生成的。我不觉得这是威胁——我把自己当成 AI 的指挥官。但是这确实意味着只会照着需求写代码的人会被淘汰。', side: 'for', upvotes: 8 },
      { body: '我面试了不少应届生，他们的 GitHub 全是 AI 写的代码，问原理全不会。AI 让入门变容易了，但真正的深度反而更难获得。所以我投反方——AI 不会取代初级程序员，但会让初级程序员更难证明自己不是 AI。', side: 'against', upvotes: 15 },
    ],
    // Topic 1: 大学文凭
    [
      { body: '我在硅谷工作，我们团队最近招的三个人都没有 CS 学位。HR 说现在更看重 GitHub 和项目经验。大学文凭的信号价值在快速贬值，但大学带来的社交网络和人脉还是有价值的。', side: 'for', upvotes: 18 },
      { body: '作为一个从大厂出来的面试官，我要说：文凭仍然是最好的筛选器。没有文凭的候选人要付出多 10 倍的努力才能获得面试机会。不是所有公司都像硅谷那样开放。', side: 'against', upvotes: 10 },
    ],
    // Topic 2: 远程办公
    [
      { body: '远程办公一年半了。代码质量其实更高了——没有人打断你的深度工作。但新人 onboarding 确实是个问题，需要更有意识地做知识传递。', side: 'for', upvotes: 22 },
      { body: '我们公司混合办公 6 个月后，做了一个内部研究：发现创新类项目的产出下降了 40%。Zoom 能传递信息，但不能传递能量。有些创意只会在白板前的闲聊中诞生。', side: 'against', upvotes: 16 },
      { body: '远程让有家庭的人（尤其是女性）在职场上获得了更多公平。这比效率更重要。', side: 'for', upvotes: 9 },
    ],
    // Topic 3: 存钱 vs 体验
    [
      { body: '我 35 岁了，回头看，25 岁背包去东南亚那一年花掉的钱，是我花过最值的 8000 块。那不是消费，是投资——投资的是你对世界的理解。', side: 'against', upvotes: 20 },
      { body: '复利的力量被严重低估。25 岁开始每月存 2000，到 60 岁是 300 万。35 岁开始只能攒到 100 万。差距是 200 万。你愿意用 200 万换一年的背包旅行吗？', side: 'for', upvotes: 14 },
    ],
    // Topic 4: 互联网让观点更极端
    [
      { body: '作为一个做了 8 年推荐算法的人，我可以负责任地说：算法确实在创造回音室。这不是阴谋，这是数学——极端内容的 CTR 比温和内容高 3 倍。算法只是在优化我们让它优化的指标。', side: 'for', upvotes: 25 },
      { body: '但互联网也让我读到了以前完全接触不到的观点。20 年前我只能看到本地报纸。今天我能读到全世界任何人的博客。算法不是完美的，但信息的可获得性是史无前例的。', side: 'against', upvotes: 11 },
      { body: '我原本是反方，直到我在推特上看到一场争论：两个人用完全相同的「事实」得出了完全相反的结论。算法让每个人活在自己的平行宇宙里。这不是信息获取的问题，是信息加工的问题。', side: 'for', upvotes: 7 },
    ],
  ]
  return all[index] || [{ body: '这是一个很有意思的话题，期待看到大家的观点。', side: 'for', upvotes: 1 }]
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
