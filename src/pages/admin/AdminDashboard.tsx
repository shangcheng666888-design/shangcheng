import React, { useState, useEffect, useCallback } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { api } from '../../api/client'

interface DashboardStats {
  userCount: number
  shopCount: number
  productCount: number
  orderCount: number
  todayOrders: number
  robotCount: number
}

interface DashboardResponse {
  stats: DashboardStats
  orderTrend: Array<{ name: string; 订单: number; 销售额: number }>
  visitTrend: Array<{ name: string; 访客: number }>
  todayOverview: {
    newUsersToday: number
    newShopsToday: number
    pendingAuditShops: number
    pendingTickets: number
  }
  systemStatus: {
    api: string
    database: string
    robots: number
  }
}

const STAT_LABELS: Array<keyof DashboardStats> = [
  'userCount',
  'shopCount',
  'productCount',
  'orderCount',
  'todayOrders',
  'robotCount',
]
const STAT_DISPLAY: Record<keyof DashboardStats, { label: string; unit: string }> = {
  userCount: { label: '商城用户', unit: '' },
  shopCount: { label: '入驻店铺', unit: '' },
  productCount: { label: '在售商品', unit: '' },
  orderCount: { label: '订单总数', unit: '' },
  todayOrders: { label: '今日订单', unit: '' },
  robotCount: { label: '机器人节点', unit: ' 台' },
}

const defaultStats: DashboardStats = {
  userCount: 0,
  shopCount: 0,
  productCount: 0,
  orderCount: 0,
  todayOrders: 0,
  robotCount: 0,
}
const defaultOrderTrend = [
  { name: '周一', 订单: 0, 销售额: 0 },
  { name: '周二', 订单: 0, 销售额: 0 },
  { name: '周三', 订单: 0, 销售额: 0 },
  { name: '周四', 订单: 0, 销售额: 0 },
  { name: '周五', 订单: 0, 销售额: 0 },
  { name: '周六', 订单: 0, 销售额: 0 },
  { name: '周日', 订单: 0, 销售额: 0 },
]
const defaultVisitTrend = defaultOrderTrend.map(({ name }) => ({ name, 访客: 0 }))

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [orderTrend, setOrderTrend] = useState(defaultOrderTrend)
  const [visitTrend, setVisitTrend] = useState(defaultVisitTrend)
  const [todayOverview, setTodayOverview] = useState({
    newUsersToday: 0,
    newShopsToday: 0,
    pendingAuditShops: 0,
    pendingTickets: 0,
  })
  const [systemStatus, setSystemStatus] = useState({ api: '正常', database: '正常', robots: 0 })

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get<DashboardResponse>('/api/admin/dashboard')
      if (res.stats) {
        setStats(res.stats)
      }
      if (Array.isArray(res.orderTrend) && res.orderTrend.length > 0) {
        setOrderTrend(res.orderTrend)
      }
      if (Array.isArray(res.visitTrend) && res.visitTrend.length > 0) {
        setVisitTrend(res.visitTrend)
      }
      if (res.todayOverview) {
        setTodayOverview(res.todayOverview)
      }
      if (res.systemStatus) {
        setSystemStatus({
          api: res.systemStatus.api === 'ok' ? '正常' : String(res.systemStatus.api),
          database: res.systemStatus.database === 'ok' ? '正常' : String(res.systemStatus.database),
          robots: typeof res.systemStatus.robots === 'number' ? res.systemStatus.robots : 0,
        })
      }
    } catch {
      // keep previous state
    }
  }, [])

  useEffect(() => {
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
  }, [fetchDashboard])

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <h2 className="admin-dashboard-title">仪表盘</h2>
        <p className="admin-dashboard-desc">商城运营数据概览与核心指标</p>
      </header>

      <section className="admin-dashboard-stats">
        {STAT_LABELS.map((key) => (
          <div key={key} className="admin-dashboard-stat-card">
            <span className="admin-dashboard-stat-value">
              {key === 'userCount' || key === 'shopCount' || key === 'productCount'
                ? stats[key].toLocaleString()
                : key === 'orderCount' || key === 'todayOrders'
                  ? stats[key].toLocaleString()
                  : stats[key]}
              {STAT_DISPLAY[key].unit}
            </span>
            <span className="admin-dashboard-stat-label">{STAT_DISPLAY[key].label}</span>
          </div>
        ))}
      </section>

      <section className="admin-dashboard-charts">
        <div className="admin-dashboard-chart-card">
          <h3 className="admin-dashboard-chart-title">近 7 日订单与销售额</h3>
          <div className="admin-dashboard-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={orderTrend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#9ca3af" />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  labelStyle={{ color: '#111827' }}
                  formatter={(value: number | undefined, name?: string) => [name === '销售额' ? `$${Number(value).toLocaleString()}` : value, name === '销售额' ? '销售额' : '订单']}
                  labelFormatter={(label) => label}
                />
                <Area yAxisId="left" type="monotone" dataKey="订单" stroke="#111827" fill="#f3f4f6" strokeWidth={2} name="订单" />
                <Area yAxisId="right" type="monotone" dataKey="销售额" stroke="#374151" fill="rgba(55, 65, 81, 0.08)" strokeWidth={2} name="销售额" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-dashboard-chart-card">
          <h3 className="admin-dashboard-chart-title">近 7 日访客数</h3>
          <div className="admin-dashboard-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={visitTrend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  labelStyle={{ color: '#111827' }}
                  formatter={(value: number | undefined) => [Number(value).toLocaleString(), '访客']}
                />
                <Bar dataKey="访客" fill="#111827" radius={[4, 4, 0, 0]} name="访客" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-overview">
        <div className="admin-dashboard-overview-card">
          <h3 className="admin-dashboard-overview-title">今日概况</h3>
          <ul className="admin-dashboard-overview-list">
            <li><span className="admin-dashboard-overview-label">新增用户</span><span className="admin-dashboard-overview-value">{todayOverview.newUsersToday}</span></li>
            <li><span className="admin-dashboard-overview-label">新增店铺</span><span className="admin-dashboard-overview-value">{todayOverview.newShopsToday}</span></li>
            <li><span className="admin-dashboard-overview-label">待审核店铺</span><span className="admin-dashboard-overview-value">{todayOverview.pendingAuditShops}</span></li>
            <li><span className="admin-dashboard-overview-label">待处理工单</span><span className="admin-dashboard-overview-value">{todayOverview.pendingTickets}</span></li>
          </ul>
        </div>
        <div className="admin-dashboard-overview-card">
          <h3 className="admin-dashboard-overview-title">系统状态</h3>
          <ul className="admin-dashboard-overview-list">
            <li><span className="admin-dashboard-overview-label">API 服务</span><span className="admin-dashboard-overview-value admin-dashboard-overview-value--ok">{systemStatus.api}</span></li>
            <li><span className="admin-dashboard-overview-label">数据库</span><span className="admin-dashboard-overview-value admin-dashboard-overview-value--ok">{systemStatus.database}</span></li>
            <li><span className="admin-dashboard-overview-label">机器人集群</span><span className="admin-dashboard-overview-value admin-dashboard-overview-value--ok">{systemStatus.robots} 台</span></li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
