import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountSidebar from '../components/AccountSidebar'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'

function getAuthUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    return (JSON.parse(raw) as { id?: string })?.id ?? null
  } catch {
    return null
  }
}

const WalletWithdraw: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/account')
    }
  }
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const { showToast } = useToast()
  const [tradePwdModalOpen, setTradePwdModalOpen] = useState(false)
  const [tradePwd, setTradePwd] = useState('')

  const amountNum = parseFloat(amount)
  const isAmountFilled = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0
  const submitDisabled = !address.trim() || !isAmountFilled
  const confirmPwdDisabled = tradePwd.length < 6

  const tradePwdChars = tradePwd.padEnd(6, ' ').slice(0, 6).split('')

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
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
    <div className="account-page">
      <div className="account-inner">
        <AccountSidebar activeKey="wallet" />

        <main className="account-main">
          <section className="wallet-withdraw">
            <header className="wallet-recharge-header">
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

            <div className="wallet-recharge-form">
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
                  <span className="wallet-recharge-select-caret" aria-hidden>
                    ▾
                  </span>
                </div>
              </div>

              <div className="wallet-recharge-field">
                <label className="wallet-recharge-label">
                  {lang === 'zh' ? '区块链网络' : 'Blockchain network'}
                </label>
                <button type="button" className="wallet-withdraw-network-btn">
                  TRC20
                </button>
              </div>

              <div className="wallet-recharge-field">
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

              <div className="wallet-recharge-field">
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
                <div className="wallet-recharge-hint">
                  {lang === 'zh' ? '当前可用余额：' : 'Available balance: '}
                  {/* 从本地 authUser 中读取最新余额 */}
                  {(() => {
                    try {
                      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
                      if (!raw) return '0.00 USDT'
                      const parsed = JSON.parse(raw) as { balance?: number }
                      const bal = Number.isFinite(Number(parsed.balance)) ? Number(parsed.balance) : 0
                      return `${bal.toFixed(2)} USDT`
                    } catch {
                      return '0.00 USDT'
                    }
                  })()}
                </div>
              </div>

              <button
                type="button"
                className="wallet-recharge-submit"
                disabled={submitDisabled}
                onClick={() => {
                  setTradePwdModalOpen(true)
                }}
              >
                {lang === 'zh' ? '确定' : 'Confirm'}
              </button>
            </div>
          </section>
        </main>
      </div>

      {tradePwdModalOpen && (
        <div
          className="account-tradepwd-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-withdraw-tradepwd-title"
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
            <h2 id="wallet-withdraw-tradepwd-title" className="account-tradepwd-title">
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
              onClick={async () => {
                const uid = getAuthUserId()
                if (!uid) {
                  showToast(
                    lang === 'zh' ? '请先登录' : 'Please log in first',
                    'error',
                  )
                  return
                }
                if (!address.trim()) {
                  showToast(
                    lang === 'zh'
                      ? '请输入提币地址'
                      : 'Please enter the withdrawal address',
                    'error',
                  )
                  return
                }
                if (!isAmountFilled) {
                  showToast(
                    lang === 'zh'
                      ? '请输入正确的提现金额'
                      : 'Please enter a valid withdrawal amount',
                    'error',
                  )
                  return
                }
                const amountValue = parseFloat(amount)
                if (!Number.isFinite(amountValue) || amountValue <= 0) {
                  showToast(
                    lang === 'zh'
                      ? '请输入正确的提现金额'
                      : 'Please enter a valid withdrawal amount',
                    'error',
                  )
                  return
                }
                try {
                  await api.post(`/api/users/${encodeURIComponent(uid)}/withdraw`, {
                    amount: amountValue,
                    tradePassword: tradePwd,
                    address,
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
                  goBack()
                } catch (err: unknown) {
                  const fallback =
                    lang === 'zh'
                      ? '提交失败，请稍后重试'
                      : 'Submission failed, please try again later'
                  showToast(err instanceof Error ? err.message : fallback, 'error')
                }
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

export default WalletWithdraw

