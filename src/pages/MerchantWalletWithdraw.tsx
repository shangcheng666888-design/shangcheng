import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import WalletPaymentBadges from '../components/WalletPaymentBadges'
import { useLang } from '../context/LangContext'

const MerchantWalletWithdraw: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const goBack = () => navigate('/merchant/wallet')

  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(0)
  const { showToast } = useToast()
  const [tradePwdModalOpen, setTradePwdModalOpen] = useState(false)
  const [tradePwd, setTradePwd] = useState('')

  React.useEffect(() => {
    let cancelled = false
    const fetchBalance = async () => {
      try {
        const raw = window.localStorage.getItem('authUser')
        if (!raw) return
        const auth = JSON.parse(raw) as { shopId?: string }
        const shopId = typeof auth.shopId === 'string' ? auth.shopId : ''
        if (!shopId) return
        const res = await api.get<{ list: Array<{ id: string; walletBalance?: number }> }>(
          `/api/shops?shop=${encodeURIComponent(shopId)}`
        )
        if (cancelled) return
        const next = Number(res.list?.[0]?.walletBalance ?? 0)
        setBalance(Number.isFinite(next) ? next : 0)
      } catch {
        if (!cancelled) setBalance(0)
      }
    }
    fetchBalance()
    const timer = window.setInterval(fetchBalance, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const amountNum = parseFloat(amount)
  const isAmountFilled = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0
  const submitDisabled = !address.trim() || !isAmountFilled
  const confirmPwdDisabled = tradePwd.length < 6

  const tradePwdChars = tradePwd.padEnd(6, ' ').slice(0, 6).split('')

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    const num = parseFloat(v)
    if (!Number.isNaN(num) && num > balance) {
      setAmount(balance === 0 ? '0' : balance.toFixed(2))
      return
    }
    setAmount(v)
  }

  const handleTradePwdChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const digit = raw.replace(/\D/g, '').slice(-1)
    setTradePwd((prev) => {
      const chars = prev.split('')
      chars[index] = digit
      return chars.join('').slice(0, 6)
    })
    if (digit && index < 5) {
      const next = e.target.nextElementSibling as HTMLInputElement | null
      next?.focus()
    }
  }

  const handleTradePwdKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace') return
    e.preventDefault()
    const currentHasValue = !!tradePwdChars[index]?.trim()
    if (currentHasValue) {
      setTradePwd((prev) => {
        const chars = prev.split('')
        chars[index] = ''
        return chars.join('').slice(0, 6)
      })
      return
    }
    if (index > 0) {
      setTradePwd((prev) => {
        const chars = prev.split('')
        chars[index - 1] = ''
        return chars.join('').slice(0, 6)
      })
      const prev = e.currentTarget.previousElementSibling as HTMLInputElement | null
      prev?.focus()
    }
  }

  return (
    <div className="merchant-wallet-form-page merchant-wallet-form-page--withdraw">
      <section className="wallet-withdraw merchant-wallet-withdraw-inner">
        <header className="wallet-recharge-header merchant-wallet-withdraw-header">
          <button
            type="button"
            className="wallet-recharge-back"
            aria-label={lang === 'zh' ? '返回' : 'Back'}
            onClick={goBack}
          >
            &lt;
          </button>
          <h1 className="wallet-recharge-title">
            {lang === 'zh' ? '我的钱包/提现' : 'My wallet / Withdraw'}
          </h1>
        </header>

        <div className="wallet-recharge-form merchant-wallet-withdraw-form">
          <div className="merchant-wallet-withdraw-grid">
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {lang === 'zh' ? '提现方式' : 'Withdrawal method'}
              </label>
              <div className="wallet-withdraw-method">
                {lang === 'zh' ? '加密货币' : 'Cryptocurrency'}
              </div>
            </div>
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {lang === 'zh' ? '币种协议' : 'Currency / protocol'}
              </label>
              <div className="wallet-recharge-select-wrap">
                <select className="wallet-recharge-select" defaultValue="USDT">
                  <option value="USDT">USDT</option>
                </select>
                <span className="wallet-recharge-select-caret" aria-hidden>▾</span>
              </div>
            </div>
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {lang === 'zh' ? '区块链网络' : 'Blockchain network'}
              </label>
              <button type="button" className="wallet-withdraw-network-btn">TRC20</button>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-balance-cell">
              <label className="wallet-recharge-label">
                {lang === 'zh' ? '当前余额' : 'Current balance'}
              </label>
              <div className="wallet-withdraw-balance-inner">
                {balance.toFixed(2)} USDT
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-address-cell">
              <label className="wallet-recharge-label">
                <span className="wallet-recharge-required">*</span>
                {lang === 'zh' ? '提现地址' : 'Withdrawal address'}
              </label>
              <div className="wallet-recharge-address-row wallet-withdraw-address-row">
                <input
                  className="wallet-recharge-address-input"
                  placeholder={
                    lang === 'zh'
                      ? '请输入提币地址'
                      : 'Please enter the withdrawal address'
                  }
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-amount-cell">
              <label className="wallet-recharge-label">
                <span className="wallet-recharge-required">*</span>
                {lang === 'zh' ? '数量' : 'Amount'}
              </label>
              <input
                className="wallet-recharge-input wallet-recharge-input--short"
                placeholder={lang === 'zh' ? '请输入' : 'Please enter'}
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-actual-cell">
              <label className="wallet-recharge-label">
                {lang === 'zh' ? '实际到账' : 'Actual received'}
              </label>
              <div className="wallet-withdraw-actual-value">
                {amount ? Number(amount || 0).toFixed(2) : '0.00'} USDT
                {lang === 'zh' ? '（手续费 0.00%）' : ' (Fee 0.00%)'}
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-submit-cell">
              <button
                type="button"
                className="wallet-recharge-submit"
                disabled={submitDisabled}
                onClick={() => {
                  if (amountNum > balance) {
                    showToast(
                      lang === 'zh'
                        ? '提现数量不得超出当前余额'
                        : 'Withdrawal amount cannot exceed current balance',
                      'error',
                    )
                    return
                  }
                  setTradePwdModalOpen(true)
                }}
              >
                {lang === 'zh' ? '确定' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
        <WalletPaymentBadges />
      </section>

      {tradePwdModalOpen && (
        <div
          className="account-tradepwd-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-wallet-withdraw-tradepwd-title"
          onClick={() => setTradePwdModalOpen(false)}
        >
          <div
            className="account-tradepwd-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="account-tradepwd-close"
                  aria-label={lang === 'zh' ? '关闭' : 'Close'}
              onClick={() => setTradePwdModalOpen(false)}
            >
              ×
            </button>
            <h2 id="merchant-wallet-withdraw-tradepwd-title" className="account-tradepwd-title">
                  {lang === 'zh' ? '输入交易密码' : 'Enter payment PIN'}
            </h2>
                <p className="account-tradepwd-subtitle">
                  {lang === 'zh' ? '请输入交易密码' : 'Please enter your payment PIN'}
                </p>
            <div className="account-tradepwd-inputs">
              {tradePwdChars.map((ch, idx) => (
                <input
                  key={idx}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  className="account-tradepwd-input"
                  value={ch.trim()}
                  onChange={(e) => handleTradePwdChange(idx, e)}
                  onKeyDown={(e) => handleTradePwdKeyDown(idx, e)}
                />
              ))}
            </div>
            <button
              type="button"
              className="account-tradepwd-confirm"
              disabled={confirmPwdDisabled}
              onClick={() => {
                if (amountNum > balance) {
                  showToast(
                    lang === 'zh'
                      ? '提现数量不得超出当前余额'
                      : 'Withdrawal amount cannot exceed current balance',
                    'error',
                  )
                  return
                }
                const submit = async () => {
                  try {
                    const raw = window.localStorage.getItem('authUser')
                    if (!raw) {
                      showToast(
                        lang === 'zh'
                          ? '请先登录店铺账号'
                          : 'Please log in to your shop account',
                        'error',
                      )
                      return
                    }
                    const auth = JSON.parse(raw) as { id?: string; shopId?: string }
                    const userId = typeof auth.id === 'string' ? auth.id : ''
                    const shopId = typeof auth.shopId === 'string' ? auth.shopId : ''
                    if (!userId || !shopId) {
                      showToast(
                        lang === 'zh'
                          ? '请先登录店铺账号'
                          : 'Please log in to your shop account',
                        'error',
                      )
                      return
                    }

                    await api.post(`/api/shops/${encodeURIComponent(shopId)}/withdraw`, {
                      userId,
                      amount: Number(amountNum),
                      tradePassword: tradePwd,
                      address: address.trim(),
                    })

                    setTradePwdModalOpen(false)
                    setTradePwd('')
                    setAmount('')
                    setAddress('')
                    showToast(
                      lang === 'zh'
                        ? '提交成功'
                        : 'Submitted successfully',
                    )
                    navigate('/merchant/wallet')
                  } catch (e) {
                    const fallback =
                      lang === 'zh'
                        ? '提交失败'
                        : 'Submission failed'
                    showToast(e instanceof Error ? e.message : fallback, 'error')
                  }
                }
                void submit()
              }}
            >
              {lang === 'zh' ? '确认密码' : 'Confirm PIN'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantWalletWithdraw
