import React, { useEffect, useState } from 'react'
import type { Lang } from '../context/LangContext'

export type ChartDataItem = { name: string; 评分: number; 访客: number; 订单: number }
type ActiveChart = 'shop' | 'traffic' | 'orders'

interface MerchantDashboardChartsProps {
  chartData: ChartDataItem[]
  activeChart: ActiveChart
  setActiveChart: (v: ActiveChart) => void
  formatXAxisLabel: (value: string | number) => string
  lang: Lang
}

const formatXAxisLabelDefault = (v: string | number) => String(v)

export const MerchantDashboardCharts: React.FC<MerchantDashboardChartsProps> = ({
  chartData,
  activeChart,
  setActiveChart,
  formatXAxisLabel = formatXAxisLabelDefault,
  lang,
}) => {
  const [Recharts, setRecharts] = useState<typeof import('recharts') | null>(null)

  useEffect(() => {
    import('recharts').then((m) => setRecharts(m))
  }, [])

  if (!Recharts) {
    return (
      <section className="merchant-dashboard-charts">
        <div className="merchant-dashboard-chart-switch">
          <span className="merchant-dashboard-chart-tab merchant-dashboard-chart-tab--active">
            {lang === 'zh' ? '店铺评分' : 'Shop score'}
          </span>
        </div>
        <div className="merchant-dashboard-chart-card merchant-dashboard-chart-card--active">
          <h3 className="merchant-dashboard-chart-title">
            {lang === 'zh' ? '店铺概况趋势' : 'Shop overview trend'}
          </h3>
          <div className="merchant-dashboard-chart-wrap merchant-dashboard-chart-skeleton" aria-hidden>
            <div className="merchant-dashboard-chart-skeleton-inner" />
          </div>
        </div>
      </section>
    )
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts

  return (
    <section className="merchant-dashboard-charts">
      <div className="merchant-dashboard-chart-switch">
        <button
          type="button"
          className={`merchant-dashboard-chart-tab${
            activeChart === 'shop' ? ' merchant-dashboard-chart-tab--active' : ''
          }`}
          onClick={() => setActiveChart('shop')}
        >
          {lang === 'zh' ? '店铺评分' : 'Shop score'}
        </button>
        <button
          type="button"
          className={`merchant-dashboard-chart-tab${
            activeChart === 'traffic' ? ' merchant-dashboard-chart-tab--active' : ''
          }`}
          onClick={() => setActiveChart('traffic')}
        >
          {lang === 'zh' ? '流量' : 'Traffic'}
        </button>
        <button
          type="button"
          className={`merchant-dashboard-chart-tab${
            activeChart === 'orders' ? ' merchant-dashboard-chart-tab--active' : ''
          }`}
          onClick={() => setActiveChart('orders')}
        >
          {lang === 'zh' ? '订单趋势' : 'Orders'}
        </button>
      </div>

      <div
        className={`merchant-dashboard-chart-card${
          activeChart === 'shop' ? ' merchant-dashboard-chart-card--active' : ''
        }`}
      >
        <h3 className="merchant-dashboard-chart-title">
          {lang === 'zh' ? '店铺概况趋势' : 'Shop overview trend'}
        </h3>
        <div className="merchant-dashboard-chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#9ca3af"
                tickFormatter={(value) => formatXAxisLabel(value)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                labelStyle={{ color: '#111827' }}
                labelFormatter={(value) => formatXAxisLabel(value)}
              />
              <Area type="monotone" dataKey="评分" stroke="#111827" fill="#f3f4f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
        className={`merchant-dashboard-chart-card${
          activeChart === 'traffic' ? ' merchant-dashboard-chart-card--active' : ''
        }`}
      >
        <h3 className="merchant-dashboard-chart-title">
          {lang === 'zh' ? '流量趋势' : 'Traffic trend'}
        </h3>
        <div className="merchant-dashboard-chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#9ca3af"
                tickFormatter={(value) => formatXAxisLabel(value)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                labelStyle={{ color: '#111827' }}
                labelFormatter={(value) => formatXAxisLabel(value)}
              />
              <Area type="monotone" dataKey="访客" stroke="#111827" fill="#f3f4f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
        className={`merchant-dashboard-chart-card${
          activeChart === 'orders' ? ' merchant-dashboard-chart-card--active' : ''
        }`}
      >
        <h3 className="merchant-dashboard-chart-title">
          {lang === 'zh' ? '订单趋势' : 'Order trend'}
        </h3>
        <div className="merchant-dashboard-chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#9ca3af"
                tickFormatter={(value) => formatXAxisLabel(value)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                labelStyle={{ color: '#111827' }}
                labelFormatter={(value) => formatXAxisLabel(value)}
              />
              <Area type="monotone" dataKey="订单" stroke="#111827" fill="#f3f4f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
