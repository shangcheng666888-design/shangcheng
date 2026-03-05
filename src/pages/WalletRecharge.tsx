import React, { useRef, useState, useEffect } from 'react'
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

const WalletRecharge: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/account')
    }
  }
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USDT' | 'BTC' | 'ETH'>('USDT')
  const [network, setNetwork] = useState<'ETH' | 'BTC' | 'TRC20'>('TRC20')
  const [transactionNo, setTransactionNo] = useState('')
  const { showToast } = useToast()
  const [tradePwdModalOpen, setTradePwdModalOpen] = useState(false)
  const [tradePwd, setTradePwd] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  type PlatformPaymentConfig = {
    receiveAddress: string
    receiveQrUrl: string
    ethAddress?: string
    btcAddress?: string
    trc20Address?: string
    ethQrUrl?: string
    btcQrUrl?: string
    trc20QrUrl?: string
  }
  const [platformPayment, setPlatformPayment] = useState<PlatformPaymentConfig>({
    receiveAddress: '',
    receiveQrUrl: '',
  })

  useEffect(() => {
    api
      .get<PlatformPaymentConfig>('/api/platform-payment-config')
      .then((data) => {
        setPlatformPayment({
          receiveAddress: data.receiveAddress ?? '',
          receiveQrUrl: data.receiveQrUrl ?? '',
          ethAddress: data.ethAddress ?? '',
          btcAddress: data.btcAddress ?? '',
          trc20Address: data.trc20Address ?? '',
          ethQrUrl: data.ethQrUrl ?? '',
          btcQrUrl: data.btcQrUrl ?? '',
          trc20QrUrl: data.trc20QrUrl ?? '',
        })
      })
      .catch(() => {})
  }, [])

  const depositAddress = (() => {
    if (network === 'ETH') return platformPayment.ethAddress || platformPayment.receiveAddress
    if (network === 'BTC') return platformPayment.btcAddress || platformPayment.receiveAddress
    // 默认 TRC20
    return platformPayment.trc20Address || platformPayment.receiveAddress
  })()

  const depositQrUrl = (() => {
    if (network === 'ETH') return platformPayment.ethQrUrl || platformPayment.receiveQrUrl
    if (network === 'BTC') return platformPayment.btcQrUrl || platformPayment.receiveQrUrl
    return platformPayment.trc20QrUrl || platformPayment.receiveQrUrl
  })()

  const tradePwdChars = tradePwd.padEnd(6, ' ').slice(0, 6).split('')
  const amountNum = parseFloat(amount)
  const isAmountFilled = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0
  const submitDisabled = !isAmountFilled || !transactionNo.trim()
  const confirmPwdDisabled = tradePwd.length < 6

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
      // 删除当前格子的数字，但不跳格
      setTradePwd((prev) => {
        const chars = prev.split('')
        chars[index] = ''
        return chars.join('').slice(0, 6)
      })
      return
    }
    if (index > 0) {
      // 当前为空，再退一格并清除上一格
      setTradePwd((prev) => {
        const chars = prev.split('')
        chars[index - 1] = ''
        return chars.join('').slice(0, 6)
      })
      const prevInput = e.currentTarget.previousElementSibling as HTMLInputElement | null
      prevInput?.focus()
    }
  }

  const handleCopyAddress = () => {
    const addr = depositAddress
    if (!addr) {
      showToast(lang === 'zh' ? '暂无收款地址' : 'No deposit address', 'error')
      return
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(addr)
        .then(() => {
          showToast(lang === 'zh' ? '复制成功' : 'Copied')
        })
        .catch(() => {
          showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
        })
    } else {
      showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
    }
  }

  const handleCopyQrcode = () => {
    const canvas = qrCanvasRef.current
    if (!canvas || typeof navigator === 'undefined' || !(navigator.clipboard as any)) {
      showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
      return
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
        return
      }
      const ClipboardItemCtor = (window as any).ClipboardItem
      if (!ClipboardItemCtor) {
        showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
        return
      }
      const item = new ClipboardItemCtor({ [blob.type]: blob })
      ;(navigator.clipboard as any)
        .write([item])
        .then(() => {
          showToast(lang === 'zh' ? '二维码已复制' : 'QR code copied')
        })
        .catch(() => {
          showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
        })
    }, 'image/png')
  }

  useEffect(() => {
    if (depositQrUrl) return
    const canvas = qrCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 160
    canvas.width = size
    canvas.height = size
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'
    const block = 36
    const margin = 10
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, block, block)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 4, y + 4, block - 8, block - 8)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + 10, y + 10, block - 20, block - 20)
    }
    drawFinder(margin, margin)
    drawFinder(size - margin - block, margin)
    drawFinder(margin, size - margin - block)
  }, [depositQrUrl])

  return (
    <div className="account-page">
      <div className="account-inner">
        <AccountSidebar activeKey="wallet" />

        <main className="account-main">
          <section className="wallet-recharge">
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
                {lang === 'zh' ? '我的钱包/充值' : 'My wallet / Recharge'}
              </h1>
            </header>

            <div className="wallet-recharge-form">
              <div className="wallet-recharge-field">
                <label className="wallet-recharge-label">
                  {lang === 'zh' ? '充值币种' : 'Top‑up currency'}
                </label>
                <div className="wallet-recharge-select-wrap">
                  <select
                    className="wallet-recharge-select"
                    value={currency}
                    onChange={(e) => {
                      const v = e.target.value as 'USDT' | 'BTC' | 'ETH'
                      setCurrency(v)
                      if (v === 'BTC') setNetwork('BTC')
                      else if (v === 'ETH') setNetwork('ETH')
                      else setNetwork('TRC20')
                    }}
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
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
                <div className="wallet-recharge-select-wrap">
                  <select
                    className="wallet-recharge-select"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as 'ETH' | 'BTC' | 'TRC20')}
                  >
                    <option value="ETH">{lang === 'zh' ? 'ETH 网络' : 'ETH network'}</option>
                    <option value="BTC">{lang === 'zh' ? 'BTC 网络' : 'BTC network'}</option>
                    <option value="TRC20">{lang === 'zh' ? 'USDT‑TRC20 网络' : 'USDT‑TRC20 network'}</option>
                  </select>
                  <span className="wallet-recharge-select-caret" aria-hidden>
                    ▾
                  </span>
                </div>
              </div>

              <div className="wallet-recharge-qrcode-row">
                <div className="wallet-recharge-qrcode-box">
                  {depositQrUrl ? (
                    <img src={depositQrUrl} alt="" className="wallet-recharge-qrcode-placeholder wallet-recharge-qrcode-img" />
                  ) : (
                    <canvas ref={qrCanvasRef} className="wallet-recharge-qrcode-placeholder" aria-hidden="true" />
                  )}
                </div>
                {!depositQrUrl && (
                  <button
                    type="button"
                    className="wallet-recharge-qrcode-save-btn"
                    onClick={handleCopyQrcode}
                  >
                    {lang === 'zh' ? '保存二维码' : 'Save QR code'}
                  </button>
                )}
              </div>

              <div className="wallet-recharge-field">
                <label className="wallet-recharge-label">
                  {lang === 'zh' ? '充值地址' : 'Deposit address'}
                </label>
                <div className="wallet-recharge-address-row">
                  <input
                    className="wallet-recharge-address-input"
                    value={depositAddress || (lang === 'zh' ? '暂无收款地址' : 'No deposit address')}
                    readOnly
                  />
                  <button
                    type="button"
                    className="wallet-recharge-copy-btn"
                    onClick={handleCopyAddress}
                  >
                    {lang === 'zh' ? '复制' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="wallet-recharge-field">
                <label className="wallet-recharge-label">
                  <span className="wallet-recharge-required">*</span>
                  {lang === 'zh' ? '数量' : 'Amount'}
                </label>
                <input
                  className="wallet-recharge-input wallet-recharge-input--short"
                  placeholder={
                    lang === 'zh' ? '请输入充值金额' : 'Please enter the recharge amount'
                  }
                  value={amount}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^\d.]/g, '')
                    const parts = v.split('.')
                    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                    setAmount(v)
                  }}
                />
              </div>

              <div className="wallet-recharge-field">
                <label className="wallet-recharge-label">
                  {lang === 'zh'
                    ? '预计到货(当前汇率1 : 1.00)'
                    : 'Estimated received (current rate 1 : 1.00)'}
                </label>
                <input
                  className="wallet-recharge-input wallet-recharge-input--readonly wallet-recharge-input--short"
                  value={amount || '0.00'}
                  readOnly
                />
              </div>

              <div className="wallet-recharge-field">
                <label className="wallet-recharge-label">
                  <span className="wallet-recharge-required">*</span>
                  {lang === 'zh' ? '交易号' : 'Transaction ID'}
                </label>
                <div className="wallet-recharge-address-row">
                  <input
                    className="wallet-recharge-address-input"
                    placeholder={
                      lang === 'zh' ? '请输入交易号' : 'Please enter the transaction ID'
                    }
                    value={transactionNo}
                    onChange={(e) => setTransactionNo(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="wallet-recharge-submit"
                disabled={submitDisabled}
                onClick={() => setTradePwdModalOpen(true)}
              >
                {lang === 'zh' ? '确定' : 'Confirm'}
              </button>
            </div>

            {tradePwdModalOpen && (
              <div
                className="account-tradepwd-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wallet-recharge-tradepwd-title"
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
                  <h2 id="wallet-recharge-tradepwd-title" className="account-tradepwd-title">
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
                      if (!isAmountFilled) return
                      const uid = getAuthUserId()
                      if (!uid) {
                        showToast(
                          lang === 'zh' ? '请先登录' : 'Please log in first',
                          'error',
                        )
                        return
                      }
                      const amountValue = parseFloat(amount)
                      if (!Number.isFinite(amountValue) || amountValue <= 0) {
                        showToast(
                          lang === 'zh'
                            ? '请输入正确的金额'
                            : 'Please enter a valid amount',
                          'error',
                        )
                        return
                      }
                      try {
                        await api.post(`/api/users/${encodeURIComponent(uid)}/recharge`, {
                          amount: amountValue,
                          tradePassword: tradePwd,
                          transactionNo,
                        })
                        setTradePwdModalOpen(false)
                        setTradePwd('')
                        setAmount('')
                        setTransactionNo('')
                        showToast(lang === 'zh' ? '提交成功' : 'Submitted successfully')
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
          </section>
        </main>
      </div>
    </div>
  )
}

export default WalletRecharge

