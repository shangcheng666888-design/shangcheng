import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../components/ToastProvider'
import { formatDateTime } from '../../utils/datetime'

type FundType = 'recharge' | 'withdraw'
type FundStatus = 'pending' | 'approved' | 'rejected'

interface PendingShopFund {
  id: string
  orderNo: string
  shopId: string
  shopName: string
  ownerAccount: string
  type: FundType
  amount: number
  applyTime: string
  status: FundStatus
  rechargeTxNo?: string | null
  withdrawAddress?: string | null
}

const PAGE_SIZE = 30

const AdminAuditShopFunds: React.FC = () => {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<FundType>('recharge')

  const [rechargeList, setRechargeList] = useState<PendingShopFund[]>([])
  const [withdrawList, setWithdrawList] = useState<PendingShopFund[]>([])
  const [rechargeTotal, setRechargeTotal] = useState(0)
  const [withdrawTotal, setWithdrawTotal] = useState(0)
  const [rechargePage, setRechargePage] = useState(1)
  const [withdrawPage, setWithdrawPage] = useState(1)

  const [_rechargeSearchInput, _setRechargeSearchInput] = useState('')
  const [_withdrawSearchInput, _setWithdrawSearchInput] = useState('')
  const [rechargeKeyword, _setRechargeKeyword] = useState('')
  const [withdrawKeyword, _setWithdrawKeyword] = useState('')

  const [loading, setLoading] = useState(false)
  const [platformDepositAddress, setPlatformDepositAddress] = useState('')

  useEffect(() => {
    api.get<{ receiveAddress: string }>('/api/admin/platform-payment-config').then((data) => {
      setPlatformDepositAddress(data.receiveAddress ?? '')
    }).catch(() => {})
  }, [])

  const formatApplyTime = (iso: string) => formatDateTime(iso)

  useEffect(() => {
    if (activeTab !== 'recharge') return
    let cancelled = false

    const fetchRecharge = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('type', 'recharge')
        params.set('page', String(rechargePage))
        params.set('pageSize', String(PAGE_SIZE))
        if (rechargeKeyword.trim()) params.set('q', rechargeKeyword.trim())
        const res = await api.get<{
          list: Array<{
            id: number
            shopId: string
            shopName?: string | null
            ownerAccount?: string | null
            type: string
            amount: number
            status: string
            createdAt: string
            orderNo?: string
            rechargeTxNo?: string | null
            withdrawAddress?: string | null
          }>
          total: number
        }>(`/api/audit/shop-fund-applications?${params.toString()}`)
        if (cancelled) return
        const items: PendingShopFund[] = (res.list ?? []).map((row) => ({
          id: String(row.id),
          orderNo: row.orderNo ?? `SRCH${String(row.id).padStart(8, '0')}`,
          shopId: row.shopId,
          shopName: row.shopName ?? row.shopId,
          ownerAccount: row.ownerAccount ?? '—',
          type: 'recharge',
          amount: Number(row.amount ?? 0),
          status:
            (row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending') as FundStatus,
          applyTime: formatApplyTime(row.createdAt),
          rechargeTxNo: row.rechargeTxNo ?? null,
          withdrawAddress: row.withdrawAddress ?? null,
        }))
        setRechargeList(items)
        setRechargeTotal(res.total ?? items.length)
      } catch (e) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : '加载店铺充值记录失败', 'error')
          setRechargeList([])
          setRechargeTotal(0)
        }
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    fetchRecharge(false)
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchRecharge(true)
    }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)
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
        params.set('pageSize', String(PAGE_SIZE))
        if (withdrawKeyword.trim()) params.set('q', withdrawKeyword.trim())
        const res = await api.get<{
          list: Array<{
            id: number
            shopId: string
            shopName?: string | null
            ownerAccount?: string | null
            type: string
            amount: number
            status: string
            createdAt: string
            orderNo?: string
            rechargeTxNo?: string | null
            withdrawAddress?: string | null
          }>
          total: number
        }>(`/api/audit/shop-fund-applications?${params.toString()}`)
        if (cancelled) return
        const items: PendingShopFund[] = (res.list ?? []).map((row) => ({
          id: String(row.id),
          orderNo: row.orderNo ?? `SWD${String(row.id).padStart(8, '0')}`,
          shopId: row.shopId,
          shopName: row.shopName ?? row.shopId,
          ownerAccount: row.ownerAccount ?? '—',
          type: 'withdraw',
          amount: Number(row.amount ?? 0),
          status:
            (row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending') as FundStatus,
          applyTime: formatApplyTime(row.createdAt),
          rechargeTxNo: row.rechargeTxNo ?? null,
          withdrawAddress: row.withdrawAddress ?? null,
        }))
        setWithdrawList(items)
        setWithdrawTotal(res.total ?? items.length)
      } catch (e) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : '加载店铺提现记录失败', 'error')
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
      await api.post(`/api/audit/shop-fund-applications/${encodeURIComponent(id)}/approve`, {})
      if (activeTab === 'recharge') {
        setRechargeList((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)))
      } else {
        setWithdrawList((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)))
      }
      showToast('已通过')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 'error')
    }
  }

  const handleReject = async (id: string) => {
    const remark = window.prompt('拒绝原因（可选）') ?? undefined
    try {
      await api.post(`/api/audit/shop-fund-applications/${encodeURIComponent(id)}/reject`, { remark })
      if (activeTab === 'recharge') {
        setRechargeList((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x)))
      } else {
        setWithdrawList((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x)))
      }
      showToast('已拒绝')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 'error')
    }
  }

  const rechargeTotalPages = Math.max(1, Math.ceil(rechargeTotal / PAGE_SIZE))
  const withdrawTotalPages = Math.max(1, Math.ceil(withdrawTotal / PAGE_SIZE))
  const pendingRechargeCount = rechargeList.filter((x) => x.status === 'pending').length
  const pendingWithdrawCount = withdrawList.filter((x) => x.status === 'pending').length

  return (
    <div className="admin-audit-page">
      <header className="admin-audit-header">
        <h2 className="admin-audit-title">店铺资金审核</h2>
        <p className="admin-audit-desc">店铺充值/提现申请审核。支持搜索、分页与无感实时更新。</p>
      </header>

      <div className="admin-audit-tabs" role="tablist" aria-label="店铺资金审核切换">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recharge'}
          className={`admin-audit-tab${activeTab === 'recharge' ? ' admin-audit-tab--active' : ''}`}
          onClick={() => setActiveTab('recharge')}
        >
          充值审核 <span className="admin-audit-tab-count">{pendingRechargeCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'withdraw'}
          className={`admin-audit-tab${activeTab === 'withdraw' ? ' admin-audit-tab--active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          提现审核 <span className="admin-audit-tab-count">{pendingWithdrawCount}</span>
        </button>
      </div>

      <section className="admin-audit-table-wrap">
        {activeTab === 'recharge' ? (
          <table className="admin-audit-table">
            <thead>
              <tr>
                <th>交易 ID</th>
                <th>店铺</th>
                <th>店主账号</th>
                <th>充值金额（USDT）</th>
                <th>充值地址</th>
                <th>状态</th>
                <th>交易号</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="admin-audit-empty">
                    加载中…
                  </td>
                </tr>
              ) : rechargeList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-audit-empty">
                    暂无数据
                  </td>
                </tr>
              ) : (
                rechargeList.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-audit-id">{row.orderNo}</code>
                    </td>
                    <td>
                      {row.shopName}（{row.shopId}）
                    </td>
                    <td>{row.ownerAccount || '—'}</td>
                    <td className="admin-audit-amount">{row.amount.toFixed(2)}</td>
                    <td>
                      <code className="admin-audit-id">{platformDepositAddress || '—'}</code>
                    </td>
                    <td>
                      <span className={`admin-audit-status admin-audit-status--${row.status}`}>
                        {row.status === 'approved'
                          ? '已通过'
                          : row.status === 'rejected'
                          ? '已拒绝'
                          : '待审核'}
                      </span>
                    </td>
                    <td>{row.rechargeTxNo && row.rechargeTxNo.trim() ? row.rechargeTxNo : '—'}</td>
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
              <tr>
                <td colSpan={9} className="admin-audit-pagination-cell">
                  <div className="admin-audit-pagination">
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={rechargePage <= 1}
                      onClick={() => setRechargePage((p) => Math.max(1, p - 1))}
                    >
                      上一页
                    </button>
                    <span className="admin-audit-page-info">
                      第 {rechargePage} / {rechargeTotalPages} 页
                    </span>
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={rechargePage >= rechargeTotalPages}
                      onClick={() => setRechargePage((p) => Math.min(rechargeTotalPages, p + 1))}
                    >
                      下一页
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="admin-audit-table">
            <thead>
              <tr>
                <th>交易 ID</th>
                <th>店铺</th>
                <th>店主账号</th>
                <th>提现金额（USDT）</th>
                <th>提现地址</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="admin-audit-empty">
                    加载中…
                  </td>
                </tr>
              ) : withdrawList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-audit-empty">
                    暂无数据
                  </td>
                </tr>
              ) : (
                withdrawList.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-audit-id">{row.orderNo}</code>
                    </td>
                    <td>
                      {row.shopName}（{row.shopId}）
                    </td>
                    <td>{row.ownerAccount || '—'}</td>
                    <td className="admin-audit-amount">{row.amount.toFixed(2)}</td>
                    <td>{row.withdrawAddress && row.withdrawAddress.trim() ? row.withdrawAddress : '—'}</td>
                    <td>
                      <span className={`admin-audit-status admin-audit-status--${row.status}`}>
                        {row.status === 'approved'
                          ? '已通过'
                          : row.status === 'rejected'
                          ? '已拒绝'
                          : '待审核'}
                      </span>
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
              <tr>
                <td colSpan={8} className="admin-audit-pagination-cell">
                  <div className="admin-audit-pagination">
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={withdrawPage <= 1}
                      onClick={() => setWithdrawPage((p) => Math.max(1, p - 1))}
                    >
                      上一页
                    </button>
                    <span className="admin-audit-page-info">
                      第 {withdrawPage} / {withdrawTotalPages} 页
                    </span>
                    <button
                      type="button"
                      className="admin-audit-page-btn"
                      disabled={withdrawPage >= withdrawTotalPages}
                      onClick={() => setWithdrawPage((p) => Math.min(withdrawTotalPages, p + 1))}
                    >
                      下一页
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default AdminAuditShopFunds
