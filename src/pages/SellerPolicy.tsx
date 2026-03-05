import type React from 'react'
import { useLang } from '../context/LangContext'

const SellerPolicy: React.FC = () => {
  const { lang } = useLang()
  return (
    <div className="page policy-page">
      <h1 className="policy-title">
        {lang === 'zh' ? '卖家政策' : 'Seller Policy'}
      </h1>
      <p className="policy-subtitle">
        {lang === 'zh'
          ? '卖家政策 · 卖家评分系统'
          : 'Seller policy · Seller rating system'}
      </p>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '简介' : 'Introduction'}</h2>
        <p>
          {lang === 'zh'
            ? '在这里，我们将向您介绍卖家评分系统及其生成和使用方式。'
            : 'Here we introduce the seller rating system and how scores are generated and used.'}
        </p>
        <p>
          <strong>{lang === 'zh' ? '相关网站：' : 'Site: '}</strong>
          TikTokMall
        </p>
        <p>
          <strong>{lang === 'zh' ? '相关方：' : 'Applies to: '}</strong>
          {lang === 'zh' ? '所有卖家' : 'All sellers'}
        </p>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh' ? '1、如何进入卖家评分系统？' : '1. How does the seller rating work?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '卖家评分系统鼓励卖家保持高服务标准，为我们的买家创造良好的购物体验。'
            : 'The seller rating system encourages sellers to maintain high service standards and create a good shopping experience for buyers.'}
        </p>
        <p>
          {lang === 'zh'
            ? '未达到承诺目标将扣分。'
            : 'If the agreed targets are not met, points will be deducted.'}
        </p>
        <p>
          {lang === 'zh'
            ? '您可以在【卖家中心 &gt;&gt; 卖家信用评分】页面查看您的评分。'
            : 'You can view your score on the page “Seller Center &gt;&gt; Seller credit score”.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh' ? '2、评分是如何产生的？' : '2. How are scores generated?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '仅当未满足买方的最低期望时才会产生扣分，这也提醒卖家还有哪些问题需要改进。'
            : 'Points are only deducted when the minimum expectations of buyers are not met, which also highlights areas where the seller needs to improve.'}
        </p>
        <p>
          {lang === 'zh'
            ? '卖家评分系统会在每个月的第一天根据卖家上月的违规情况更新评分。您可以点击对应的评分维度关键词查看完整的政策。'
            : 'On the first day of each month, the seller rating system updates scores based on violations in the previous month. You can click each metric keyword to view the full policy.'}
        </p>
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th>{lang === 'zh' ? '计分指标' : 'Metric'}</th>
                <th>{lang === 'zh' ? '说明' : 'Details'}</th>
                <th>{lang === 'zh' ? '违规处罚' : 'Penalty'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{lang === 'zh' ? '不履行率（NFR）' : 'Non‑fulfilment rate (NFR)'}</td>
                <td>
                  {lang === 'zh'
                    ? '近 7 天卖家取消或退货的订单数量占订单总数的 30%'
                    : 'In the last 7 days, cancelled or returned orders exceed 30% of total orders.'}
                </td>
                <td>{lang === 'zh' ? '冻结店铺' : 'Store suspension'}</td>
              </tr>
              <tr>
                <td>{lang === 'zh' ? '迟发率（LSR）' : 'Late shipment rate (LSR)'}</td>
                <td>
                  {lang === 'zh'
                    ? '近 7 天内卖家延迟 72 小时以上的订单数量占订单总数的 20%'
                    : 'In the last 7 days, orders shipped more than 72 hours late exceed 20% of total orders.'}
                </td>
                <td>{lang === 'zh' ? '冻结店铺' : 'Store suspension'}</td>
              </tr>
              <tr>
                <td rowSpan={2}>{lang === 'zh' ? '客户服务' : 'Customer service'}</td>
                <td>
                  {lang === 'zh'
                    ? '粗鲁或辱骂性的聊天或评论'
                    : 'Rude or abusive chat messages or comments'}
                </td>
                <td>{lang === 'zh' ? '冻结店铺' : 'Store suspension'}</td>
              </tr>
              <tr>
                <td>
                  {lang === 'zh'
                    ? '要求买家本月取消订单超过 5 次'
                    : 'Seller asks buyers to cancel orders more than 5 times in a month'}
                </td>
                <td>{lang === 'zh' ? '冻结店铺' : 'Store suspension'}</td>
              </tr>
              <tr>
                <td rowSpan={2}>{lang === 'zh' ? '不守诺言' : 'Broken promises'}</td>
                <td>
                  {lang === 'zh'
                    ? '买家回复率低于 80%'
                    : 'Reply rate to buyers is lower than 80%'}
                </td>
                <td>{lang === 'zh' ? '冻结店铺' : 'Store suspension'}</td>
              </tr>
              <tr>
                <td>
                  {lang === 'zh'
                    ? '卖方未按承诺向买方提供服务，损害买方权益'
                    : 'Seller fails to provide services as promised, harming buyer rights'}
                </td>
                <td>{lang === 'zh' ? '冻结店铺' : 'Store suspension'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh'
            ? '3、与一定积分相关的惩罚是什么？'
            : '3. What penalties correspond to the total score?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '总积分与处罚级别对应关系如下，达到该级别即适用对应及以下所有处罚。'
            : 'The total score corresponds to penalty levels as below. Once a level is reached, all penalties for that and lower levels apply.'}
        </p>
        <div className="policy-table-wrap">
          <table className="policy-table policy-table-penalty">
            <thead>
              <tr>
                <th rowSpan={2}></th>
                <th colSpan={6}>{lang === 'zh' ? '总积分' : 'Total score'}</th>
              </tr>
              <tr>
                <th>5</th>
                <th>10</th>
                <th>15</th>
                <th>20</th>
                <th>25</th>
                <th>&gt;25</th>
              </tr>
              <tr>
                <th>{lang === 'zh' ? '处罚级别' : 'Penalty level'}</th>
                <th>{lang === 'zh' ? '1等级' : 'Level 1'}</th>
                <th>{lang === 'zh' ? '2等级' : 'Level 2'}</th>
                <th>{lang === 'zh' ? '3等级' : 'Level 3'}</th>
                <th>{lang === 'zh' ? '4等级' : 'Level 4'}</th>
                <th>{lang === 'zh' ? '5等级' : 'Level 5'}</th>
                <th>{lang === 'zh' ? '6等级' : 'Level 6'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{lang === 'zh' ? '禁止营销活动' : 'No marketing activities'}</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
              </tr>
              <tr>
                <td>
                  {lang === 'zh'
                    ? '删除免运费或运费回扣'
                    : 'Remove free‑shipping or shipping rebates'}
                </td>
                <td></td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
              </tr>
              <tr>
                <td>{lang === 'zh' ? 'Deboost 上市' : 'Deboost product listings'}</td>
                <td></td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
              </tr>
              <tr>
                <td>{lang === 'zh' ? '限制卖方贷款' : 'Restrict seller loans'}</td>
                <td></td>
                <td></td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
              </tr>
              <tr>
                <td>
                  {lang === 'zh'
                    ? '阻止列表创建和编辑'
                    : 'Block listing creation and editing'}
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td>●</td>
                <td>●</td>
                <td>●</td>
              </tr>
              <tr>
                <td>{lang === 'zh' ? '冻结账户' : 'Freeze account'}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>●</td>
                <td>●</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh'
            ? '4、客户服务规则及实施细则'
            : '4. Customer service rules and details'}
        </h2>
        <h3>
          {lang === 'zh'
            ? '什么是粗鲁或辱骂性的聊天或评论？'
            : 'What is considered rude or abusive chat or comments?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '恶意骚扰是指会员对他人进行侮辱、诅咒、威胁、评论等言语攻击或采取不正当手段骚扰他人，损害他人合法权益的行为。'
            : 'Malicious harassment refers to insulting, cursing, threatening or otherwise verbally attacking others, or using improper means to harass others and harm their legitimate rights and interests.'}
        </p>
        <h3>
          {lang === 'zh'
            ? '如何处理粗鲁或辱骂性的聊天或评论？'
            : 'How are rude or abusive chats or comments handled?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '此类行为将作为一般或严重违规，对业务权限进行扣分管理和限制。'
            : 'Such behaviour is treated as a general or serious violation, and points will be deducted with corresponding restrictions on business permissions.'}
        </p>
        <p>
          <strong>{lang === 'zh' ? '适用情形：' : 'Applicable situations: '}</strong>
          {lang === 'zh'
            ? '恶意骚扰是指会员对他人进行辱骂、诅咒、威胁等言语攻击，或者以恶劣手段骚扰他人，损害他人合法权益的行为。'
            : 'Malicious harassment includes insulting, cursing, threatening others or using malicious means to harass them and harm their rights.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh'
            ? '5、违约适用的措施'
            : '5. Measures applied to breaches of obligation'}
        </h2>
        <h3>
          {lang === 'zh' ? '什么是违约？' : 'What is considered a breach?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '违约是指卖家未向买家提供服务，侵犯买家权益，未按承诺向 TikTokMall 履行义务。卖方必须继续履行法定或约定的更换、退货和退款。'
            : 'A breach occurs when the seller fails to provide services to the buyer, infringes the buyer’s rights, or fails to fulfil obligations promised to TikTokMall. The seller must still perform legally or contractually required exchanges, returns and refunds.'}
        </p>
        <p>
          <strong>{lang === 'zh' ? '适用措施：' : 'Measures: '}</strong>
          {lang === 'zh' ? '冻结店铺' : 'Store suspension'}
        </p>
        <p>
          <strong>{lang === 'zh' ? '具体措施：' : 'Details: '}</strong>
        </p>
        <p>
          {lang === 'zh'
            ? '1、如卖家在特定情况下对已付款订单或相应商品或服务还有其他需要履行的承诺，每项一般违规扣 5 分。'
            : '1. If the seller has other obligations to fulfil for paid orders or related products/services, each general violation will deduct 5 points.'}
        </p>
        <p>
          {lang === 'zh'
            ? '2、卖家违反以下承诺之一，每严重一次扣 10 分：'
            : '2. For each serious violation of the following commitments, 10 points will be deducted:'}
        </p>
        <ul>
          <li>
            {lang === 'zh'
              ? 'TikTokMall 判断卖家应承担退款等售后保障责任，卖家拒不承担；'
              : 'TikTokMall determines that the seller should bear after‑sales responsibilities such as refunds, but the seller refuses.'}
          </li>
          <li>
            {lang === 'zh'
              ? 'TikTokMall 判断卖家确实应承担 7 天无理由退换货的售后保障责任，但卖家拒不承担；'
              : 'TikTokMall determines that the seller should honour the 7‑day no‑reason return policy but refuses.'}
          </li>
          <li>
            {lang === 'zh'
              ? '未经买卖双方协商，拒绝或延迟向买家发送承诺的试用商品；'
              : 'Without mutual agreement, the seller refuses or delays sending promised trial products to the buyer.'}
          </li>
          <li>
            {lang === 'zh'
              ? '卖家在支付订单后 48 小时内未处理订单；'
              : 'The seller fails to process an order within 48 hours after payment.'}
          </li>
          <li>
            {lang === 'zh'
              ? '参加 TikTokMall 官方活动的卖家，未能完成活动要求（发货时间除外），或违反 TikTokMall 官方发布的其他管理内容（包括但不限于规则、规范、类目管理规范、行业标准），按具体规则执行。'
              : 'Sellers participating in official TikTokMall campaigns fail to meet campaign requirements (excluding shipping time) or violate other official rules (including but not limited to platform rules, category standards, industry standards), and will be penalized according to the corresponding rules.'}
          </li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh'
            ? '6、处罚会持续多久？'
            : '6. How long do penalties last?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '如对处罚有异议，可联系客户服务进行申诉。以客服审核结果为准，在卖家改善店铺表现并保持达标后，被制裁的卖家将逐步恢复相应的卖家权利。'
            : 'If you disagree with a penalty, you may contact customer service to appeal. Based on the review result, once store performance is improved and maintained at the required level, the sanctioned seller will gradually regain corresponding rights.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh' ? '7、违规处理' : '7. Handling of violations'}
        </h2>
        <p>
          {lang === 'zh'
            ? '1、如果情况一般：消费者发起投诉，TikTokMall 判断投诉有理，一般违规每次扣 5 分。完成 5 个订单可恢复 5 点。'
            : '1. General cases: when a buyer complaint is judged valid by TikTokMall, 5 points are deducted for each general violation. Completing 5 orders restores 5 points.'}
        </p>
        <p>
          {lang === 'zh'
            ? '2、情节严重的：消费者投诉，TikTokMall 判断投诉有理，情节严重的每项扣 20 分。完成 20 个订单可恢复 20 点。'
            : '2. Serious cases: for serious valid complaints, 20 points are deducted per violation. Completing 20 orders restores 20 points.'}
        </p>
        <p>
          {lang === 'zh'
            ? '3、情节特别严重的：冻结账号，关闭店铺。'
            : '3. Extremely serious cases: the account is frozen and the store is closed.'}
        </p>
        <h3>
          {lang === 'zh'
            ? '例 1：卖家 A 在第 3 周获得 3 分，将在第 7 周重新获得权利'
            : 'Example 1: Seller A gets 3 points in week 3 and regains rights in week 7'}
        </h3>
        <p>
          {lang === 'zh'
            ? '卖家 A 在第 3 周获得 3 分，处罚级别为 1 等级，处罚持续 28 天，第 7 周重新获得权利。'
            : 'Seller A gets 3 points in week 3, reaching penalty level 1. The penalty lasts 28 days and rights are restored in week 7.'}
        </p>
        <h3>
          {lang === 'zh'
            ? '例 2：卖家 B 在第 3 周获得 3 分，第 5 周获得 3 分。这些积分会累积起来定义等级，第 9 周会夺回权利'
            : 'Example 2: Seller B gets 3 points in week 3 and another 3 points in week 5; rights are restored in week 9'}
        </h3>
        <p>
          {lang === 'zh'
            ? '卖家 B 在第 3 周、第 5 周各获得 3 分，积分累积共 6 分，定义等级后处罚持续相应周期，第 9 周夺回权利。'
            : 'Seller B gets 3 points in week 3 and week 5 (6 points total). After the level is determined, the penalty runs its course and rights are restored in week 9.'}
        </p>
        <h3>
          {lang === 'zh'
            ? '例 3：卖家 C 新季度开始前一周获得 3 分，季度开始后获得 3 分，新获得的积分将重新定义等级'
            : 'Example 3: Seller C gets 3 points one week before a new quarter and 3 points after; the new score redefines the level'}
        </h3>
        <p>
          {lang === 'zh'
            ? '卖家 C 在新季度开始前一周获得 3 分，季度开始后又获得 3 分；新季度开始后新获得的积分将重新定义等级，分别计算处罚周期。'
            : 'Seller C gets 3 points one week before the new quarter and 3 more after it starts. The new points in the new quarter redefine the level and penalty periods are calculated separately.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh'
            ? '8、如何进行评分申诉？'
            : '8. How to appeal your score?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '单击求助热线链接进行申诉。如果您申诉成功，我们将取消您的扣分并恢复您相应的卖家权利。'
            : 'Click the help‑line link to submit an appeal. If your appeal is successful, the deducted points will be cancelled and the corresponding seller rights will be restored.'}
        </p>
      </section>
    </div>
  )
}

export default SellerPolicy
