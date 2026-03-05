import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { MerchantDashboardCharts } from './MerchantDashboardCharts'

const EMPTY_CHART_DATA = [
  { name: 'Mon', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Tue', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Wed', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Thu', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Fri', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Sat', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Sun', 评分: 0, 访客: 0, 订单: 0 },
]

interface DashboardData {
  productCount: number
  totalSales: number
  orderCount: number
  totalProfit: number
  pendingOrders: number
  unsettledAmount: number
  creditScore: number
  goodRate: number
  followers: number
  visitsTotal: number
  todayOrders: number
  todaySales: number
  todayProfit: number
  orderTrend: {
    labels: string[]
    orders: number[]
  }
}

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { lang } = useLang()
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [unsettledAmount, setUnsettledAmount] = useState(0)
  const [goodRate, setGoodRate] = useState(0)
  const [creditScore, setCreditScore] = useState(0)
  const [followers, setFollowers] = useState(0)
  const [visitsTotal, setVisitsTotal] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [todaySales, setTodaySales] = useState(0)
  const [todayProfit, setTodayProfit] = useState(0)
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA)
  const [activeChart, setActiveChart] = useState<'shop' | 'traffic' | 'orders'>('shop')

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

    const auth = readAuth()
    if (!auth) {
      return
    }

    const cacheKey = `merchantDashboard:${auth.shopId}`

    // 先尝试使用上一次成功加载的缓存，做到「秒开」
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null
      if (raw) {
        const cached = JSON.parse(raw) as {
          productCount?: number
          totalSales?: number
          orderCount?: number
          totalProfit?: number
          pendingOrders?: number
          unsettledAmount?: number
          creditScore?: number
          goodRate?: number
          followers?: number
          visitsTotal?: number
          todayOrders?: number
          todaySales?: number
          todayProfit?: number
          chartData?: typeof EMPTY_CHART_DATA
        }
        setProductCount(cached.productCount ?? 0)
        setTotalSales(Number(cached.totalSales ?? 0))
        setOrderCount(cached.orderCount ?? 0)
        setTotalProfit(Number(cached.totalProfit ?? 0))
        setPendingOrdersCount(cached.pendingOrders ?? 0)
        setUnsettledAmount(Number(cached.unsettledAmount ?? 0))
        setCreditScore(Number(cached.creditScore ?? 0))
        setGoodRate(Number(cached.goodRate ?? 0))
        setFollowers(Number(cached.followers ?? 0))
        setVisitsTotal(Number(cached.visitsTotal ?? 0))
        setTodayOrders(cached.todayOrders ?? 0)
        setTodaySales(Number(cached.todaySales ?? 0))
        setTodayProfit(Number(cached.todayProfit ?? 0))
        if (Array.isArray(cached.chartData) && cached.chartData.length === 7) {
          setChartData(cached.chartData)
        }
      }
    } catch {
      // ignore cache errors
    }

    const fetchDashboard = async () => {
      try {
        const res = await api.get<DashboardData>(`/api/shops/${encodeURIComponent(auth.shopId)}/dashboard`)
        const nextProductCount = res.productCount ?? 0
        const nextTotalSales = Number(res.totalSales ?? 0)
        const nextOrderCount = res.orderCount ?? 0
        const nextTotalProfit = Number(res.totalProfit ?? 0)
        const nextPendingOrders = res.pendingOrders ?? 0
        const nextUnsettledAmount = Number(res.unsettledAmount ?? 0)
        const nextCreditScore = Number(res.creditScore ?? 0)
        const nextFollowers = Number(res.followers ?? 0)
        const rate = Number(res.goodRate ?? 0)
        const nextGoodRate = Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 0
        const nextVisitsTotal = Number(res.visitsTotal ?? 0)
        const nextTodayOrders = res.todayOrders ?? 0
        const nextTodaySales = Number(res.todaySales ?? 0)
        const nextTodayProfit = Number(res.todayProfit ?? 0)

        let nextChart = EMPTY_CHART_DATA
        const labels = res.orderTrend?.labels ?? []
        const orders = res.orderTrend?.orders ?? []
        if (labels.length === 7 && orders.length === 7) {
          // 将 30 日访客总数粗略平摊到 7 日趋势中，便于管理员通过后台「访问量」字段直接控制曲线高度
          const visits30d = Math.max(0, Math.round(nextVisitsTotal))
          const visits7d = Math.max(0, Math.round((visits30d / 30) * 7))
          const visitsPerDay = visits7d > 0 ? Math.max(0, Math.round((visits7d / 7) * 10) / 10) : 0
          nextChart = labels.map((name, idx) => ({
            name,
            评分: nextGoodRate / 20,
            访客: visitsPerDay,
            订单: orders[idx] ?? 0,
          }))
        }

        setProductCount(nextProductCount)
        setTotalSales(nextTotalSales)
        setOrderCount(nextOrderCount)
        setTotalProfit(nextTotalProfit)
        setPendingOrdersCount(nextPendingOrders)
        setUnsettledAmount(nextUnsettledAmount)
        setCreditScore(nextCreditScore)
        setFollowers(nextFollowers)
        setGoodRate(nextGoodRate)
        setVisitsTotal(nextVisitsTotal)
        setTodayOrders(nextTodayOrders)
        setTodaySales(nextTodaySales)
        setTodayProfit(nextTodayProfit)
        setChartData(nextChart)

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({
                productCount: nextProductCount,
                totalSales: nextTotalSales,
                orderCount: nextOrderCount,
                totalProfit: nextTotalProfit,
                pendingOrders: nextPendingOrders,
                unsettledAmount: nextUnsettledAmount,
                creditScore: nextCreditScore,
                goodRate: nextGoodRate,
                followers: nextFollowers,
                visitsTotal: nextVisitsTotal,
                todayOrders: nextTodayOrders,
                todaySales: nextTodaySales,
                todayProfit: nextTodayProfit,
                chartData: nextChart,
              }),
            )
          }
        } catch {
          // ignore cache write errors
        }
      } catch {
        // 保持默认 0，不打断页面
      }
    }

    fetchDashboard()

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchDashboard()
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
    const timer = window.setInterval(fetchDashboard, 5000)
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  const heroTitle = lang === 'zh' ? '今日店铺概况' : 'Today at a glance'
  const heroSubtitle =
    lang === 'zh'
      ? '一眼看到小店的总体表现'
      : 'At‑a‑glance view of your shop health'

  // 将后台可编辑的「访问量」字段解释为最近 30 日总访客数，便于管理员在店铺管理里随时调整
  const visits30d = Math.max(0, Math.round(visitsTotal))
  const visits7d = Math.max(0, Math.round((visits30d / 30) * 7))
  const visitsToday = Math.max(0, Math.round(visits30d / 30))

  const formatXAxisLabel = (value: string | number): string => {
    const v = String(value)
    const zhFromEn: Record<string, string> = {
      Mon: '周一',
      Tue: '周二',
      Wed: '周三',
      Thu: '周四',
      Fri: '周五',
      Sat: '周六',
      Sun: '周日',
    }
    const enFromZh: Record<string, string> = {
      周一: 'Mon',
      周二: 'Tue',
      周三: 'Wed',
      周四: 'Thu',
      周五: 'Fri',
      周六: 'Sat',
      周日: 'Sun',
    }

    if (lang === 'zh') {
      return zhFromEn[v] ?? v
    }
    return enFromZh[v] ?? v
  }

  return (
    <div className="merchant-dashboard">
      <section className="merchant-dashboard-hero">
        <div className="merchant-dashboard-hero-main">
          <h2 className="merchant-dashboard-hero-title">{heroTitle}</h2>
          <p className="merchant-dashboard-hero-subtitle">{heroSubtitle}</p>
          <div className="merchant-dashboard-hero-tags">
            <span className="merchant-dashboard-hero-tag">
              {lang === 'zh' ? '好评率' : 'Good rating'}：{goodRate.toFixed(1)}%
            </span>
            <span className="merchant-dashboard-hero-tag">
              {lang === 'zh' ? '信用分' : 'Credit score'}：{creditScore}
            </span>
            <span className="merchant-dashboard-hero-tag">
              {lang === 'zh' ? '店铺关注' : 'Followers'}：{followers}
            </span>
          </div>
        </div>
        <div className="merchant-dashboard-hero-side">
          <div className="merchant-dashboard-hero-pill">
            <span className="merchant-dashboard-hero-pill-label">
              {lang === 'zh' ? '今日销售额' : 'Today\'s sales'}
            </span>
            <span className="merchant-dashboard-hero-pill-value">
              ${todaySales.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      <section className="merchant-dashboard-stats">
        <div className="merchant-dashboard-stat">
          <span className="merchant-dashboard-stat-value">{productCount}</span>
          <span className="merchant-dashboard-stat-label">
            {lang === 'zh' ? '商品总数' : 'Total products'}
          </span>
        </div>
        <div className="merchant-dashboard-stat-divider" aria-hidden="true" />
        <div className="merchant-dashboard-stat">
          <span className="merchant-dashboard-stat-value">${totalSales.toFixed(2)}</span>
          <span className="merchant-dashboard-stat-label">
            {lang === 'zh' ? '销售总额' : 'Total sales'}
          </span>
        </div>
        <div className="merchant-dashboard-stat-divider" aria-hidden="true" />
        <div className="merchant-dashboard-stat">
          <span className="merchant-dashboard-stat-value">{orderCount}</span>
          <span className="merchant-dashboard-stat-label">
            {lang === 'zh' ? '总订单' : 'Total orders'}
          </span>
        </div>
        <div className="merchant-dashboard-stat-divider" aria-hidden="true" />
        <div className="merchant-dashboard-stat">
          <span className="merchant-dashboard-stat-value">${totalProfit.toFixed(2)}</span>
          <span className="merchant-dashboard-stat-label">
            {lang === 'zh' ? '总利润' : 'Total profit'}
          </span>
        </div>
        <div className="merchant-dashboard-stat-divider" aria-hidden="true" />
        <div className="merchant-dashboard-stat merchant-dashboard-stat--pending">
          <span className="merchant-dashboard-stat-value">{pendingOrdersCount}</span>
          <span className="merchant-dashboard-stat-label">
            {lang === 'zh' ? '待处理订单' : 'Pending orders'}
          </span>
          {pendingOrdersCount > 0 && (
            <button
              type="button"
              className="merchant-dashboard-stat-btn"
              onClick={() => navigate('/merchant/orders')}
            >
              {lang === 'zh' ? '立即处理' : 'View orders'}
            </button>
          )}
        </div>
        <div className="merchant-dashboard-stat-divider" aria-hidden="true" />
        <div className="merchant-dashboard-stat">
          <span className="merchant-dashboard-stat-value">${unsettledAmount.toFixed(2)}</span>
          <span className="merchant-dashboard-stat-label">
            {lang === 'zh' ? '待结算金额' : 'Unsettled amount'}
          </span>
        </div>
      </section>

      <section className="merchant-dashboard-overviews">
        <div className="merchant-dashboard-overview-card">
          <h3 className="merchant-dashboard-overview-title">
            {lang === 'zh' ? '店铺概况' : 'Shop overview'}
          </h3>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">
              {goodRate.toFixed(1)}%
            </span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '好评率' : 'Good rating'}
            </span>
          </div>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">{creditScore}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '卖家信用分' : 'Seller credit score'}
              <span
                className="merchant-dashboard-overview-info"
                title={lang === 'zh' ? '信用分说明' : 'About credit score'}
              >
                ⓘ
              </span>
            </span>
          </div>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">{followers}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '店铺关注' : 'Followers'}
            </span>
          </div>
        </div>
        <div className="merchant-dashboard-overview-card">
          <h3 className="merchant-dashboard-overview-title">
            {lang === 'zh' ? '流量概况' : 'Traffic overview'}
          </h3>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">{visitsToday}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '今日访客数' : "Today's visitors"}
            </span>
          </div>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">{visits7d}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '7日访客数' : '7‑day visitors'}
            </span>
          </div>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">{visits30d}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '30日访客数' : '30‑day visitors'}
            </span>
          </div>
        </div>
        <div className="merchant-dashboard-overview-card">
          <h3 className="merchant-dashboard-overview-title">
            {lang === 'zh' ? '今日概况' : "Today's overview"}
          </h3>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">{todayOrders}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '今日订单' : "Today's orders"}
            </span>
          </div>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">${todaySales.toFixed(2)}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '今日销售额' : "Today's sales"}
            </span>
          </div>
          <div className="merchant-dashboard-overview-row">
            <span className="merchant-dashboard-overview-value">${todayProfit.toFixed(2)}</span>
            <span className="merchant-dashboard-overview-label">
              {lang === 'zh' ? '预计利润' : 'Expected profit'}
            </span>
          </div>
        </div>
      </section>

      <MerchantDashboardCharts
        chartData={chartData}
        activeChart={activeChart}
        setActiveChart={setActiveChart}
        formatXAxisLabel={formatXAxisLabel}
        lang={lang}
      />

      <div
        className="merchant-dashboard-fab merchant-dashboard-fab--chat"
        aria-label={lang === 'zh' ? '客服' : 'Customer service'}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
      <div
        className="merchant-dashboard-fab merchant-dashboard-fab--feedback"
        aria-label={lang === 'zh' ? '反馈' : 'Feedback'}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    </div>
  )
}

export default MerchantDashboard
