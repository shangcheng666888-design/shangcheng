import type React from 'react'
import { useLang } from '../context/LangContext'

const DeliveryPolicy: React.FC = () => {
  const { lang } = useLang()
  return (
    <div className="page policy-page">
      <h1 className="policy-title">
        {lang === 'zh' ? '送货及取货' : 'Delivery and pickup'}
      </h1>
      <p className="policy-subtitle">
        {lang === 'zh' ? '送货和取货' : 'Delivery and pickup'}
      </p>

      <section className="policy-section">
        <h2>
          {lang === 'zh' ? '你在哪里送货？' : 'Where do you deliver?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '要了解我们是否运送到您所在的地区，请在您要购买的商品上输入您的邮政编码。产品直接从我们的供应商处发货，我们的全球仓库遍布 112 个国家/地区。'
            : 'To check whether we deliver to your area, please enter your postcode on the product page you want to buy. Products are shipped directly from our suppliers and our global warehouses across 112 countries/regions.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>
          {lang === 'zh' ? '去哪里取？' : 'Where can I pick up my order?'}
        </h2>
        <p>
          {lang === 'zh'
            ? '我们在 TikTokMall 商店、Sainsbury\'s 超市和全球仓库的收货点全天候 24/7 运营。'
            : 'We operate 24/7 collection points at TikTokMall stores, Sainsbury’s supermarkets and our global warehouse network.'}
        </p>
        <p>
          {lang === 'zh'
            ? '对于支持快速通道配送的商品，您可以根据所在位置选择多个时间段。订单将送货上门并放置在安全可靠的位置。'
            : 'For items eligible for fast‑track delivery, you can choose from several time slots depending on your location. Orders will be delivered to your door and left in a safe, secure place.'}
        </p>
        <p>
          {lang === 'zh'
            ? '在英格兰、苏格兰和威尔士，我们为大型和笨重商品（例如沙发和床，需要两人或多人搬运的物品）提供配送服务，可将它们安全运送到您指定的任何房间。我们的司机会在送货当天与您联系，确认送货细节。如果您正在自我隔离，请提前告知我们，以便重新安排送货日期。'
            : 'In England, Scotland and Wales, we provide delivery for large and bulky items (such as sofas and beds that require two or more people), and can safely deliver them to the room of your choice. One of our friendly drivers will contact you on the day of delivery to confirm the details. If you are self‑isolating, please let us know in advance so we can rearrange your delivery date.'}
        </p>
        <p>
          {lang === 'zh'
            ? '目前大件物品的配送需求较高。如果您的订单出现延迟，我们会尽快通过消息通知您。我们始终致力于为客户提供最优质的服务，感谢您的耐心和支持。'
            : 'There is currently very high demand for delivery of large items. If your delivery is delayed, we will notify you as soon as possible. We are working hard to provide the best possible service and appreciate your patience and support.'}
        </p>
      </section>

      <section className="policy-section">
        <h2>{lang === 'zh' ? '常见问题' : 'FAQs'}</h2>
        <h3>
          {lang === 'zh'
            ? '如果我同时订购大件和小件商品怎么办？'
            : 'What happens if I order both large and small items?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '最快的送货方式是将它们分开配送。请放心，您只需支付一次运费。详情请查看您的订单确认电子邮件。'
            : 'The fastest way to get everything to you is to ship them separately. Don’t worry — you will only be charged for delivery once. Please check your order confirmation email for more details.'}
        </p>
        <h3>
          {lang === 'zh' ? '如果我不在家怎么办？' : 'What if I am not at home?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '小件商品会被放置在安全、隐蔽的位置，或者根据您的要求交给邻居。大件或贵重物品需要拍照或签名确认，无法随意放置，因此必须有人在家签收。如果您无法在约定时间在家，请通过帮助热线联系我们，以便重新安排送货时间，并选择最适合您的日期和时间段。'
            : 'Smaller items will be left in a safe, out‑of‑sight place, or with a neighbour if you have requested this. Large or high‑value items require a photo or signature on delivery and cannot be left unattended, so someone must be at home. If you cannot be there, please contact us via the help line so we can rearrange the delivery for a date and time slot that suits you.'}
        </p>
        <h3>
          {lang === 'zh'
            ? '有多少人运送大件物品？'
            : 'How many people deliver large items?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '像沙发、冰柜等大件商品通常由两名工作人员送货。我们的司机会在送货当天与您联系，并将订单安全地送到您选择的房间或位置。'
            : 'Large items such as sofas and freezers are usually delivered by a two‑person team. Our drivers will contact you on the day of delivery and safely bring your order to the room or location you choose.'}
        </p>
        <h3>
          {lang === 'zh'
            ? 'COVID‑19：对送货有什么影响？'
            : 'COVID‑19: How does it affect delivery?'}
        </h3>
        <p>
          {lang === 'zh'
            ? '我们仍然为许多商品提供送货服务，包括游戏机等预售商品。当送货日期临近时，您会收到我们的短信提醒，并在发货前收到快递方提供的跟踪号码。'
            : 'We continue to deliver many items, including pre‑orders such as games consoles. As your delivery date approaches, you will receive SMS reminders from us, and a tracking number from the courier before delivery.'}
        </p>
        <p>
          {lang === 'zh'
            ? '货物将被送至安全区域；大件物品会被放置在安全的地点。我们的司机会在送货当天与您联系，确认大件物品的配送细节。如果您正在自我隔离，请提前告知我们，以便重新安排送货日期。'
            : 'Parcels will be delivered to a safe area at your address, and large items will be placed in a safe location. Our drivers will contact you on the day of delivery to confirm arrangements for large items. If you are self‑isolating, please let us know in advance so that we can rearrange your delivery date.'}
        </p>
      </section>
    </div>
  )
}

export default DeliveryPolicy
