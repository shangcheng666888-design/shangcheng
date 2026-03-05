import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

type RangeKey = '7d' | '30d' | '90d'

interface FinanceRecord {
  id: string
  createdAt: string
  /** 原始资金类型：recharge | withdraw | consume | refund */
  rawType: 'recharge' | 'withdraw' | 'consume' | 'refund'
  /** UI 用：收入 / 支出 */
  displayType: '收入' | '支出'
  amount: number
  balanceAfter: number | null
  remark: string
}

const RANGE_TO_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

// 简单缓存不同时间范围的财务数据，避免在页面切换时白屏
const financeCache: Partial<Record<RangeKey, { records: FinanceRecord[]; income: number; expense: number }>> = {}

const MerchantFinance: React.FC = () => {
  const [range, setRange] = useState<RangeKey>('30d')
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [loading, setLoading] = useState(false)
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

    const fetchFinance = async () => {
      const auth = readAuth()
      if (!auth) {
        setError('未找到店铺信息，请重新登录商家后台')
        setRecords([])
        setTotalIncome(0)
        setTotalExpense(0)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const days = RANGE_TO_DAYS[range]
        const res = await api.get<{
          incomeTotal: number
          expenseTotal: number
          net: number
          days: number
          records: Array<{
            id: string
            type: 'recharge' | 'withdraw' | 'consume' | 'refund'
            amount: number
            balanceAfter: number | null
            remark: string
            orderNo: string
            createdAt: string
          }>
        }>(`/api/shops/${encodeURIComponent(auth.shopId)}/finance?days=${encodeURIComponent(String(days))}`)

        const income = Number(res.incomeTotal ?? 0)
        const expense = Number(res.expenseTotal ?? 0)
        setTotalIncome(income)
        setTotalExpense(expense)
        const list: FinanceRecord[] = (res.records ?? []).map((row) => {
          const amt = Number(row.amount ?? 0)
          const isIncome = amt >= 0
          let remark = row.remark || ''
          if (!remark && row.orderNo) {
            remark = `记录号：${row.orderNo}`
          }
          return {
            id: row.id,
            createdAt: row.createdAt,
            rawType: row.type,
            displayType: isIncome ? '收入' : '支出',
            amount: amt,
            balanceAfter: row.balanceAfter != null ? Number(row.balanceAfter) : null,
            remark,
          }
        })
        setRecords(list)
        financeCache[range] = { records: list, income, expense }
      } catch (e: any) {
        const msg: string =
          (e && typeof e.message === 'string' && e.message.trim()) || '加载财务报表失败'
        setError(msg)
        setRecords([])
        setTotalIncome(0)
        setTotalExpense(0)
      } finally {
        setLoading(false)
      }
    }

    // 若缓存中已有对应时间范围的数据，先用缓存渲染，再静默刷新
    const cached = financeCache[range]
    if (cached) {
      setRecords(cached.records)
      setTotalIncome(cached.income)
      setTotalExpense(cached.expense)
      fetchFinance()
    } else {
      fetchFinance()
    }
  }, [range])

  const balance = totalIncome - totalExpense

  return (
    <div className="merchant-finance-page">
      <header className="merchant-finance-header">
        <div className="merchant-finance-header-inner">
          <h1 className="merchant-finance-title">财务报表</h1>
          <p className="merchant-finance-subtitle">查看收入、支出与流水明细，掌握店铺经营状况</p>
        </div>
      </header>

      <section className="merchant-finance-cards">
        <div className="merchant-finance-card merchant-finance-card--income">
          <div className="merchant-finance-card-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </div>
          <div className="merchant-finance-card-content">
            <span className="merchant-finance-card-label">收入</span>
            <span className="merchant-finance-card-value merchant-finance-card-value--income">
              +${totalIncome.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="merchant-finance-card merchant-finance-card--expense">
          <div className="merchant-finance-card-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </div>
          <div className="merchant-finance-card-content">
            <span className="merchant-finance-card-label">支出</span>
            <span className="merchant-finance-card-value merchant-finance-card-value--expense">
              -${totalExpense.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="merchant-finance-card merchant-finance-card--balance">
          <div className="merchant-finance-card-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <div className="merchant-finance-card-content">
            <span className="merchant-finance-card-label">结余</span>
            <span className="merchant-finance-card-value">${balance.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <section className="merchant-finance-detail">
        <div className="merchant-finance-detail-head">
          <h2 className="merchant-finance-detail-title">流水明细</h2>
          <div className="merchant-finance-filters">
            {(['7d', '30d', '90d'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`merchant-finance-filter-btn${range === key ? ' merchant-finance-filter-btn--active' : ''}`}
                onClick={() => setRange(key)}
              >
                {key === '7d' ? '近7天' : key === '30d' ? '近30天' : '近90天'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="merchant-finance-error">{error}</div>}

        <div className="merchant-finance-table-wrap">
          <table className="merchant-finance-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>类型</th>
                <th>金额</th>
                <th>余额</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="merchant-finance-empty">加载中…</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="merchant-finance-empty">该时间范围内暂无资金流水</td>
                </tr>
              ) : (
                records.map((row) => {
                  const date = new Date(row.createdAt)
                  const dateStr = Number.isNaN(date.getTime())
                    ? row.createdAt
                    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
                        date.getDate(),
                      ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
                        date.getMinutes(),
                      ).padStart(2, '0')}`
                  const isIncome = row.amount >= 0
                  return (
                    <tr key={row.id}>
                      <td className="merchant-finance-cell-date">{dateStr}</td>
                      <td>
                        <span
                          className={`merchant-finance-type-badge merchant-finance-type-badge--${
                            isIncome ? 'income' : 'expense'
                          }`}
                        >
                          {row.displayType}
                        </span>
                      </td>
                      <td
                        className={
                          isIncome ? 'merchant-finance-amount--income' : 'merchant-finance-amount--expense'
                        }
                      >
                        {isIncome ? '+' : '-'}$
                        {Math.abs(row.amount).toFixed(2)}
                      </td>
                      <td className="merchant-finance-cell-balance">
                        {row.balanceAfter != null ? `$${row.balanceAfter.toFixed(2)}` : '—'}
                      </td>
                      <td className="merchant-finance-remark">{row.remark || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default MerchantFinance
