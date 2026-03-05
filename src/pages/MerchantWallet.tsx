import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import walletIcon from '../assets/qianbao.png'
import {
  formatRecordDate,
  STATUS_TEXT,
  type WalletRechargeRecord,
  type WalletWithdrawRecord,
} from '../utils/walletRecords'
import { useLang } from '../context/LangContext'

const MerchantWallet: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [walletHistoryTab, setWalletHistoryTab] = useState<'recharge' | 'withdraw'>('recharge')
  const [rechargeRecords, setRechargeRecords] = useState<WalletRechargeRecord[]>([])
  const [withdrawRecords, setWithdrawRecords] = useState<WalletWithdrawRecord[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [_platformDepositAddress, setPlatformDepositAddress] = useState('')

  useEffect(() => {
    let cancelled = false

    const readAuth = (): { userId: string; shopId: string } | null => {
      try {
        const raw = window.localStorage.getItem('authUser')
        if (!raw) return null
        const parsed = JSON.parse(raw) as { id?: string; shopId?: string }
        const userId = typeof parsed.id === 'string' ? parsed.id : ''
        const shopId = typeof parsed.shopId === 'string' ? parsed.shopId : ''
        if (!userId || !shopId) return null
        return { userId, shopId }
      } catch {
        return null
      }
    }

    const auth = readAuth()
    const cacheKey = auth ? `merchantWallet:${auth.shopId}` : null

    // 先尝试使用上一次成功加载的缓存，做到「秒开」
    if (cacheKey) {
      try {
        const raw = window.localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw) as {
            walletBalance?: number
            rechargeRecords?: WalletRechargeRecord[]
            withdrawRecords?: WalletWithdrawRecord[]
          }
          if (typeof cached.walletBalance === 'number') {
            setWalletBalance(cached.walletBalance)
          }
          if (Array.isArray(cached.rechargeRecords)) {
            setRechargeRecords(cached.rechargeRecords)
          }
          if (Array.isArray(cached.withdrawRecords)) {
            setWithdrawRecords(cached.withdrawRecords)
          }
        }
      } catch {
        // ignore cache error
      }
    }

    const fetchWallet = async () => {
      const currentAuth = auth ?? readAuth()
      if (!currentAuth) {
        if (!cancelled) {
          setWalletBalance(0)
          setRechargeRecords([])
          setWithdrawRecords([])
        }
        return
      }

      let depositAddr = ''
      try {
        const configRes = await api.get<{ receiveAddress: string }>('/api/platform-payment-config')
        depositAddr = configRes.receiveAddress ?? ''
        if (!cancelled) setPlatformDepositAddress(depositAddr)
      } catch {
        // use existing state or ''
      }

      try {
        const shopRes = await api.get<{
          list: Array<{ id: string; walletBalance?: number; name?: string }>
        }>(`/api/shops?shop=${encodeURIComponent(currentAuth.shopId)}`)
        const nextBalance = Number(shopRes.list?.[0]?.walletBalance ?? 0)
        if (!cancelled) {
          const safe = Number.isFinite(nextBalance) ? nextBalance : 0
          setWalletBalance(safe)
        }
      } catch {
        if (!cancelled) setWalletBalance(0)
      }

      try {
        const res = await api.get<{
          list: Array<{
            id: number
            orderNo?: string
            type: 'recharge' | 'withdraw'
            amount: number
            status: 'pending' | 'approved' | 'rejected'
            createdAt: string
            rechargeTxNo?: string | null
            rechargeScreenshotUrl?: string | null
            withdrawAddress?: string | null
          }>
        }>(
          `/api/shops/${encodeURIComponent(currentAuth.shopId)}/fund-applications?userId=${encodeURIComponent(currentAuth.userId)}&pageSize=100`,
        )

        if (cancelled) return
        const list = res.list ?? []
        const recharges: WalletRechargeRecord[] = list
          .filter((x) => x.type === 'recharge')
          .map((r) => ({
            id: String(r.id),
            createdAt: r.createdAt,
            orderNo: r.orderNo ?? `SRCH${String(r.id).padStart(8, '0')}`,
            amount: String(Number(r.amount ?? 0).toFixed(2)),
            currency: 'USDT',
            protocol: 'USDT-TRC20',
            status: r.status,
            transactionNo: r.rechargeTxNo ?? undefined,
            rechargeScreenshotUrl: r.rechargeScreenshotUrl ?? null,
            actualAmount: r.status === 'approved' ? String(Number(r.amount ?? 0).toFixed(2)) : '—',
            address: depositAddr || '—',
          }))
        const withdraws: WalletWithdrawRecord[] = list
          .filter((x) => x.type === 'withdraw')
          .map((w) => ({
            id: String(w.id),
            createdAt: w.createdAt,
            orderNo: w.orderNo ?? `SWD${String(w.id).padStart(8, '0')}`,
            amount: String(Number(w.amount ?? 0).toFixed(2)),
            currency: 'USDT',
            address: w.withdrawAddress ?? '—',
            status: w.status,
          }))
        setRechargeRecords(recharges)
        setWithdrawRecords(withdraws)

        if (cacheKey) {
          try {
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({
                walletBalance,
                rechargeRecords: recharges,
                withdrawRecords: withdraws,
              }),
            )
          } catch {
            // ignore cache write error
          }
        }
      } catch {
        if (!cancelled) {
          setRechargeRecords([])
          setWithdrawRecords([])
        }
      }
    }

    fetchWallet()

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchWallet()
    }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(fetchWallet, 5000)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  const goRecharge = () => navigate('/merchant/wallet/recharge')
  const goWithdraw = () => navigate('/merchant/wallet/withdraw')

  return (
    <div className="merchant-wallet-page">
      <section className="account-wallet">
        <div className="account-wallet-summary">
          <div className="account-wallet-balance-card">
            <div className="account-wallet-balance-left">
              <div className="account-wallet-balance-icon" aria-hidden="true">
                <img src={walletIcon} alt="" className="account-wallet-balance-icon-img" />
              </div>
                <div className="account-wallet-balance-text">
                  <div className="account-wallet-balance-label">
                    {lang === 'zh' ? '账户余额 (USDT)' : 'Account balance (USDT)'}
                  </div>
                <div className="account-wallet-balance-value">{walletBalance.toFixed(2)}</div>
              </div>
            </div>
            <div className="account-wallet-balance-actions">
              <button
                type="button"
                className="account-wallet-primary-btn"
                onClick={goRecharge}
              >
                {lang === 'zh' ? '充值' : 'Recharge'}
              </button>
              <button
                type="button"
                className="account-wallet-secondary-btn"
                onClick={goWithdraw}
              >
                {lang === 'zh' ? '提现' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>

        <div className="account-wallet-history">
            <div className="account-wallet-history-header">
              <div className="account-wallet-history-title">
                {lang === 'zh' ? '钱包历史' : 'Wallet history'}
              </div>
            <div className="account-wallet-history-tabs">
              <button
                type="button"
                className={`account-wallet-history-tab${walletHistoryTab === 'recharge' ? ' account-wallet-history-tab--active' : ''}`}
                onClick={() => setWalletHistoryTab('recharge')}
              >
                  {lang === 'zh' ? '充值' : 'Recharge'}
              </button>
              <button
                type="button"
                className={`account-wallet-history-tab${walletHistoryTab === 'withdraw' ? ' account-wallet-history-tab--active' : ''}`}
                onClick={() => setWalletHistoryTab('withdraw')}
              >
                  {lang === 'zh' ? '提现' : 'Withdraw'}
              </button>
            </div>
          </div>

          <div className="account-wallet-table-wrap">
            <div className="account-wallet-table">
              {walletHistoryTab === 'recharge' ? (
                <>
                  <div className="account-wallet-table-head">
                    <span>{lang === 'zh' ? '日期' : 'Date'}</span>
                    <span>{lang === 'zh' ? '订单号' : 'Order No.'}</span>
                    <span>{lang === 'zh' ? '充值金额' : 'Recharge amount'}</span>
                    <span>{lang === 'zh' ? '币种/协议' : 'Currency / protocol'}</span>
                    <span>{lang === 'zh' ? '订单状态' : 'Status'}</span>
                    <span>{lang === 'zh' ? '交易截图' : 'Screenshot'}</span>
                    <span>{lang === 'zh' ? '实际到账' : 'Received amount'}</span>
                    <span>{lang === 'zh' ? '充值地址' : 'Recharge address'}</span>
                  </div>
                  <div className="account-wallet-table-body">
                    {rechargeRecords.length === 0 ? (
                      <div className="account-wallet-table-body--empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                        <span className="account-empty-text">
                          {lang === 'zh' ? '暂无数据' : 'No data'}
                        </span>
                      </div>
                    ) : (
                      rechargeRecords.map((r) => (
                        <div key={r.id} className="account-wallet-table-row">
                          <span>{formatRecordDate(r.createdAt)}</span>
                          <span>{r.orderNo}</span>
                          <span>{r.amount}</span>
                          <span>{r.currency}/{r.protocol}</span>
                          <span>
                            {lang === 'zh'
                              ? (STATUS_TEXT[r.status] ?? r.status)
                              : ({
                                  pending: 'Pending',
                                  approved: 'Approved',
                                  rejected: 'Rejected',
                                  completed: 'Completed',
                                  failed: 'Failed',
                                }[r.status] ?? r.status)}
                          </span>
                          <span>
                            {r.rechargeScreenshotUrl ? (
                              <a href={r.rechargeScreenshotUrl} target="_blank" rel="noopener noreferrer" className="account-wallet-screenshot-link" title={lang === 'zh' ? '查看大图' : 'View'}>
                                <img src={r.rechargeScreenshotUrl} alt="" className="account-wallet-screenshot-thumb" />
                              </a>
                            ) : (
                              r.transactionNo ?? '—'
                            )}
                          </span>
                          <span>{r.actualAmount}</span>
                          <span>{r.address}</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="account-wallet-table-head account-wallet-table-head--withdraw">
                    <span>{lang === 'zh' ? '日期' : 'Date'}</span>
                    <span>{lang === 'zh' ? '订单号' : 'Order No.'}</span>
                    <span>{lang === 'zh' ? '提现金额' : 'Withdrawal amount'}</span>
                    <span>{lang === 'zh' ? '币种' : 'Currency'}</span>
                    <span>{lang === 'zh' ? '提现地址' : 'Withdrawal address'}</span>
                    <span>{lang === 'zh' ? '订单状态' : 'Status'}</span>
                  </div>
                  <div className="account-wallet-table-body">
                    {withdrawRecords.length === 0 ? (
                      <div className="account-wallet-table-body--empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                        <span className="account-empty-text">
                          {lang === 'zh' ? '暂无数据' : 'No data'}
                        </span>
                      </div>
                    ) : (
                      withdrawRecords.map((w) => (
                        <div key={w.id} className="account-wallet-table-row account-wallet-table-row--withdraw">
                          <span>{formatRecordDate(w.createdAt)}</span>
                          <span>{w.orderNo}</span>
                          <span>{w.amount}</span>
                          <span>{w.currency}</span>
                          <span>{w.address}</span>
                          <span>
                            {lang === 'zh'
                              ? (STATUS_TEXT[w.status] ?? w.status)
                              : ({
                                  pending: 'Pending',
                                  approved: 'Approved',
                                  rejected: 'Rejected',
                                  completed: 'Completed',
                                  failed: 'Failed',
                                }[w.status] ?? w.status)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MerchantWallet
