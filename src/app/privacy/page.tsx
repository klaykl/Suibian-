import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/register" className="text-sm text-zhihu-blue hover:underline mb-6 inline-block">← 返回注册</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">隐私政策</h1>
      <p className="text-sm text-gray-400 mb-8">最后更新：2026年6月17日</p>

      <div className="prose prose-sm text-gray-700 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">引言</h2>
          <p>随辩（以下简称「我们」或「本平台」）深知个人信息对您的重要性。我们致力于保护您的隐私，并按照法律法规的要求处理您的个人信息。</p>
          <p>本隐私政策将帮助您了解以下内容：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>我们收集哪些信息</li>
            <li>我们如何使用这些信息</li>
            <li>我们如何存储和保护这些信息</li>
            <li>您对个人信息的权利</li>
            <li>本政策的更新方式</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. 我们收集的信息</h2>

          <h3 className="font-semibold mt-4 mb-2">1.1 您主动提供的信息</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>账户信息：</strong>注册时，我们收集您的用户名、邮箱地址和加密后的密码。每位用户将获得一个唯一的 10 位数字 ID。</li>
            <li><strong>个人资料：</strong>您可以选择性地提供性别、个人简介、头像照片、兴趣领域等信息。这些信息用于丰富您的个人主页展示。</li>
            <li><strong>用户内容：</strong>您在平台上发布的观点、评论、话题参与记录及立场选择。</li>
            <li><strong>社交互动：</strong>您与其他用户的好友关系、私信内容、点赞记录。</li>
            <li><strong>举报信息：</strong>您提交的举报内容及原因。</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">1.2 我们自动收集的信息</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>设备信息：</strong>设备型号、操作系统版本、浏览器类型和版本。</li>
            <li><strong>日志信息：</strong>IP 地址、访问时间、访问页面、点击行为。</li>
            <li><strong>Cookie 和类似技术：</strong>用于维持登录状态、记住语言偏好和字体大小设置。</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">1.3 我们不收集的信息</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>我们不要求提供真实姓名（可以使用用户名）</li>
            <li>我们不收集精确地理位置信息</li>
            <li>我们不收集通讯录信息</li>
            <li>我们不进行面部识别或生物特征采集</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. 我们如何使用信息</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>提供核心服务：</strong>创建和管理您的账户，展示您的内容和个人资料，实现辩论、评论、点赞、好友等功能。</li>
            <li><strong>内容推荐：</strong>基于您选择的兴趣领域（仅您自己可见），为您推荐可能感兴趣的话题。</li>
            <li><strong>安全保障：</strong>检测和防止欺诈、滥用、垃圾信息等违规行为。使用 CAPTCHA 验证防止自动化攻击。</li>
            <li><strong>沟通联系：</strong>向您发送账户相关通知（如验证邮件、注销确认等）。我们不会发送营销邮件。</li>
            <li><strong>产品改进：</strong>分析匿名的使用数据以改进我们的服务。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. 信息的存储与保护</h2>

          <h3 className="font-semibold mt-4 mb-2">3.1 数据存储</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>您的数据存储在 Supabase 提供的安全云服务器上。</li>
            <li>数据存储地点取决于您所在地区及服务器部署位置。</li>
            <li>我们采用行业标准的加密技术保护您的数据（传输层 TLS 加密，密码采用 bcrypt 哈希存储）。</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">3.2 安全措施</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>数据库使用行级安全策略（RLS），确保用户只能访问自己有权限的数据。</li>
            <li>API 请求采用 JWT 令牌认证。</li>
            <li>定期安全审计和漏洞扫描。</li>
            <li>员工访问数据的权限受到严格控制。</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">3.3 数据保留</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>账户数据在账户存续期间保留。</li>
            <li>注销账户后，个人数据在 7 天冷却期后清除。</li>
            <li>匿名化的社区内容（如评论）可能为维护讨论完整性而保留。</li>
            <li>系统日志保留期限不超过 90 天。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. 信息的共享与披露</h2>
          <p>我们不会出售您的个人信息。我们仅在以下情况下共享您的信息：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>获得您的同意：</strong>在获得您的明确同意后共享。</li>
            <li><strong>法律法规要求：</strong>根据法律法规、法院命令或政府部门的要求披露。</li>
            <li><strong>保护权益：</strong>为保护本平台、用户或公众的合法权益所必需时。</li>
            <li><strong>服务提供商：</strong>与帮助我们运营服务的第三方（如 Supabase、Vercel）共享必要的数据，这些第三方受合同约束须遵守数据保护要求。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. 您的权利</h2>
          <p>根据适用的数据保护法律，您享有以下权利：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>访问权：</strong>您可以在个人主页查看自己的公开信息。</li>
            <li><strong>更正权：</strong>您可以在设置页面修改用户名（每年 3 次）、性别、简介、头像、兴趣等信息。</li>
            <li><strong>隐私控制权：</strong>您可以在设置中切换参与话题和发表观点是否公开可见。</li>
            <li><strong>删除权：</strong>您可以删除自己发表的评论。您可以在设置中申请注销账户（7 天冷却期）。</li>
            <li><strong>数据便携权：</strong>您可以申请导出您的个人数据，我们将在 30 天内提供。</li>
            <li><strong>撤回同意权：</strong>对于基于同意的数据处理，您可以随时撤回同意，但不影响撤回前已进行的处理的合法性。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Cookie 政策</h2>
          <p>我们使用必要的 Cookie 来维持您的登录状态、记住语言偏好和字体大小设置。这些 Cookie 是提供服务所必需的，不用于广告或追踪目的。</p>
          <p>我们使用以下类型的 Cookie：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>会话 Cookie：</strong>维持登录状态，关闭浏览器后失效。</li>
            <li><strong>偏好 Cookie：</strong>记住语言选择和字体大小设置，持久存储。</li>
          </ul>
          <p>您可以通过浏览器设置管理 Cookie。但禁用必要的 Cookie 可能导致部分功能无法正常使用。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. 未成年人保护</h2>
          <p>本平台主要面向 16 岁及以上的用户。我们不会在知情的情况下收集 16 岁以下未成年人的个人信息。如果您是未成年人的监护人，发现未成年人未经您同意向我们提供了个人信息，请与我们联系，我们将及时删除相关数据。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. 跨境数据传输</h2>
          <p>我们的服务器可能位于您所在国家/地区以外的司法管辖区。我们确保在数据传输过程中采取适当的保护措施，以符合适用的数据保护法律要求。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. 隐私政策更新</h2>
          <p>我们可能会不时更新本隐私政策。更新后的政策将在本页面发布。对于重大变更，我们将通过平台通知、电子邮件等适当方式告知您。</p>
          <p>建议您定期查阅本隐私政策，以了解我们如何保护您的信息。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. 联系我们</h2>
          <p>如对本隐私政策有任何疑问、意见或投诉，或希望行使您的数据权利，请通过以下方式联系我们：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>邮箱：suibian.debate@outlook.com</li>
            <li>响应时间：我们将在 7 个工作日内回复</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
