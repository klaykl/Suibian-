# 随辩 — 启动指南

## 1. 创建 Supabase 项目

1. 前往 [supabase.com](https://supabase.com) 注册/登录
2. 创建一个新项目（免费层：500MB 数据库，50K 月活用户）
3. 项目创建后，进入 **Settings → API**
4. 复制 `Project URL` 和 `anon public key`

## 2. 配置环境变量

编辑 `.env.local`，替换为你的 Supabase 信息：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...你的anon key
```

## 3. 初始化数据库

1. 进入 Supabase 项目的 **SQL Editor**
2. 复制 `supabase-schema.sql` 的全部内容
3. 粘贴到 SQL Editor 中，点击 Run
4. 这会创建所有表、索引、RLS 策略和触发器

## 4. 关闭邮箱验证（MVP 阶段）

1. 进入 Supabase **Authentication → Settings**
2. 在 **Email** 部分，关闭 **Confirm email**（或保留开启但需要用户验证邮箱）
3. MVP 阶段建议关闭以降低注册门槛

## 5. 设置管理员

创建第一个用户后，在 Supabase **Table Editor** 中：
1. 打开 `profiles` 表
2. 找到你的用户行
3. 将 `is_admin` 设置为 `true`

## 6. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

## 7. 创建第一个话题

1. 用管理员账号登录
2. 访问 `http://localhost:3000/admin/topics`
3. 创建你的第一个辩论话题

## 8. 部署到 Vercel（可选）

```bash
npx vercel deploy
```

在 Vercel 项目设置中添加同样的环境变量。

## 话题自动结算

MVP 阶段，话题到期后需要**手动结算**。在 Supabase SQL Editor 中运行：

```sql
SELECT settle_topic('话题的UUID');
```

后续可设置 pg_cron 定时任务自动执行，或写一个简单的 Edge Function。

## 文件结构

```
debate-bar/
├── proxy.ts                    # 请求代理（原 middleware）
├── supabase-schema.sql         # 数据库初始化 SQL
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页 - 话题列表
│   │   ├── globals.css
│   │   ├── login/page.tsx      # 登录
│   │   ├── register/page.tsx   # 注册
│   │   ├── topics/[id]/page.tsx # 话题详情（辩论主战场）
│   │   ├── admin/topics/page.tsx # 管理员创建话题
│   │   └── auth/callback/route.ts # Supabase Auth 回调
│   ├── components/
│   │   ├── NavBar.tsx          # 导航栏
│   │   ├── NavUserMenu.tsx     # 用户菜单
│   │   ├── TopicCard.tsx       # 话题卡片
│   │   ├── AffiliationToggle.tsx # 阵营选择/切换
│   │   ├── SideStats.tsx       # 阵营统计
│   │   ├── CommentForm.tsx     # 评论表单
│   │   ├── CommentList.tsx     # 评论列表
│   │   └── AuthForm.tsx        # 登录/注册表单
│   ├── lib/
│   │   ├── auth.ts             # 认证工具
│   │   └── supabase/
│   │       ├── server.ts       # 服务端 Supabase Client
│   │       └── client.ts       # 客户端 Supabase Client
│   └── types/
│       └── index.ts            # TypeScript 类型
```
