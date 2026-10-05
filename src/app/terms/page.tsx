import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/register" className="text-sm text-zhihu-blue hover:underline mb-6 inline-block">← 返回注册</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">服务条款</h1>
      <p className="text-sm text-gray-400 mb-8">最后更新：2026年6月17日</p>

      <div className="prose prose-sm text-gray-700 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. 接受条款</h2>
          <p>欢迎使用随辩（以下简称「本平台」）。通过访问或使用本平台的服务，您同意遵守本服务条款（以下简称「条款」）。如果您不同意本条款的任何部分，请勿使用本平台。</p>
          <p>您确认您已年满 16 周岁，或您在法定监护人的同意下使用本平台。如果您代表某个组织使用本平台，您声明并保证您有权使该组织受本条款的约束。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. 服务说明</h2>
          <p>随辩是一个以辩论为核心的社区平台。用户可以在平台上：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>参与话题讨论，选择正方或反方立场；</li>
            <li>发表观点和评论；</li>
            <li>对其他用户的内容进行点赞和回复；</li>
            <li>在辩论过程中改变自己的立场；</li>
            <li>与其他用户建立好友关系和私信交流。</li>
          </ul>
          <p>本平台保留随时修改、暂停或终止服务的权利，无需事先通知。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. 用户账户</h2>
          <p>为使用本平台的完整功能，您需要注册一个账户。您同意：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>提供真实、准确、完整的注册信息；</li>
            <li>维护并及时更新您的账户信息；</li>
            <li>保护您的账户密码安全，对您账户下的所有活动负责；</li>
            <li>每个邮箱或手机号仅可注册一个账户；</li>
            <li>不得将账户转让给他人使用。</li>
          </ul>
          <p>如发现未经授权使用您账户的情况，请立即通知我们。本平台对因您未能遵守上述规定而导致的任何损失不承担责任。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. 用户行为规范</h2>
          <p>您在使用本平台时，不得从事以下行为：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>发布违反法律法规的内容，包括但不限于危害国家安全、煽动民族仇恨、传播淫秽色情信息等；</li>
            <li>发布垃圾广告、恶意链接或进行商业推广；</li>
            <li>对他人进行人身攻击、辱骂、诽谤或骚扰；</li>
            <li>冒充他人或虚假陈述您的身份；</li>
            <li>使用自动化脚本、机器人或其他方式批量注册账户或发送请求；</li>
            <li>干扰或破坏本平台的正常运营；</li>
            <li>未经授权收集其他用户的信息。</li>
          </ul>
          <p>违反上述规范的用户，本平台有权采取包括但不限于删除内容、临时或永久封禁账户等措施。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. 知识产权</h2>
          <p>用户在使用本平台过程中产生的内容（包括但不限于评论、观点、帖子），其知识产权归用户所有。用户授予本平台在全球范围内、免费的、非独家的使用许可，以便本平台运营、展示和推广相关服务。</p>
          <p>本平台的名称、标识、界面设计、源代码等知识产权归本平台所有。未经书面许可，任何人不得复制、修改、传播或使用本平台的知识产权。</p>
          <p>如果您认为本平台上的内容侵犯了您的知识产权，请通过本条款中提供的联系方式通知我们。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. 免责声明</h2>
          <p>本平台按「现状」提供服务，不作任何明示或默示的保证，包括但不限于适销性、特定用途适用性和非侵权性的保证。</p>
          <p>本平台不保证服务不会中断、及时、安全或无误。用户在使用本平台服务时，应自行承担风险。</p>
          <p>对于用户之间因使用本平台而产生的任何纠纷，本平台不承担责任，但保留介入调解的权利。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. 责任限制</h2>
          <p>在法律允许的最大范围内，本平台及其关联方不对任何间接、附带、特殊或惩罚性损害赔偿承担责任，包括但不限于利润损失、数据丢失、商誉损害等。</p>
          <p>本平台对任何索赔的总责任不超过您在过去 12 个月内向本平台支付的费用总额（如有）。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. 账户注销</h2>
          <p>您可以在设置页面申请注销账户。注销申请提交后有 7 天冷却期，期间登录账户将自动取消注销。冷却期结束后，账户将被永久注销，您的 UID 将被释放，且大部分个人数据将被清除。</p>
          <p>请注意，您发表的某些内容可能因社区完整性需要而保留（以匿名化形式），但不再与您的身份关联。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. 条款修改</h2>
          <p>本平台保留随时修改本条款的权利。修改后的条款将在平台上发布，并在发布时生效。继续使用本平台即表示您接受修改后的条款。</p>
          <p>对于重大修改，我们将通过平台通知、电子邮件或其他合理方式提前告知。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. 联系我们</h2>
          <p>如对本服务条款有任何疑问、意见或建议，请通过以下方式联系我们：</p>
          <p>邮箱：suibian.debate@outlook.com</p>
          <p>我们将在 7 个工作日内回复您的咨询。</p>
        </section>
      </div>
    </div>
  )
}
