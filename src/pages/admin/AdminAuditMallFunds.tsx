import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../components/ToastProvider'
import { formatDateTime } from '../../utils/datetime'

type FundType = 'recharge' | 'withdraw'
type FundStatus = 'pending' | 'approved' | 'rejected'

interface PendingMallFund {
  id: string
  orderNo: string
  userId: string
  loginAccount: string
  type: FundType
  amount: number
  applyTime: string
  rechargeTxNo?: string | null
  rechargeScreenshotUrl?: string | null
  withdrawAddress?: string | null
  status: FundStatus
}

const AdminAuditMallFunds: React.FC = () => {
  const [rechargeList, setRechargeList] = useState<PendingMallFund[]>([])
  const [withdrawList, setWithdrawList] = useState<PendingMallFund[]>([])
  const [rechargePage, setRechargePage] = useState(1)
  const [withdrawPage, setWithdrawPage] = useState(1)
  const [rechargeTotal, setRechargeTotal] = useState(0)
  const [withdrawTotal, setWithdrawTotal] = useState(0)
  const [rechargeSearchInput, setRechargeSearchInput] = useState('')
  const [withdrawSearchInput, setWithdrawSearchInput] = useState('')
  const [rechargeKeyword, setRechargeKeyword] = useState('')
  const [withdrawKeyword, setWithdrawKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<FundType>('recharge')
  const { showToast } = useToast()

  useEffect(() => {
    if (activeTab !== 'recharge') return
    let cancelled = false

    const fetchRecharge = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('type', 'recharge')
        params.set('page', String(rechargePage))
        params.set('pageSize', '30')
        if (rechargeKeyword.trim()) params.set('q', rechargeKeyword.trim())
        const res = await api.get<{
          list: Array<{
            id: number
            userId: string
            type: string
            amount: number
            status: string
            createdAt: string
            orderNo?: string
            userAccount?: string | null
            rechargeTxNo?: string | null
            rechargeScreenshotUrl?: string | null
            withdrawAddress?: string | null
          }>
          total: number
        }>(`/api/audit/fund-applications?${params.toString()}`)
        if (cancelled) return
        const items = (res.list ?? []).map((row) => ({
          id: String(row.id),
          orderNo: row.orderNo ?? `RCH${row.id}`,
          userId: row.userId,
          loginAccount: row.userAccount ?? row.userId,
          type: (row.type === 'withdraw' ? 'withdraw' : 'recharge') as FundType,
          amount: Number(row.amount ?? 0),
          status:
            (row.status === 'approved' || row.status === 'rejected'
              ? row.status
              : 'pending') as FundStatus,
          applyTime: formatDateTime(row.createdAt),
          rechargeTxNo: row.rechargeTxNo ?? null,
          rechargeScreenshotUrl: row.rechargeScreenshotUrl ?? null,
          withdrawAddress: row.withdrawAddress ?? null,
        }))
        setRechargeList(items.filter((x) => x.type === 'recharge'))
        setRechargeTotal(res.total ?? items.length)
      } catch (e) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : '加载待审核列表失败', 'error')
          setRechargeList([])
          setRechargeTotal(0)
        }
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    // 先拉一次
    fetchRecharge(false)
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchRecharge(true)
    }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)
    // 每 5 秒自动刷新一次
    const timer = window.setInterval(() => fetchRecharge(true), 5000)

    return () => {
      cancelled = true
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [activeTab, rechargePage, rechargeKeyword, showToast])

  useEffect(() => {
    if (activeTab !== 'withdraw') return
    let cancelled = false

    const fetchWithdraw = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('type', 'withdraw')
        params.set('page', String(withdrawPage))
        params.set('pageSize', '30')
        if (withdrawKeyword.trim()) params.set('q', withdrawKeyword.trim())
        const res = await api.get<{
          list: Array<{
            id: number
            userId: string
            type: string
            amount: number
            status: string
            createdAt: string
            orderNo?: string
            userAccount?: string | null
            rechargeTxNo?: string | null
            withdrawAddress?: string | null
          }>
          total: number
        }>(`/api/audit/fund-applications?${params.toString()}`)
        if (cancelled) return
        const items = (res.list ?? []).map((row) => ({
          id: String(row.id),
          orderNo: row.orderNo ?? `WD${row.id}`,
          userId: row.userId,
          loginAccount: row.userAccount ?? row.userId,
          type: (row.type === 'withdraw' ? 'withdraw' : 'recharge') as FundType,
          amount: Number(row.amount ?? 0),
          status:
            (row.status === 'approved' || row.status === 'rejected'
              ? row.status
              : 'pending') as FundStatus,
          applyTime: formatDateTime(row.createdAt),
          rechargeTxNo: row.rechargeTxNo ?? null,
          withdrawAddress: row.withdrawAddress ?? null,
        }))
        setWithdrawList(items.filter((x) => x.type === 'withdraw'))
        setWithdrawTotal(res.total ?? items.length)
      } catch (e) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : '加载待审核列表失败', 'error')
          setWithdrawList([])
          setWithdrawTotal(0)
        }
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    fetchWithdraw(false)
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchWithdraw(true)
    }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => fetchWithdraw(true), 5000)

    return () => {
      cancelled = true
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [activeTab, withdrawPage, withdrawKeyword, showToast])

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/api/audit/fund-applications/${encodeURIComponent(id)}/approve`, {})
      if (activeTab === 'recharge') {
        setRechargeList((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x))
        )
      } else {
        setWithdrawList((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x))
        )
      }
      showToast('已通过')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 'error')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const remark = window.prompt('请输入拒绝原因（可选）：') ?? ''
      await api.post(
        `/api/audit/fund-applications/${encodeURIComponent(id)}/reject`,
        remark ? { remark } : {}
      )
      if (activeTab === 'recharge') {
        setRechargeList((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x))
        )
      } else {
        setWithdrawList((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x))
        )
      }
      showToast('已拒绝')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 'error')
    }
  }

  const rechargeTotalPages = Math.max(1, Math.ceil(rechargeTotal / 30))
  const withdrawTotalPages = Math.max(1, Math.ceil(withdrawTotal / 30))
  const pendingRechargeCount = rechargeList.filter((item) => item.status === 'pending').length
  const pendingWithdrawCount = withdrawList.filter((item) => item.status === 'pending').length

  return (
    <div className="admin-audit-page">
      <header className="admin-audit-header">
        <h2 className="admin-audit-title">商城资金审核</h2>
        <p className="admin-audit-desc">分别审核商城用户的充值申请与提现申请，所有数据来自真实数据库。</p>
        <div className="admin-audit-tabs">
          <button
            type="button"
            className={`admin-audit-tab${activeTab === 'recharge' ? ' admin-audit-tab--active' : ''}`}
            onClick={() => setActiveTab('recharge')}
          >
            充值审核
            <span className="admin-audit-tab-count">{pendingRechargeCount}</span>
          </button>
          <button
            type="button"
            className={`admin-audit-tab${activeTab === 'withdraw' ? ' admin-audit-tab--active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            提现审核
            <span className="admin-audit-tab-count">{pendingWithdrawCount}</span>
          </button>
        </div>
      </header>

      <section className="admin-audit-table-wrap">
        {activeTab === 'recharge' ? (
          <table className="admin-audit-table">
            <caption className="admin-audit-caption">
              <div className="admin-audit-search">
                <input
                  type="text"
                  className="admin-audit-search-input"
                  placeholder="按交易 ID / 用户账号 / 交易号 搜索"
                  value={rechargeSearchInput}
                  onChange={(e) => setRechargeSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setRechargeKeyword(rechargeSearchInput.trim())
                      setRechargePage(1)
                    }
                  }}
                />
                <button
                  type="button"
                  className="admin-audit-search-btn"
                  onClick={() => {
                    setRechargeKeyword(rechargeSearchInput.trim())
                    setRechargePage(1)
                  }}
                >
                  搜索
                </button>
              </div>
            </caption>
            <thead>
              <tr>
                <th>交易 ID</th>
                <th>用户账号</th>
                <th>充值金额（USDT）</th>
                <th>充值地址</th>
                <th>状态</th>
                <th>交易截图</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="admin-audit-empty">加载中…</td>
                </tr>
              ) : rechargeList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-audit-empty">暂无待审核的充值申请</td>
                </tr>
              ) : (
                rechargeList.map((row) => (
                  <tr key={row.id}>
                    <td><code className="admin-audit-id">{row.orderNo}</code></td>
                    <td>{row.loginAccount}</td>
                    <td className="admin-audit-amount">{row.amount.toFixed(2)}</td>
                    <td className="admin-audit-address">1231231231231</td>
                    <td>
                      <span
                        className={`admin-audit-status admin-audit-status--${row.status}`}
                      >
                        {row.status === 'approved'
                          ? '已通过'
                          : row.status === 'rejected'
                            ? '已拒绝'
                            : '待审核'}
                      </span>
                    </td>
                    <td className="admin-audit-screenshot-cell">
                      {row.rechargeScreenshotUrl ? (
                        <a href={row.rechargeScreenshotUrl} target="_blank" rel="noopener noreferrer" className="admin-audit-screenshot-link" title="查看大图">
                          <img src={row.rechargeScreenshotUrl} alt="" className="admin-audit-screenshot-thumb" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{row.applyTime}</td>
                    <td>
                      {row.status === 'pending' ? (
                        <div className="admin-audit-row-actions">
                          <button
                            type="button"
                            className="admin-audit-btn admin-audit-btn--pass"
                            onClick={() => handleApprove(row.id)}
                          >
                            通过
                          </button>
                          <button
                            type="button"
                            className="admin-audit-btn admin-audit-btn--reject"
                            onClick={() => handleReject(row.id)}
                          >
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <span className="admin-audit-actions-placeholder">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="admin-audit-pagination-cell">
                  <div className="admin-audit-pagination">
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={rechargePage <= 1 || loading}
                      onClick={() => setRechargePage((p) => Math.max(1, p - 1))}
                    >
                      上一页
                    </button>
                    <span className="admin-audit-page-info">
                      第 {rechargePage} / {rechargeTotalPages} 页，共 {rechargeTotal} 条
                    </span>
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={rechargePage >= rechargeTotalPages || loading}
                      onClick={() => setRechargePage((p) => Math.min(rechargeTotalPages, p + 1))}
                    >
                      下一页
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <table className="admin-audit-table">
            <caption className="admin-audit-caption">
              <div className="admin-audit-search">
                <input
                  type="text"
                  className="admin-audit-search-input"
                  placeholder="按交易 ID / 用户账号 / 提现地址 搜索"
                  value={withdrawSearchInput}
                  onChange={(e) => setWithdrawSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setWithdrawKeyword(withdrawSearchInput.trim())
                      setWithdrawPage(1)
                    }
                  }}
                />
                <button
                  type="button"
                  className="admin-audit-search-btn"
                  onClick={() => {
                    setWithdrawKeyword(withdrawSearchInput.trim())
                    setWithdrawPage(1)
                  }}
                >
                  搜索
                </button>
              </div>
            </caption>
            <thead>
              <tr>
                <th>交易 ID</th>
                <th>用户账号</th>
                <th>提现金额（USDT）</th>
                <th>状态</th>
                <th>提现地址</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="admin-audit-empty">加载中…</td>
                </tr>
              ) : withdrawList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-audit-empty">暂无待审核的提现申请</td>
                </tr>
              ) : (
                withdrawList.map((row) => (
                  <tr key={row.id}>
                    <td><code className="admin-audit-id">{row.orderNo}</code></td>
                    <td>{row.loginAccount}</td>
                    <td className="admin-audit-amount">{row.amount.toFixed(2)}</td>
                    <td>
                      <span
                        className={`admin-audit-status admin-audit-status--${row.status}`}
                      >
                        {row.status === 'approved'
                          ? '已通过'
                          : row.status === 'rejected'
                            ? '已拒绝'
                            : '待审核'}
                      </span>
                    </td>
                    <td className="admin-audit-address">{row.withdrawAddress || '—'}</td>
                    <td>{row.applyTime}</td>
                    <td>
                      {row.status === 'pending' ? (
                        <div className="admin-audit-row-actions">
                          <button
                            type="button"
                            className="admin-audit-btn admin-audit-btn--pass"
                            onClick={() => handleApprove(row.id)}
                          >
                            通过
                          </button>
                          <button
                            type="button"
                            className="admin-audit-btn admin-audit-btn--reject"
                            onClick={() => handleReject(row.id)}
                          >
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <span className="admin-audit-actions-placeholder">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="admin-audit-pagination-cell">
                  <div className="admin-audit-pagination">
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={withdrawPage <= 1 || loading}
                      onClick={() => setWithdrawPage((p) => Math.max(1, p - 1))}
                    >
                      上一页
                    </button>
                    <span className="admin-audit-page-info">
                      第 {withdrawPage} / {withdrawTotalPages} 页，共 {withdrawTotal} 条
                    </span>
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={withdrawPage >= withdrawTotalPages || loading}
                      onClick={() => setWithdrawPage((p) => Math.min(withdrawTotalPages, p + 1))}
                    >
                      下一页
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  )
}

export default AdminAuditMallFunds
