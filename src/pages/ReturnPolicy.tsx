import type React from 'react'
import { useLang } from '../context/LangContext'

const ReturnPolicy: React.FC = () => {
  const { lang } = useLang()
  return (
    <div className="page policy-page">
      <h1 className="policy-title">
        {lang === 'zh' ? '退货政策' : 'Return Policy'}
      </h1>
      <p className="policy-subtitle">
        {lang === 'zh'
          ? '退货、产品支持和维修'
          : 'Returns, product support and repairs'}
      </p>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '我改变主意了' : 'I changed my mind'}</h2>
        <p>
          {lang === 'zh'
            ? '您可以在取货或送货后 15 天内退货。'
            : 'You may return your item within 15 days after collection or delivery.'}
        </p>
        <p>
          {lang === 'zh'
            ? '您的物品必须是：'
            : 'Your item must meet all of the following conditions:'}
        </p>
        <ul>
          <li>
            {lang === 'zh'
              ? '未使用且具有所有原始组件；'
              : 'Unused and with all original components;'}
          </li>
          <li>
            {lang === 'zh'
              ? '在原始包装中（如果适用，带有标签）；'
              : 'In the original packaging (with all tags/labels where applicable);'}
          </li>
          <li>
            {lang === 'zh'
              ? '处于转售状态；'
              : 'In a resellable condition;'}
          </li>
          <li>
            {lang === 'zh'
              ? '有购买凭证；'
              : 'With proof of purchase;'}
          </li>
          <li>
            {lang === 'zh'
              ? '与产品随附的任何赠品一起退回。'
              : 'Returned together with any free gifts that came with the product.'}
          </li>
        </ul>
        <p>
          {lang === 'zh'
            ? '退款将通过原始付款方式处理。如果您使用 USDT 或 ETH，需要一个工作日才能显示在您的账户中；使用银行电汇，退款最多可能需要 30 天，具体取决于您的银行。'
            : 'Refunds are processed via the original payment method. For USDT or ETH, it may take one business day to appear in your account. For bank transfers, refunds can take up to 30 days depending on your bank.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '产品支持' : 'Product support'}</h2>
        <p>
          {lang === 'zh'
            ? '在大多数情况下，如果您有任何物品问题，您可以在家中舒适地查看我们的产品支持页面，看看我们是否可以帮助解决问题。在那里，您可以访问有关产品和我们公司的常见问题、配送与取件、退货与退款等信息。'
            : 'In most cases, if you have an issue with a product, you can first visit our product support page from home to see if we can help you fix it. There you will find FAQs about our products and company, as well as information on shipping & pickup, returns and refunds.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '我的货物有问题' : 'My item is faulty or incorrect'}</h2>
        <p>
          {lang === 'zh'
            ? '如果您仍然需要退货（前 15 天内），我们将为您提供换货、更换或退款。'
            : 'If you still need to return the item (within the first 15 days), we can offer an exchange, replacement or refund.'}
        </p>
        <p>
          {lang === 'zh'
            ? '在此期限之后，只要产品仍在保修期内，我们会通过专业维修服务为您安排维修；如果无法维修，我们将根据情况为您更换或退货。最快的退货方式是通过我们遍布 112 个国家/地区的全球仓储中心。除大件物品外，我们可以接收大部分商品，即使它们最初是送货上门的。您可以前往离您最近的门店或仓储点。如果您要退回大件商品，请向下滚动开始实时聊天，或通过帮助热线与我们联系。'
            : 'After this period, as long as the product is still within its warranty, we will arrange repair via our professional repair partners, or replace/refund the item if a repair is not possible. The fastest way to return items is via our global warehouse network across 112 countries. We can accept most items (except large/bulky items), even if they were originally delivered to your door. You can visit the nearest store or warehouse point. For large items, please start a live chat below or contact us via the help line so we can arrange the return.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '防范措施' : 'Restrictions and precautions'}</h2>
        <ul>
          <li>
            {lang === 'zh'
              ? '某些商品，如食品、穿孔首饰和内衣，只有在有缺陷的情况下才能换货或退款。我们的网站将指明哪些项目不可退款。'
              : 'Some items — such as food, pierced jewellery and underwear — can only be exchanged or refunded if they are faulty. Non‑refundable items are clearly marked on our site.'}
          </li>
          <li>
            {lang === 'zh'
              ? '如果您退回 DVD、音乐或软件产品，它们必须是未使用过的并且处于原始密封包装中。'
              : 'If you return DVDs, music or software products, they must be unused and in their original sealed packaging.'}
          </li>
          <li>
            {lang === 'zh'
              ? '如果商品或包装严重损坏，我们保留减少退款金额的权利。'
              : 'If the item or packaging is badly damaged, we reserve the right to reduce the refund amount.'}
          </li>
          <li>
            {lang === 'zh'
              ? '我们可能会要求提供产品序列号或类似信息，以检查我们是否提供了该物品。'
              : 'We may ask for a product serial number or similar details to confirm that the item was supplied by us.'}
          </li>
          <li>
            {lang === 'zh'
              ? '当然，这些都不会影响您的消费者权益。'
              : 'None of the above affects your statutory consumer rights.'}
          </li>
          <li>
            {lang === 'zh'
              ? '如果我们安排上门取件，我们会在退款前检查商品。请注意，如果检查后发现商品不符合退货说明，我们保留根据具体情况拒绝退款或仅部分退款的权利。'
              : 'If we collect items from you, they will be inspected before any refund is issued. If the items do not meet the return conditions after inspection, we reserve the right to refuse a refund or offer a partial refund depending on their condition.'}
          </li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '常见问题' : 'FAQs'}</h2>
        <h3>
          {lang === 'zh' ? '我的退款需要多长时间？' : 'How long will my refund take?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '如果您将商品退回 TikTokMall 商店，我们可以立即为您办理退款，通常一个工作日内会显示到您的账户。如果您通过银行电汇付款，退款将通过电汇返回，处理时间最长可能为 30 天，具体取决于您的银行。'
            : 'If you return your item to a TikTokMall store, we can process the refund immediately and it usually appears in your account within one business day. If you paid by bank transfer, the refund will be sent back via bank transfer and may take up to 30 days, depending on your bank.'}
        </p>
        <p>
          {lang === 'zh'
            ? '如果您通过邮寄方式退货，请最多预留两周时间。一旦我们收到商品，会立即启动退款流程，通常一个工作日内会显示在您的账户中。退款处理完成后，我们无法再跟踪其在银行系统中的进度，但请放心——处理完成后您会收到确认通知。'
            : 'If you return items by post, please allow up to two weeks. We will start the refund as soon as we receive the items, and it usually appears in your account within one business day. After we process the refund, we cannot track its progress within the banking system, but don’t worry — you will receive a confirmation once it has been processed.'}
        </p>
        <p>
          {lang === 'zh'
            ? '请记住，所有退回的商品都必须符合我们的退货政策，并且需要保持未使用状态，连同原始包装和购买凭证一并退回。'
            : 'Please remember that all returned items must meet our return policy: they must be unused, in their original packaging and accompanied by proof of purchase.'}
        </p>
        <h3>
          {lang === 'zh' ? '什么才算是购买凭证？' : 'What counts as proof of purchase?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '以下任意一种都可以证明您在 TikTokMall 完成了购买：'
            : 'Any of the following can be used as proof that you purchased from TikTokMall:'}
        </p>
        <ul>
          <li>{lang === 'zh' ? '收银机收据；' : 'Till receipt;'}</li>
          <li>{lang === 'zh' ? '电子收据；' : 'E‑receipt;'}</li>
          <li>{lang === 'zh' ? '您的订单号；' : 'Your order number;'}</li>
          <li>{lang === 'zh' ? '电子邮件确认。' : 'Email confirmation.'}</li>
        </ul>
        <p>
          {lang === 'zh'
            ? '如果您找不到以上任何凭证，请不要担心。如果您能提供例如交易账单或用于购买商品的电子邮件地址，我们通常仍然可以帮助您查找到订单并处理相关问题。'
            : 'If you cannot find any of the above, don’t worry. If you can provide your transaction statement or the email address used for the purchase, we can usually help locate your order and deal with the issue.'}
        </p>
        <h3>
          {lang === 'zh'
            ? '如果没有质量问题，我可以退货吗？'
            : 'Can I return an item if there is nothing wrong with it?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '只要符合上述退货条件，根据我们的退货政策，您可以将该产品退回任何 TikTokMall 商店。'
            : 'As long as the return conditions above are met, you can return the product to any TikTokMall store according to our return policy, even if there is no quality issue.'}
        </p>
      </section>
    </div>
  )
}

export default ReturnPolicy
