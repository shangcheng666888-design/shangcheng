import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'
import { useLang } from '../context/LangContext'

type ShopLevel = 'normal' | 'silver' | 'gold' | 'diamond'

const LEVELS: {
  key: ShopLevel
  nameZh: string
  nameEn: string
  descZh: string
  descEn: string
  minSales: number
  icon: string
  benefitsZh: string[]
  benefitsEn: string[]
}[] = [
  {
    key: 'normal',
    nameZh: '普通店铺',
    nameEn: 'Standard shop',
    descZh: '入驻即可获得',
    descEn: 'Granted upon joining the platform',
    minSales: 0,
    icon: dianpu1,
    benefitsZh: ['基础店铺展示', '标准客服支持', '平台基础流量', '利润比例：采购价的 10%'],
    benefitsEn: [
      'Basic shop exposure',
      'Standard customer support',
      'Baseline platform traffic',
      'Profit: 10% over purchase price',
    ],
  },
  {
    key: 'silver',
    nameZh: '银牌店铺',
    nameEn: 'Silver shop',
    descZh: '累计销售额 ≥ $10,000',
    descEn: 'Cumulative sales ≥ $10,000',
    minSales: 10000,
    icon: dianpu2,
    benefitsZh: ['搜索加权曝光', '活动优先报名', '专属运营对接', '利润比例：采购价的 15%'],
    benefitsEn: [
      'Boosted search exposure',
      'Priority access to campaigns',
      'Dedicated operations contact',
      'Profit: 15% over purchase price',
    ],
  },
  {
    key: 'gold',
    nameZh: '金牌店铺',
    nameEn: 'Gold shop',
    descZh: '累计销售额 ≥ $50,000',
    descEn: 'Cumulative sales ≥ $50,000',
    minSales: 50000,
    icon: dianpu3,
    benefitsZh: ['首页推荐位', '佣金比例优惠', '专属客服通道', '利润比例：采购价的 20%'],
    benefitsEn: [
      'Homepage recommendation slots',
      'Better commission rate',
      'Dedicated support channel',
      'Profit: 20% over purchase price',
    ],
  },
  {
    key: 'diamond',
    nameZh: '钻石店铺',
    nameEn: 'Diamond shop',
    descZh: '累计销售额 ≥ $100,000',
    descEn: 'Cumulative sales ≥ $100,000',
    minSales: 100000,
    icon: dianpu4,
    benefitsZh: ['顶级流量扶持', '品牌联名机会', '年度荣誉认证', '利润比例：采购价的 25%'],
    benefitsEn: [
      'Top-level traffic support',
      'Brand collaboration opportunities',
      'Annual honor certification',
      'Profit: 25% over purchase price',
    ],
  },
]

const TIPS_ZH = [
  '保持稳定上新与动销，有助于更快达成销售额目标。',
  '参与平台大促与主题活动，可有效提升店铺销量。',
  '提升商品质量与服务质量，复购将显著贡献累计销售额。',
]

const TIPS_EN = [
  'Keep launching and selling steadily to reach your sales goals faster.',
  'Join major promotions and themed campaigns to effectively grow sales.',
  'Improve product and service quality to drive repeat purchases and total sales.',
]

const MerchantPlan: React.FC = () => {
  const { lang } = useLang()
  const [currentLevel, setCurrentLevel] = useState<ShopLevel>('normal')
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const readAuth = (): { shopId: string } | null => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
        if (!raw) return null
        const parsed = JSON.parse(raw) as { shopId?: string | null }
        const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
        if (!shopId) return null
        return { shopId }
      } catch {
        return null
      }
    }

    const fetchPlan = async () => {
      const auth = readAuth()
      if (!auth) {
        setError(
          lang === 'zh'
            ? '未找到店铺信息，请重新登录商家后台'
            : 'Shop information not found, please log in again.',
        )
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const shop = await api.get<{ id: string; level: number; sales: number }>(
          `/api/shops/${encodeURIComponent(auth.shopId)}`,
        )
        const mapLevel = (lvl: number): ShopLevel => {
          if (lvl >= 4) return 'diamond'
          if (lvl >= 3) return 'gold'
          if (lvl >= 2) return 'silver'
          return 'normal'
        }
        setCurrentLevel(mapLevel(shop.level ?? 1))
        const salesVal = Number(shop.sales ?? 0)
        setTotalSales(Number.isFinite(salesVal) ? salesVal : 0)
      } catch (e) {
        setError(
          lang === 'zh'
            ? '无法加载店铺运营计划，请稍后重试'
            : 'Failed to load shop growth plan, please try again later.',
        )
      } finally {
        setLoading(false)
      }
    }

  fetchPlan()
  }, [lang])

  const currentIndex = LEVELS.findIndex((l) => l.key === currentLevel)
  const nextLevel = LEVELS[currentIndex + 1]
  const currentLevelInfo = LEVELS[currentIndex]!

  const progress = nextLevel
    ? Math.min(100, nextLevel.minSales === 0 ? 100 : (totalSales / nextLevel.minSales) * 100)
    : 100
  const remain = nextLevel ? Math.max(0, nextLevel.minSales - totalSales) : 0

  return (
    <div className="merchant-plan-page">
      <header className="merchant-plan-header">
        <div className="merchant-plan-header-inner">
          <h1 className="merchant-plan-title">
            {lang === 'zh' ? '运营计划' : 'Growth plan'}
          </h1>
          <p className="merchant-plan-subtitle">
            {lang === 'zh'
              ? '升级店铺等级，解锁更多曝光与权益'
              : 'Upgrade your shop level to unlock more exposure and benefits.'}
          </p>
        </div>
      </header>

      <div className="merchant-plan-stats">
        <div className="merchant-plan-stat">
          <span className="merchant-plan-stat-label">
            {lang === 'zh' ? '当前累计销售额' : 'Current cumulative sales'}
          </span>
          <span className="merchant-plan-stat-value">
            {loading ? (lang === 'zh' ? '加载中…' : 'Loading…') : `$${totalSales.toLocaleString()}`}
          </span>
        </div>
        <div className="merchant-plan-stat-divider" />
        <div className="merchant-plan-stat">
          <span className="merchant-plan-stat-label">
            {lang === 'zh' ? '距离下一级' : 'To next level'}
          </span>
          <span className="merchant-plan-stat-value merchant-plan-stat-value--highlight">
            {loading
              ? lang === 'zh'
                ? '加载中…'
                : 'Loading…'
              : nextLevel
                ? `$${remain.toLocaleString()}`
                : lang === 'zh'
                  ? '已满级'
                  : 'Max level reached'}
          </span>
        </div>
        <div className="merchant-plan-stat-divider" />
        <div className="merchant-plan-stat">
          <span className="merchant-plan-stat-label">
            {lang === 'zh' ? '升级进度' : 'Upgrade progress'}
          </span>
          <span className="merchant-plan-stat-value">
            {loading ? '—' : `${Math.round(progress)}%`}
          </span>
        </div>
      </div>

      {error && (
        <div className="merchant-plan-error">
          {error}
        </div>
      )}

      <section className="merchant-plan-current">
        <div className="merchant-plan-current-card">
          <div className="merchant-plan-current-top">
            <div className="merchant-plan-current-icon" aria-hidden="true">
              <img src={currentLevelInfo.icon} alt="" className="merchant-plan-icon-img" loading="lazy" />
            </div>
            <div className="merchant-plan-current-info">
              <span className="merchant-plan-current-label">
                {lang === 'zh' ? '当前等级' : 'Current level'}
              </span>
              <h2 className="merchant-plan-current-name">
                {lang === 'zh' ? currentLevelInfo.nameZh : currentLevelInfo.nameEn}
              </h2>
              <p className="merchant-plan-current-desc">
                {lang === 'zh' ? currentLevelInfo.descZh : currentLevelInfo.descEn}
              </p>
            </div>
          </div>
          {nextLevel && (
            <div className="merchant-plan-current-progress-wrap">
              <div className="merchant-plan-current-progress-head">
                <span className="merchant-plan-current-progress-text">
                  {lang === 'zh' ? '升级至 ' : 'Upgrade to '}
                  {lang === 'zh' ? nextLevel.nameZh : nextLevel.nameEn}
                  {lang === 'zh' ? '：还需累计 ' : ': need '}
                  <strong>${remain.toLocaleString()}</strong>
                  {lang === 'zh'
                    ? `（当前 ${totalSales.toLocaleString()} / 目标 ${nextLevel.minSales.toLocaleString()}）`
                    : ` (current ${totalSales.toLocaleString()} / target ${nextLevel.minSales.toLocaleString()})`}
                </span>
                <span className="merchant-plan-current-progress-pct">{Math.round(progress)}%</span>
              </div>
              <div className="merchant-plan-current-progress-bar">
                <div
                  className="merchant-plan-current-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {!nextLevel && (
            <div className="merchant-plan-current-max">
              <span className="merchant-plan-current-max-icon" aria-hidden="true">🎉</span>
              {lang === 'zh'
                ? '您已达到最高等级，享受全部权益'
                : 'You have reached the highest level and enjoy all benefits.'}
            </div>
          )}
        </div>
      </section>

      <section className="merchant-plan-levels">
        <h2 className="merchant-plan-levels-title">
          {lang === 'zh' ? '店铺等级与权益' : 'Shop levels & benefits'}
        </h2>
        <p className="merchant-plan-levels-desc">
          {lang === 'zh'
            ? '完成对应销售额自动升级，无需申请'
            : 'Reach the required sales and your level will upgrade automatically.'}
        </p>
        <ul className="merchant-plan-levels-list">
          {LEVELS.map((level, index) => {
            const isCurrent = level.key === currentLevel
            const isNextLevel = index === currentIndex + 1
            const isPast = index <= currentIndex
            return (
              <li
                key={level.key}
                className={`merchant-plan-level-item${isCurrent ? ' merchant-plan-level-item--current' : ''}${isPast ? ' merchant-plan-level-item--unlocked' : ''}`}
              >
                <div className="merchant-plan-level-icon" aria-hidden="true">
                  <img src={level.icon} alt="" className="merchant-plan-icon-img" loading="lazy" />
                </div>
                <div className="merchant-plan-level-header">
                  <span className="merchant-plan-level-name">
                    {lang === 'zh' ? level.nameZh : level.nameEn}
                  </span>
                  {isCurrent && (
                    <span className="merchant-plan-level-badge">
                      {lang === 'zh' ? '当前' : 'Current'}
                    </span>
                  )}
                  {isPast && !isCurrent && (
                    <span className="merchant-plan-level-badge merchant-plan-level-badge--done">
                      {lang === 'zh' ? '已达成' : 'Achieved'}
                    </span>
                  )}
                </div>
                <div className="merchant-plan-level-desc">
                  {lang === 'zh' ? level.descZh : level.descEn}
                </div>
                <div className="merchant-plan-level-benefits-wrap">
                  <span className="merchant-plan-level-benefits-title">
                    {lang === 'zh' ? '升级好处' : 'Upgrade benefits'}
                  </span>
                  <ul className="merchant-plan-level-benefits">
                    {(lang === 'zh' ? level.benefitsZh : level.benefitsEn).map((b, i) => (
                      <li key={i} className="merchant-plan-level-benefit">
                        <span className="merchant-plan-level-benefit-check" aria-hidden>✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                {isNextLevel && (
                  <button type="button" className="merchant-plan-level-upgrade-btn">
                    {lang === 'zh' ? '冲刺升级' : 'Boost to upgrade'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="merchant-plan-tips">
        <h2 className="merchant-plan-tips-title">
          {lang === 'zh' ? '升级小贴士' : 'Tips for upgrading'}
        </h2>
        <ul className="merchant-plan-tips-list">
          {(lang === 'zh' ? TIPS_ZH : TIPS_EN).map((tip, i) => (
            <li key={i} className="merchant-plan-tips-item">
              <span className="merchant-plan-tips-num">{i + 1}</span>
              <span className="merchant-plan-tips-text">{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default MerchantPlan
