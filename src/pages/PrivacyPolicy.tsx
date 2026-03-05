import type React from 'react'
import { useLang } from '../context/LangContext'

const PrivacyPolicy: React.FC = () => {
  const { lang } = useLang()
  return (
    <div className="page policy-page">
      <h1 className="policy-title">
        {lang === 'zh' ? '隐私政策' : 'Privacy Policy'}
      </h1>
      <p className="policy-subtitle">
        {lang === 'zh' ? '条款和条件' : 'Terms and conditions'}
      </p>

      {lang === 'zh' ? (
        <>
          <section className="policy-section">
        <h2>1、简介</h2>
        <h3>1.1</h3>
        <p>
          欢迎访问TikTokMall商店网站（单独和统称为“TikTokMall”、“我们”、“我们的”或“我们的”）。
          TikTokMall 认真履行适用隐私法律法规（“隐私法”）规定的责任，并承诺尊重我们 TikTokMall
          网站和移动应用程序（“平台”）所有用户的隐私权和顾虑（我们将平台和我们在平台上描述的我们提供的服务统称为“服务”）。
          用户是指为使用服务而向我们注册账户的用户，包括买家和卖家（单独和统称为“用户”、“您”或“您的”）。
          我们认识到您委托给我们的个人数据的重要性，并相信我们有责任妥善管理、保护和处理您的个人数据。
          本隐私政策（“隐私政策”或“政策”）旨在帮助您了解我们如何收集、使用、披露和处理您提供给我们以及我们拥有的关于您的个人数据，无论是现在还是将来，
          以及在向我们提供您的任何个人数据之前帮助您做出明智的决定。
        </p>
        <h3>1.2</h3>
        <p>
          “个人数据”或“个人数据”是指关于可以从该数据或从该数据和组织已经或可能可以访问的其他信息中识别的个人的数据，无论是否真实。
          个人数据的常见示例包括姓名、身份证号码和联系信息。
        </p>
        <h3>1.3</h3>
        <p>
          通过使用服务、在我们这里注册帐户、访问我们的平台或访问服务，您承认并同意您接受本隐私政策中概述的做法、要求和政策。
          您特此同意我们按照此处所述收集、使用、披露和处理您的个人数据。
          如果您不同意按照本隐私政策中的描述处理您的个人数据，请不要使用我们的服务或访问我们的平台。
          如果我们更改我们的隐私政策，我们将通过在我们的平台上发布这些更改或修订后的隐私政策来通知您。
          我们保留随时修改本隐私政策的权利。
          在适用法律允许的最大范围内，您可以使用平台上的服务，包括下订单。
        </p>
        <h3>1.4</h3>
        <p>
          本政策与适用于我们收集、存储、使用、披露和处理您的个人数据的其他通知、合同条款和同意条款一起适用，除非我们另有明确说明，否则无意推翻这些通知或条款。
        </p>
        <h3>1.5</h3>
        <p>除另有明确规定外，本政策适用于使用本服务的买卖双方。</p>
          </section>

          <section className="policy-section">
        <h2>2、TikTokMall 何时收集个人数据？</h2>
        <h3>2.1.</h3>
        <p>我们将/可能会收集关于您的个人数据：</p>
        <ul>
          <li>当您访问和访问我们的网站时；</li>
          <li>当您提交任何工作申请或表格时，包括但不限于申请表格或与我们的任何职位发布相关的其他表格；</li>
          <li>当您通过电话（可能被录音）、信件、传真、面对面会议、采访、社交媒体平台、电子邮件或通过网站与我们互动时。它包括但不限于当您访问和访问我们的网站时我们可能部署的 cookie；</li>
          <li>当招聘人员、就业代理或其他推荐您就业的各方代表您提交任何材料时，在这种情况下，我们理解您已向向我们提供此类个人数据的相关第三方提供了必要的同意；</li>
          <li>当您提供有关您与我们互动的文件或信息时；</li>
          <li>当您向我们提供反馈或回复调查时；</li>
          <li>当您出于任何原因向我们提交您的个人数据时。</li>
        </ul>
        <p>以上内容不完整，列出了可能收集个人数据的一些常见情况。</p>
        <h3>2.2</h3>
        <p>
          我们可能会从您、我们的关联方、第三方和其他来源收集关于您的个人数据，包括但不限于业务合作伙伴（如物流或支付服务提供商）、信用或评级机构、营销服务提供商或合作伙伴、推荐人或忠诚度计划、我们服务的其他用户或公开可用或政府数据源。
        </p>
        <h3>2.3</h3>
        <p>
          在某些情况下，您可能会向我们提供其他人（例如您的家人或朋友或您的联系人列表中的人）的个人数据。
          如果您向我们提供他们的个人数据，您声明并保证您已获得他们的同意，根据本政策处理他们的个人数据。
        </p>
          </section>

          <section className="policy-section">
        <h2>3、TikTokMall 收集哪些个人数据？</h2>
        <h3>3.1.</h3>
        <p>TikTokMall 可能收集的个人数据包括但不限于：</p>
        <ul>
          <li>姓名;</li>
          <li>电子邮件地址;</li>
          <li>出生日期;</li>
          <li>家庭地址;</li>
          <li>电话号码;</li>
          <li>性别;</li>
          <li>图像和生物识别数据，包括照片、音频或视频记录；性别；</li>
          <li>教育、就业和薪资历史（如适用）；</li>
          <li>在您的就业申请和相关材料中包含和收集的其他信息，包括提供给我们的任何推荐信息；</li>
          <li>营销和通信数据，例如您从我们和第三方接收营销的偏好、您的通信偏好以及与我们、我们的服务提供商和其他第三方的通信历史；</li>
          <li>地理或位置数据；</li>
          <li>当您访问、访问我们或网站并与之互动时提供的关于您的任何其他信息；</li>
          <li>汇总有关您参与的内容的数据。</li>
        </ul>
        <h3>3.2</h3>
        <p>
          您同意不向我们提交任何不准确或具有误导性的信息，并且您同意将此类信息的任何不准确或变更通知我们。
          我们保留要求提供进一步文件以验证您提供的任何信息的权利。
        </p>
        <h3>3.3</h3>
        <p>
          如果您使用您的社交媒体帐户（“社交媒体帐户”）注册为我们平台的用户，将您的TikTokMall帐户链接到您的社交媒体帐户或使用任何TikTokMall，我们可能会访问您的信息社交媒体功能已根据此类提供商的政策自愿提供给您的社交媒体帐户提供商。
          任何此类个人数据将始终根据本政策进行管理和使用。
        </p>
        <h3>3.4</h3>
        <p>
          如果您不希望我们收集上述信息/个人数据，您可以通过书面通知我们的数据保护官选择退出。
          有关选择退出的更多信息，请参阅下面标题为“您如何撤回您的同意、删除、请求访问或修改您提供给我们的信息？”的部分。
          但请注意，选择退出或撤销您对我们收集、使用或处理您的个人数据的同意可能会影响您对服务和平台的使用。
          例如，选择退出位置信息收集将导致其基于位置的功能被禁用。
        </p>
          </section>

          <section className="policy-section">
        <h2>4、其他资料的收集</h2>
        <h3>4.1.</h3>
        <p>
          与大多数网站和移动应用程序一样，您的设备发送的信息可能包括您浏览我们网站时由网络服务器记录的有关您的数据。
          它通常包括但不限于您的互联网协议 (IP) 地址、计算机/移动设备操作系统和浏览器类型、移动设备类型、移动设备的特性、唯一设备标识符 (UDID) 或移动设备标识符 (MEID)
          对于您的移动设备，推荐网站的地址（如果有），以及您在我们网站和移动应用程序上访问的页面和访问时间，有时还有“cookie”（可以使用您的浏览器首选项禁用）帮助网站记住您上次访问。
          这些信息也包含在匿名统计中，以便我们了解访问者如何使用我们的网站。
        </p>
        <h3>4.2.</h3>
        <p>
          我们的移动应用程序可能会使用 GPS、Wi-Fi 等技术收集有关您移动设备位置的精确信息。
          我们出于一个或多个目的收集、使用、披露和处理此信息，包括但不限于您请求的基于位置的服务，以便根据您的位置向您提供相关内容或允许您与其他用户共享您的位置我们移动应用程序下的部分服务。
          对于大多数移动设备，您可以通过您的设备设置撤销您对我们获取您位置信息的许可。
          如果您对禁用移动设备的定位服务有任何疑问，请随时联系您的设备服务提供商或制造商。
        </p>
        <h3>4.3.</h3>
        <p>
          在某些情况下，我们可能会在当地法律允许或征得您同意的情况下收集某些类型的敏感信息，例如健康/医疗信息（包括残疾状况）、工会会员信息、宗教、种族或族裔以及犯罪信息定罪和罪行。
          此类信息的收集和使用仅用于特定目的并在法律允许的情况下进行，例如进行背景调查或遵守适用的政策和法律义务。
        </p>
          </section>

          <section className="policy-section">
        <h2>5、Cookies</h2>
        <h3>5.1.</h3>
        <p>
          我们或我们的授权服务提供商和广告合作伙伴可能会偶尔使用“cookies”或其他功能来允许我们或第三方收集或共享有关您使用我们网站或服务的信息。
          这些功能有助于我们改进我们的网站和我们提供的服务，并使我们的广告合作伙伴和我们能够为您提供更多相关内容，包括通过再营销。
          “Cookie”是存储在您的计算机或移动设备上的标识符，用于记录有关计算机或设备的数据、使用或访问网站的方式和时间、有多少人以及我们网站内的其他活动。
          我们可能会将 cookie 信息链接到个人数据，并且 cookie 还会链接到有关您浏览过哪些网页的信息。
          这些信息旨在根据您的兴趣提供内容，使我们的第三方广告合作伙伴能够在互联网上的网站上投放广告、进行数据分析并监控网站的使用情况。
        </p>
        <h3>5.2.</h3>
        <p>
          您可以通过在浏览器上选择适当的设置来拒绝使用 cookie。
          但是，请注意，如果您这样做，您可能无法使用和访问我们网站的全部功能。
          请注意，基于 cookie 的选择退出在移动应用程序上可能无效。
          但是，您可以按照 Android 和 iOS 的说明选择退出某些移动应用程序上的个性化广告。
        </p>
          </section>

          <section className="policy-section">
        <h2>6、我们如何使用您提供给我们的信息？</h2>
        <h3>6.1.</h3>
        <p>我们可能出于以下一项或多项目的收集、使用、披露和处理您的个人数据：</p>
        <ul>
          <li>考虑并处理您的申请；</li>
          <li>向您提供您可能感兴趣的工作机会，包括与及其关联公司或相关公司的工作机会；</li>
          <li>管理、运营、提供和管理网站的使用；</li>
          <li>通过为您提供向我们提交信息的快速方法来定制您的体验；</li>
          <li>执行我们的服务条款或任何适用的最终用户许可协议；</li>
          <li>保护人身安全以及我们自己、我们的员工和他人的权利、财产或安全；</li>
          <li>用于识别和验证；</li>
          <li>维护和管理可能不时需要的任何软件更新和其他更新和支持，以确保网站的顺利运行；</li>
          <li>处理或回应您（或声称来自）您的任何询问；</li>
          <li>通过语音电话、短信、传真、电子邮件和邮政邮件与您联系或沟通有关就业机会的信息，以管理网站并提供与网站管理相关的信息。您承认并同意，这种通信方式可能涉及通过在信封/邮件包裹的外壳上包含信息来披露有关您的特定个人数据；</li>
          <li>进行研究、分析和开发活动（包括但不限于数据分析、调查、技术开发和分析）以分析您如何使用网站，以改进和增强网站；</li>
          <li>允许进行审计和调查，以验证我们目标受众的规模和构成，并了解他们对网站的体验；</li>
          <li>用于市场营销，并在这方面向您发送与TikTokMall及其附属公司或相关公司可能拥有的工作机会相关的信息和材料，无论此类工作列表现在是否存在或将来通过邮寄或电子邮件创建。您可以随时使用营销材料中的取消订阅功能取消订阅接收营销信息。我们，只要我们的关联公司可能会使用您的联系信息来发送新闻通讯或营销材料；</li>
          <li>响应法律程序或遵守任何相关司法管辖区的任何适用法律、政府或监管要求或我们真诚地认为此类披露是必要的，包括但不限于满足披露要求任何对TikTokMall或其相关公司或附属公司具有约束力的法律要求或对法律索赔的回应；</li>
          <li>为内部和法定报告和记录保存要求提供统计数据和研究；</li>
          <li>根据法律或监管义务或法律可能要求或我们可能已制定的风险管理程序进行尽职调查或其他筛选活动（包括但不限于背景调查）；</li>
          <li>在适用的情况下，与您建立雇佣关系并执行和管理任何相关的义务、福利和政策；</li>
          <li>审核我们的网站；防止或调查任何欺诈、非法活动、遗漏或不当行为，无论是否与您使用本网站或因您与我们的关系而产生的任何其他事项有关，以及是否对上述情况有任何怀疑；</li>
          <li>存储、托管和备份（无论是用于灾难恢复还是其他）您的个人数据，无论是在您的管辖范围内还是在管辖范围外；</li>
          <li>我们在征得您同意时通知您的任何其他目的。（统称为“目的”）。</li>
        </ul>
        <h3>6.2.</h3>
        <p>
          由于我们将/可能收集、使用、披露或处理您的个人数据的目的取决于手头的情况，此类目的可能不会出现在上面。
          但是，除非隐私法允许在未经您许可的情况下处理适用数据，否则我们会在征得您同意后通知您此类其他目的。
        </p>
        <h3>6.3.</h3>
        <p>
          您承认、同意并同意我们可以访问、保存和披露您的个人信息和内容，如果法律要求或根据法院命令或任何对 TikTokMall
          或其关联公司具有管辖权的政府或监管机构或真诚地相信此类访问保护或披露对于以下方面是合理必要的：(a) 遵守法律程序；
          (b) 遵守对TikTokMall或其相关附属公司具有管辖权的任何政府或监管机构的要求； (c) 执行我们的服务条款或本隐私政策；
          (d) 回应针对 TikTokMall 或其相关附属公司提出的任何威胁或实际索赔，或任何内容侵犯第三方权利的其他索赔； (e)
          响应您的客户服务请求； (f) 保护TikTokMall或其相关关联公司、其用户和公众的权利、财产或人身安全。
        </p>
          </section>

          <section className="policy-section">
        <h2>7、我们保留哪些信息，TikTokMall如何保护用户信息？</h2>
        <h3>7.1.</h3>
        <p>
          我们实施各种物理、管理和电子安全措施，以确保您的个人数据在我们系统上的合理安全。
          用户个人数据包含在安全网络之后，只有少数拥有此类系统特殊访问权限的员工才能访问。
        </p>
        <h3>7.2.</h3>
        <p>
          我们将根据隐私法和其他适用法律保留个人数据，包括为实现收集数据的目的、提供我们的服务、解决纠纷、建立法律防御、追求合法的商业目的、执行我们的协议所必需的，遵守适用法律，包括保持准确的就业、工资、税收或其他记录。
          也就是说，当我们合理确定 (i) 我们与您不再有关系，(ii) 保留此类个人数据不再符合保留该个人数据的目的时，我们将销毁或匿名化您的个人数据集;
          (iii) 出于任何法律或商业目的不再需要保留。
          如果您撤回就业申请、停止使用本网站，或者您访问或使用本网站的许可被终止，以及以其他方式终止您与我们的关系，我们可能会根据本隐私政策和我们的义务继续存储、使用和披露您的个人数据根据隐私法。
          根据适用法律，我们可能会安全地处理您的个人数据，恕不另行通知。
        </p>
          </section>

          <section className="policy-section">
        <h2>8、TikTokMall 是否向外部各方披露从访问者那里收集的信息？</h2>
        <h3>8.1</h3>
        <p>
          在开展我们的业务过程中，我们将/可能需要使用、处理、披露和转移您的个人数据给我们的第三方服务提供商、代理商和我们的关联公司或关联公司及其他第三方；
          这些第三方可能位于新加坡境内或境外，用于上述一项或多项目的。
          这些第三方服务提供商、代理人、关联公司、关联公司和其他第三方将代表我们或以其他方式处理您的个人数据，以实现上述一个或多个目的。
          我们努力确保第三方和我们的关联公司保护您的个人数据免受未经授权的访问、收集、使用、披露、处理或类似风险。
          我们仅在上述目的个人数据所需的期限内保留您的个人数据。
          这些第三方包括但不限于：我们的子公司、关联公司和关联公司；您在平台上与之交易或互动的买家或卖家；出于上述一项或多项目的使用我们平台的其他用户；承包商、代理商、服务提供商和我们用来支持我们业务的其他第三方（包括但不限于为我们提供行政或其他服务的人员，例如邮寄公司、物流服务提供商、金融服务提供商、广告和营销合作伙伴、电信公司、信息技术公司和数据中心）；对
          TikTokMall 具有管辖权或第 6.2 条允许的其他政府或监管机构；在合并、剥离、重组、解散或其他出售或转让部分或全部TikTokMall资产（无论是作为持续经营还是作为破产、清算或类似程序的一部分）的情况下的买方或其他继承人，其中
          TikTokMall 持有关于我们的服务用户的个人数据是一项资产转移；或涉及TikTokMall或其任何附属公司或相关公司的商业资产交易的一方；我们为一个或多个目的向其披露的第三方，这些第三方又为一个或多个目的收集和处理您的个人数据。
        </p>
        <h3>8.2</h3>
        <p>我们可能会与广告合作伙伴和第三方广告、再营销和其他程序提供商共享用户信息，包括统计和人口统计数据，以及有关他们使用服务的信息。</p>
        <h3>8.3</h3>
        <p>
          为免生疑问，如果隐私法或其他适用法律允许我们等组织在未经您同意的情况下收集、使用或披露您的个人数据，则该法律授予的许可将继续适用。
          与上述一致，根据适用法律，我们可能出于公认的法律原因使用您的个人数据，包括遵守我们的法律义务、履行我们与您签订的合同以及合法权益。
          我们使用这些理由来抵消对您的数据保护权利造成的任何损害，或者在必要时与法律索赔有关。
        </p>
        <h3>8.4</h3>
        <p>
          第三方可能会非法拦截或访问传输到本网站或包含在本网站上的个人数据，技术可能会发生故障或无法按预期工作，或者信息可能会因我们的过失而被未经授权的人访问、滥用或误用。
          但是，我们将按照《隐私法》的要求部署合理的安全措施来保护您的个人数据；
          但是，无法保证绝对安全，例如但不限于，当恶意和老练的黑客非我们的过错导致未经授权的披露时。
        </p>
        <h3>8.5</h3>
        <p>
          TikTokMall 允许您在 TikTokMall 直播功能中分享来自 YouTube 的视频（“YouTube 内容”）。
          为此，TikTokMall 使用了 YouTube 提供的 YouTube API 服务。
          使用共享 YouTube 内容，即表示您特此同意受位于 http://www.google.com/policies/privacy 的 Google 隐私政策的约束。
        </p>
        <h3>8.6</h3>
        <p>
          如TikTokMall服务条款所述，用户（包括任何员工、代理人、代表或代表该用户或代表该用户的任何其他人）通过使用服务拥有另一用户的个人数据（“接收方”）特此同意他们将遵守适用于任何此类数据的所有隐私法，包括此类数据的任何收集、处理、存储或传输。
        </p>
        <h3>8.7</h3>
        <p>尽管此处有任何规定，卖方（包括任何雇员、代理人、代表或代表该用户行事或代表该用户的任何其他人）应遵守与从TikTokMall收到的任何买方信息相关的所有适用隐私法。</p>
        <h3>8.7.1</h3>
        <p>
          未经买方和TikTokMall事先书面同意，不得使用买方的个人数据，除非为回应买方的询问以及回应、处理、处理或完成交易而合理必要。
          应避免使用此类信息联系 TikTokMall 平台以外的买家。
        </p>
        <h3>8.7.2</h3>
        <p>未经买方和TikTokMall事先书面同意，TikTokMall平台不会向任何未经授权的第三方披露买方的个人资料。</p>
        <h3>8.7.3</h3>
        <p>
          TikTokMall平台将采取充分的安全措施保护其持有的每个TikTokMall用户的个人数据，仅在上述目的和隐私法规定的必要期限内保留数据，并删除或应
          TikTokMall 的任何要求或在交易完成后的合理时间内将数据返回给 TikTokMall，并在发生任何潜在的数据泄露或此类用户数据的其他丢失时通知 TikTokMall 的个人数据保护官。
        </p>
          </section>

          <section className="policy-section">
        <h2>9、我们对儿童的政策</h2>
        <p>
          服务不适用于 13 岁以下的儿童。我们不会有意收集或维护 13 岁以下任何人的个人数据或非个人身份信息，我们平台的任何部分也不针对 13
          岁以下的儿童。我们将删除和删除任何个人信息我们认为数据是由 13 岁以下的任何儿童提交的。在某些司法管辖区，根据适用法律，年龄限制可能更高，在这种情况下，我们遵守适用的年龄限制。
        </p>
          </section>

          <section className="policy-section">
        <h2>10、第三方收集的信息</h2>
        <h3>10.1</h3>
        <p>
          我们的平台使用 Google Analytics，这是 Google, Inc.（“Google”）提供的一种网络分析服务。
          Google Analytics 使用 cookie（放置在您设备上的文本文件）帮助平台分析用户如何使用平台。
          由 cookie 生成的关于您使用平台的信息（包括您的 IP 地址）将被传输并存储在谷歌位于美国的服务器上。
          谷歌将使用这些信息来评估您对平台的使用，为网站运营商编制网站活动报告，并提供与网站活动和互联网使用相关的其他服务。
          谷歌也可能会在法律要求或此类第三方代表谷歌处理信息的情况下将此信息传输给第三方。
        </p>
        <h3>10.2</h3>
        <p>
          有时，第三方和我们可能会通过平台或服务提供软件应用程序下载供您使用。
          这些应用程序可能会单独访问并允许第三方查看您的个人身份信息，例如您的姓名、您的用户 ID、您设备的 IP
          地址或其他信息，例如您之前可能已经安装或通过以下方式为您安装的任何 cookie 第三方软件应用程序或网站。
          此外，这些应用程序可能会要求您直接向第三方提供额外信息。
          通过这些应用程序提供的第三方产品或服务不由 TikTokMall 所有或控制。
          我们鼓励您阅读此类第三方在其网站或其他地方发布的条款和其他政策。
        </p>
          </section>

          <section className="policy-section">
        <h2>11、关于安全和第三方网站的免责声明</h2>
        <h3>11.1</h3>
        <p>
          我们不保证您在第三方网站上提供的个人数据和其他信息的安全。
          我们实施各种安全措施来维护我们拥有或控制的您的个人数据的安全。
          您的个人数据包含在安全网络之后，只有少数拥有此类系统特殊访问权限的人才能访问，我们对个人数据保密。
          当您访问您的个人数据时，我们会提供一个安全的服务器。
          您提供的所有个人数据或敏感信息都被加密到我们的数据库中，并且只能按照上述方式访问。
        </p>
        <h3>11.2</h3>
        <p>
          为了提供增值，我们可能会选择各种第三方网站链接到网站并在网站内构建。
          这些链接的网站有单独和独立的隐私政策和安全安排。
          即使第三方与我们有关联，我们也无法控制独立于我们的这些链接网站、隐私和数据收集实践。
          我们可能不会收到此类第三方网站收集的数据（即使在我们的网站上或通过我们的网站提供）。
        </p>
        <h3>11.3</h3>
        <p>
          因此，我们对这些链接网站的内容、安全安排（或缺乏安全安排）和活动不承担任何责任或义务。
          这些链接的网站只是为了您的方便，因此您需要自行承担访问它们的风险。
          为了保护您的信息，我们建议您仔细阅读您访问的所有第三方服务的隐私政策。
          尽管如此，我们力求保护我们网站的完整性以及放置在每个网站上的链接。
          因此，我们欢迎对这些链接网站的任何反馈（包括但不限于特定链接是否有效）。
        </p>
          </section>

          <section className="policy-section">
        <h2>12、TikTokMall 会将您的信息转移到海外吗？</h2>
        <p>
          您的个人数据和信息可能会被传输到您所在国家/地区以外的国家/地区，并在这些国家/地区之外进行存储或处理。
          您的大部分个人数据将在我们的服务器所在的英国处理，我们只会根据隐私法将您的信息传输到海外。
        </p>
          </section>
        </>
      ) : (
        <>
          <section className="policy-section">
            <h2>1. Introduction</h2>
            <p>
              This Privacy Policy explains in clear language how TikTokMall (&quot;we&quot;, &quot;us&quot; and
              &quot;our&quot;) collects, uses, stores and shares your personal information when you use our
              website, mobile applications and related services (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By visiting our site, creating an account or using the Services, you agree that we may
              process your information in the ways described in this notice. If you do not agree,
              please do not use the Services.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. What information we collect</h2>
            <p>Depending on how you use TikTokMall, we may collect:</p>
            <ul>
              <li>Account and contact details such as name, email address, phone number and address.</li>
              <li>
                Order and payment information such as the products you buy, order history, delivery
                details and payment status (actual payment details are processed by payment providers).
              </li>
              <li>
                Device and usage information such as IP address, browser type, device identifiers, app
                version and pages you view.
              </li>
              <li>
                Optional information you choose to give us, for example when you contact customer
                service, join promotions, leave reviews or upload content.
              </li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. How we use your information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and operate the Services, including processing orders and payments.</li>
              <li>Deliver products, handle returns and after‑sales support.</li>
              <li>
                Create and manage your account, including security, authentication and fraud
                prevention.
              </li>
              <li>
                Communicate with you about your orders, account, customer service requests and
                important updates to our terms and policies.
              </li>
              <li>
                Improve and develop TikTokMall, including analytics, statistics and product
                optimisation.
              </li>
              <li>
                Show you relevant offers and marketing (where permitted by law and your preferences).
              </li>
              <li>
                Comply with legal obligations, respond to lawful requests and protect our rights, our
                users and the public.
              </li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Cookies and similar technologies</h2>
            <p>
              We use cookies and similar technologies to make the site work, remember your preferences,
              keep your session secure and understand how visitors use TikTokMall. Some cookies are
              essential for basic functions such as logging in and placing orders.
            </p>
            <p>
              You can control cookies through your browser settings. If you block or delete certain
              cookies, some features of the site may not function properly.
            </p>
          </section>

          <section className="policy-section">
            <h2>5. How we share your information</h2>
            <p>
              We do not sell your personal information. We may share it only with the following types
              of partners, but always for limited, specific purposes:
            </p>
            <ul>
              <li>
                Sellers and buyers on TikTokMall who need certain information to complete a
                transaction, such as shipping details.
              </li>
              <li>
                Service providers who help us operate the Services, such as payment processors, cloud
                hosting, logistics and delivery companies, customer support, analytics and marketing
                tools.
              </li>
              <li>
                Group companies and affiliates that support our operations under similar privacy
                safeguards.
              </li>
              <li>
                Authorities, regulators or other parties where required by law, to enforce our terms,
                or to protect the safety, rights or property of TikTokMall, our users or others.
              </li>
              <li>
                In connection with a business transaction such as a merger, acquisition or sale of
                assets, where the receiving party is bound by appropriate confidentiality and privacy
                commitments.
              </li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>6. International transfers</h2>
            <p>
              TikTokMall operates globally. Your information may be transferred to and processed in
              other countries or regions where our servers, group companies or service providers are
              located. We take reasonable steps to ensure that any such transfers comply with
              applicable data protection laws and that your information remains protected.
            </p>
          </section>

          <section className="policy-section">
            <h2>7. Data retention and security</h2>
            <p>
              We keep your personal information only for as long as it is needed for the purposes
              described in this Policy, to comply with legal, tax and accounting requirements, or to
              resolve disputes and enforce our agreements.
            </p>
            <p>
              We use reasonable technical and organisational measures to protect your information
              against unauthorised access, loss, misuse or disclosure. However, no system can be
              guaranteed to be 100% secure.
            </p>
          </section>

          <section className="policy-section">
            <h2>8. Your rights and choices</h2>
            <p>Depending on your location and applicable law, you may have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate or incomplete information.</li>
              <li>
                Object to certain uses of your data or ask us to restrict processing in some
                circumstances.
              </li>
              <li>
                Withdraw consent where processing is based on your consent (this will not affect the
                lawfulness of processing before withdrawal).
              </li>
              <li>
                Request deletion of your personal information, subject to legal and contractual
                limitations.
              </li>
            </ul>
            <p>
              To exercise your rights, please contact us using the contact details provided in this
              Policy. We may need to verify your identity before responding to your request.
            </p>
          </section>

          <section className="policy-section">
            <h2>9. Children&apos;s privacy</h2>
            <p>
              TikTokMall is not directed to children under the age of 13, and we do not knowingly
              collect personal data from children under 13. If we become aware that we have collected
              such data, we will delete it in accordance with applicable laws.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. Updates to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or for legal, regulatory or operational reasons. When we make material changes, we will
              take reasonable steps to notify you, for example by posting the updated Policy on our
              site and updating the &quot;last updated&quot; date.
            </p>
          </section>

          <section className="policy-section">
            <h2>11. How to contact us</h2>
            <p>
              If you have any questions, concerns or requests about this Privacy Policy or how we
              handle your personal information, please contact our data protection contact point using
              the contact details provided on the TikTokMall site.
            </p>
          </section>
        </>
      )}

      <section className="policy-section">
        <h2>13、您如何撤回同意、请求访问或更正您提供给我们的信息？</h2>
        <h3>13.1 撤回同意</h3>
        <h3>13.1.1</h3>
        <p>
          您可以通过发送电子邮件至我们的个人数据保护官 撤回您对收集、使用和披露我们拥有或控制的您的个人数据的同意。
          但是，您撤回同意可能意味着我们无法继续评估您的申请和您提供的任何信息。
        </p>
        <h3>13.1.2</h3>
        <p>
          当您分享 YouTube 内容时，除了根据第 13.1.1 条通过电子邮件撤回您对我们的同意外，您还可以使用 Google 安全设置页面
          https://security.google.com/settings/security/permissions , 撤销 TikTokMall 对您的个人数据的访问权限。
        </p>
        <h3>13.2. 访问或更正个人数据的请求</h3>
        <h3>13.2.1</h3>
        <p>
          如果您有我们的账户，您可以通过本平台的账户设置页面亲自访问和更正我们目前持有或控制的您的个人资料。
          如果您没有我们的帐户，您可以通过向我们提交书面请求来请求访问和更正我们目前拥有或控制的您的个人数据。
          我们需要您提供足够的信息来确定您的身份和请求的性质，以便能够处理您的请求。
          因此，请通过 将您的书面请求发送给我们的个人数据保护官。
        </p>
        <h3>13.2.2</h3>
        <p>
          我们可能会向您收取合理的费用来处理您访问您的个人数据的请求。
          如果我们选择收费，我们将向您提供我们将收取的费用的书面估算。
          请注意，除非您同意支付费用，否则我们无需回复或处理您的访问请求。
        </p>
        <h3>13.2.3</h3>
        <p>我们保留根据《隐私法》的规定拒绝更正您的个人数据的权利，该法要求并授权组织在所述情况下拒绝更正个人数据。</p>
      </section>

      <section className="policy-section">
        <h2>14、其他问题、疑虑或投诉</h2>
        <p>
          如果您对我们的隐私惯例有任何疑问或疑虑，请随时通过 与我们联系。
          请包括您的姓名、联系信息和请求的性质，以便我们能够适当地回复您的来信。
        </p>
      </section>
    </div>
  )
}

export default PrivacyPolicy
