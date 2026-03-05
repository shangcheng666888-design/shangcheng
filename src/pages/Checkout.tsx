import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import type { CartItem } from '../cart/CartContext'
import { useToast } from '../components/ToastProvider'
import AddressModal from '../components/AddressModal'
import type { AddressItem } from '../utils/addressList'
import {
  createOrder,
  updateOrderStatus,
  getOrderById,
  type OrderItemSnapshot,
  type OrderAddressSnapshot,
} from '../utils/orderList'
import { api } from '../api/client'
import { COUNTRY_OPTIONS } from '../constants/countries'
import { getRegions, getCities } from '../constants/countryRegions'
import walletIcon from '../assets/qianbao.png'
import mastercardIcon from '../assets/mastercard-icon.png'
import visaIcon from '../assets/visa-icon.png'
import paypalIcon from '../assets/paypal-icon.png'
import unionpayIcon from '../assets/unionpay-icon.png'
import { useLang } from '../context/LangContext'

const BOUND_CARDS_KEY = 'checkoutBoundCards'

type CardPaymentMethod = 'visa' | 'mastercard'

/** 根据卡号前几位识别：Visa / Mastercard / 不支持 / 尚未识别 */
function checkCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'unsupported' | null {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 1) return null
  if (digits[0] === '4') return 'visa'
  if (digits.length >= 2) {
    const n2 = parseInt(digits.slice(0, 2), 10)
    if (n2 >= 51 && n2 <= 55) return 'mastercard'
    if (digits[0] === '5') return 'unsupported' // 50, 56-59
  }
  if (digits.length >= 4) {
    const n4 = parseInt(digits.slice(0, 4), 10)
    if (n4 >= 2221 && n4 <= 2720) return 'mastercard'
    if (digits.slice(0, 2) === '22') return 'unsupported' // 22xx 且不在 2221-2720
  }
  if (digits[0] === '3' || digits[0] === '6' || digits[0] === '7' || digits[0] === '8' || digits[0] === '9' || digits[0] === '1') return 'unsupported'
  if (digits.length >= 1 && digits[0] === '2' && digits.length < 4) return null
  if (digits.length >= 1 && digits[0] === '5' && digits.length < 2) return null
  return null
}

function loadBoundCards(): Partial<Record<CardPaymentMethod, string>> {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(BOUND_CARDS_KEY) : null
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<Record<CardPaymentMethod, string>>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveBoundCards(cards: Partial<Record<CardPaymentMethod, string>>) {
  try {
    window.localStorage.setItem(BOUND_CARDS_KEY, JSON.stringify(cards))
  } catch {}
}

function getCountryLabel(code: string) {
  return COUNTRY_OPTIONS.find((c) => c.value === code)?.label ?? code
}
function getRegionLabel(countryCode: string, regionValue: string) {
  const regions = getRegions(countryCode)
  return regions.find((r) => r.value === regionValue)?.label ?? regionValue
}
function getCityLabel(countryCode: string, regionValue: string, cityValue: string) {
  const cities = getCities(countryCode, regionValue)
  return cities.find((c) => c.value === cityValue)?.label ?? cityValue
}

function formatAddress(addr: AddressItem): string {
  const parts = [
    getCountryLabel(addr.country),
    addr.province && addr.province !== '_' ? getRegionLabel(addr.country, addr.province) : '',
    addr.city && addr.city !== '_' ? getCityLabel(addr.country, addr.province || '_', addr.city) : '',
    addr.detail,
  ].filter(Boolean)
  return parts.join(' ')
}

function toAddressSnapshot(addr: AddressItem): OrderAddressSnapshot {
  return {
    recipient: addr.recipient,
    email: addr.email,
    phoneCode: addr.phoneCode,
    phone: addr.phone,
    country: addr.country,
    province: addr.province,
    city: addr.city,
    postal: addr.postal,
    detail: addr.detail,
  }
}

function getInitialAuth(): { id: string | null; balance: number } {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return { id: null, balance: 0 }
    const p = JSON.parse(raw) as { id?: string; balance?: number }
    return {
      id: p?.id ?? null,
      balance: typeof p?.balance === 'number' ? p.balance : 0,
    }
  } catch {
    return { id: null, balance: 0 }
  }
}

function normalizeAddress(a: unknown): AddressItem | null {
  if (!a || typeof a !== 'object') return null
  const o = a as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  return {
    id,
    recipient: typeof o.recipient === 'string' ? o.recipient : '',
    email: typeof o.email === 'string' ? o.email : '',
    phoneCode: typeof o.phoneCode === 'string' ? o.phoneCode : '+86',
    phone: typeof o.phone === 'string' ? o.phone : '',
    country: typeof o.country === 'string' ? o.country : '',
    province: typeof o.province === 'string' ? o.province : '',
    city: typeof o.city === 'string' ? o.city : '',
    postal: typeof o.postal === 'string' ? o.postal : '',
    detail: typeof o.detail === 'string' ? o.detail : '',
    isDefault: !!o.isDefault,
  }
}

/** 从路由 state 传入的「直接购买」商品，与购物车解耦 */
export type CheckoutDirectItems = CartItem[]

const Checkout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const orderIdFromUrl = searchParams.get('orderId')
  const directItems = (location.state as { directItems?: CheckoutDirectItems } | null)?.directItems
  const { showToast } = useToast()
  const { lang } = useLang()
  const { items, updateItemQuantity, removeItem } = useCart()
  const [addressList, setAddressList] = useState<AddressItem[]>([])
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'visa' | 'mastercard'>('balance')
  const [submitting, setSubmitting] = useState(false)
  const [bindCardModalOpen, setBindCardModalOpen] = useState(false)
  const [bindCardNo, setBindCardNo] = useState('')
  const [bindCardExpiry, setBindCardExpiry] = useState('')
  const [bindCardCvv, setBindCardCvv] = useState('')
  const [bindCardName, setBindCardName] = useState('')
  const [boundCards, setBoundCards] = useState<Partial<Record<CardPaymentMethod, string>>>(() => loadBoundCards())
  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)
  const [successOrderNumber, setSuccessOrderNumber] = useState('')
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialAuth = getInitialAuth()
  const [userId] = useState<string | null>(initialAuth.id)
  const [balance, setBalance] = useState<number>(initialAuth.balance)

  useEffect(() => {
    if (!userId) {
      navigate('/login', {
        state: { from: { pathname: '/checkout', state: location.state } },
        replace: true,
      })
    }
  }, [userId, navigate, location.state])

  useEffect(() => {
    if (submitSuccess || submitFailed) {
      document.getElementById('root')?.scrollTo({ top: 0, behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [submitSuccess, submitFailed])

  const [directCheckoutItems, setDirectCheckoutItems] = useState<CartItem[]>(() => directItems ?? [])
  useEffect(() => {
    if (directItems && directItems.length > 0) setDirectCheckoutItems(directItems)
  }, [directItems?.length])

  const orderForPay = orderIdFromUrl ? getOrderById(orderIdFromUrl) : null
  const orderItems = orderForPay?.items ?? []
  const itemsToCheckout: CartItem[] =
    directItems && directItems.length > 0
      ? directCheckoutItems
      : orderIdFromUrl && orderItems.length > 0
        ? (orderItems as CartItem[])
        : items
  const fromCartCheckout = !directItems?.length && !orderIdFromUrl

  const itemSubtotal = itemsToCheckout.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const discount = 0
  const tax = 0
  const total = itemSubtotal - discount + tax

  useEffect(() => {
    const uid = userId
    if (!uid) {
      setAddressList([])
      setSelectedAddress(null)
      return
    }
    let cancelled = false
    api
      .get<{ addresses?: unknown[] }>(`/api/users/${encodeURIComponent(uid)}`)
      .then((res) => {
        if (cancelled) return
        const addrs = (res.addresses ?? []).map((a) => normalizeAddress(a)).filter((a): a is AddressItem => a !== null)
        setAddressList(addrs)
        const def = addrs.find((a) => a.isDefault) ?? addrs[0] ?? null
        setSelectedAddress(def)
      })
      .catch(() => {
        if (!cancelled) {
          setAddressList([])
          setSelectedAddress(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    const uid = userId
    if (!uid) {
      setBalance(0)
      return
    }
    let cancelled = false
    api
      .get<{ balance?: number }>(`/api/users/${encodeURIComponent(uid)}`)
      .then((res) => {
        if (cancelled) return
        const next = Number.isFinite(Number(res.balance)) ? Number(res.balance) : 0
        setBalance(next)
        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
          if (raw) {
            const parsed = JSON.parse(raw) as { id?: string; balance?: number }
            const nextAuth = { ...parsed, balance: next }
            window.localStorage.setItem('authUser', JSON.stringify(nextAuth))
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (!cancelled) {
          // 保持当前 balance，不强制覆盖
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const balanceInsufficient = total > balance
  const canSubmit =
    items.length > 0 &&
    selectedAddress !== null &&
    !(paymentMethod === 'balance' && balanceInsufficient)

  const isCardPayment = paymentMethod !== 'balance'
  const regionRestrictedMsg =
    lang === 'zh'
      ? '该支付方式并未对您所在的地区开放'
      : 'This payment method is not available in your region'
  const detectedCardBrand = checkCardBrand(bindCardNo)
  const showCardIcon = detectedCardBrand === 'visa' || detectedCardBrand === 'mastercard'

  // 若当前支付方式为余额且余额不足，自动切换为 Visa，避免用户提交时报错
  useEffect(() => {
    if (balanceInsufficient && paymentMethod === 'balance') {
      setPaymentMethod('visa')
    }
  }, [balanceInsufficient, paymentMethod])

  const handleSubmit = async () => {
    if (itemsToCheckout.length === 0) {
      showToast(lang === 'zh' ? '暂无商品' : 'No items to checkout', 'error')
      return
    }
    if (!selectedAddress) {
      showToast(
        lang === 'zh' ? '请选择收件地址' : 'Please select a shipping address',
        'error',
      )
      return
    }
    if (paymentMethod === 'balance' && balanceInsufficient) {
      showToast(
        lang === 'zh'
          ? '余额不足，请更换支付方式'
          : 'Insufficient balance, please choose another payment method',
        'error',
      )
      return
    }
    if (submitting) return
    const addressSnapshot = toAddressSnapshot(selectedAddress)
    const isPayingOrder = !!orderIdFromUrl

    if (isCardPayment) {
      const cardKey = paymentMethod as CardPaymentMethod
      if (!boundCards[cardKey]) {
        setBindCardModalOpen(true)
        return
      }
      if (!isPayingOrder) {
        createOrder({
          items: itemsToCheckout as OrderItemSnapshot[],
          address: addressSnapshot,
          total,
        })
      }
      setSubmitting(true)
      submitTimeoutRef.current = setTimeout(() => {
        submitTimeoutRef.current = null
        setSubmitting(false)
        setSubmitFailed(true)
      }, 4500)
      return
    }

    if (isPayingOrder) {
      const order = getOrderById(orderIdFromUrl!)
      if (!order || order.status !== 'pending') {
        showToast(
          lang === 'zh' ? '订单已失效' : 'Order is no longer valid',
          'error',
        )
        return
      }
      setSubmitting(true)
      submitTimeoutRef.current = setTimeout(() => {
        submitTimeoutRef.current = null
        updateOrderStatus(orderIdFromUrl!, 'shipping')
        setSuccessOrderNumber(order.orderNumber)
        setSubmitting(false)
        setSubmitSuccess(true)
      }, 4500)
      return
    }

    if (!userId) {
      showToast(
        lang === 'zh' ? '请先登录后再下单' : 'Please log in before placing an order',
        'error',
      )
      return
    }
    const shopGroups = new Map<string, CartItem[]>()
    for (const it of itemsToCheckout) {
      const sid = it.shopId ?? '001ABC'
      if (!shopGroups.has(sid)) shopGroups.set(sid, [])
      shopGroups.get(sid)!.push(it)
    }
    setSubmitting(true)
    const orderNumbers: string[] = []
    let totalDeduct = 0
    try {
      for (const [shopId, groupItems] of shopGroups) {
        const amount = groupItems.reduce((s, it) => s + it.price * it.quantity, 0)
        const res = await api.post<{ orderNumber?: string; id?: string; message?: string }>('/api/orders', {
          shopId,
          userId,
          amount,
          orderNumber: `ORD${Date.now()}_${shopId}`,
          items: groupItems.map((it) => ({
            id: it.id,
            productId: it.productId,
            title: it.title,
            price: it.price,
            quantity: it.quantity,
            image: it.image,
            spec: it.spec,
          })),
          address: addressSnapshot,
        })
        if (res && (res as { message?: string }).message)
          throw new Error((res as { message: string }).message)
        orderNumbers.push((res as { orderNumber?: string }).orderNumber ?? (res as { id?: string }).id ?? '')
        totalDeduct += amount
      }
      orderNumbers.forEach(() => {})
      if (fromCartCheckout) itemsToCheckout.forEach((it) => removeItem(it.id))
      setSuccessOrderNumber(orderNumbers.join('、'))
      setSubmitting(false)
      setSubmitSuccess(true)
      // 下单成功后，实时刷新一次账户余额
      if (userId) {
        try {
          const res = await api.get<{ balance?: number }>(`/api/users/${encodeURIComponent(userId)}`)
          const next = Number.isFinite(Number(res.balance)) ? Number(res.balance) : 0
          setBalance(next)
          try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
            if (raw) {
              const parsed = JSON.parse(raw) as { id?: string; balance?: number }
              const nextAuth = { ...parsed, balance: next }
              window.localStorage.setItem('authUser', JSON.stringify(nextAuth))
            }
          } catch {
            // ignore
          }
        } catch {
          // ignore refresh error
        }
      }
    } catch (err) {
      setSubmitting(false)
      showToast(
        err instanceof Error
          ? err.message
          : lang === 'zh'
            ? '下单失败，请重试'
            : 'Order failed, please try again',
        'error',
      )
    }
  }

  const handleCancelSubmit = () => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
      submitTimeoutRef.current = null
    }
    setSubmitting(false)
  }

  const handleChangePaymentAndRetry = () => {
    setSubmitFailed(false)
    requestAnimationFrame(() => {
      document.getElementById('checkout-payment-section')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const handleBindCardConfirm = () => {
    const no = bindCardNo.trim().replace(/\s/g, '')
    const expiry = bindCardExpiry.trim()
    const cvv = bindCardCvv.trim()
    const name = bindCardName.trim()
    if (!no) {
      showToast(lang === 'zh' ? '请输入卡号' : 'Please enter card number', 'error')
      return
    }
    const brand = checkCardBrand(no)
    if (brand !== 'visa' && brand !== 'mastercard') {
      showToast(
        lang === 'zh'
          ? '不支持该卡，仅支持 Visa 与万事达'
          : 'This card is not supported, only Visa and Mastercard are accepted',
        'error',
      )
      return
    }
    if (!expiry) {
      showToast(lang === 'zh' ? '请输入有效期' : 'Please enter expiry date', 'error')
      return
    }
    if (!cvv) {
      showToast(lang === 'zh' ? '请输入安全码' : 'Please enter security code', 'error')
      return
    }
    if (!name) {
      showToast(
        lang === 'zh' ? '请输入持卡人姓名' : 'Please enter cardholder name',
        'error',
      )
      return
    }
    const last4 = no.replace(/\D/g, '').slice(-4)
    const cardKey = brand
    const next = { ...boundCards, [cardKey]: last4 }
    setBoundCards(next)
    saveBoundCards(next)
    setBindCardModalOpen(false)
    setBindCardNo('')
    setBindCardExpiry('')
    setBindCardCvv('')
    setBindCardName('')
    showToast(lang === 'zh' ? '绑定成功' : 'Card bound successfully')
  }

  if (submitSuccess) {
    return (
      <main className="app-main checkout-page checkout-page--success">
        <div className="checkout-success">
          <div className="checkout-success-icon" aria-hidden>✓</div>
          <h1 className="checkout-success-title">
            {lang === 'zh' ? '订单提交成功' : 'Order submitted successfully'}
          </h1>
          {successOrderNumber && (
            <p className="checkout-success-order-no">
              {lang === 'zh' ? '订单号：' : 'Order No: '}
              {successOrderNumber}
            </p>
          )}
          <p className="checkout-success-desc">
            {lang === 'zh'
              ? '感谢您的购买，请留意订单状态'
              : 'Thank you for your purchase. Please keep an eye on your order status.'}
          </p>
          <div className="checkout-success-actions">
            <button
              type="button"
              className="checkout-success-btn checkout-success-btn--primary"
              onClick={() => navigate('/account?tab=orders')}
            >
              {lang === 'zh' ? '查看订单' : 'View orders'}
            </button>
            <Link to="/products" className="checkout-success-btn checkout-success-btn--secondary">
              {lang === 'zh' ? '继续购物' : 'Continue shopping'}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (submitFailed) {
    return (
      <main className="app-main checkout-page checkout-page--success">
        <div className="checkout-failed">
          <div className="checkout-failed-icon" aria-hidden>×</div>
          <h1 className="checkout-failed-title">
            {lang === 'zh' ? '订单提交失败' : 'Order submission failed'}
          </h1>
          <p className="checkout-failed-desc">
            {lang === 'zh'
              ? '支付异常，请联系发卡银行'
              : 'Payment error, please contact your card issuer.'}
          </p>
          <div className="checkout-success-actions">
            <button
              type="button"
              className="checkout-success-btn checkout-success-btn--primary"
              onClick={handleChangePaymentAndRetry}
            >
              {lang === 'zh' ? '更换支付方式' : 'Change payment method'}
            </button>
            <button
              type="button"
              className="checkout-success-btn checkout-success-btn--secondary"
              onClick={() => setSubmitFailed(false)}
            >
              {lang === 'zh' ? '返回重试' : 'Back and retry'}
            </button>
            <Link to="/products" className="checkout-success-btn checkout-success-btn--secondary">
              {lang === 'zh' ? '返回购物' : 'Back to shopping'}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (itemsToCheckout.length === 0) {
    return (
      <main className="app-main checkout-page">
        <div className="checkout-empty">
          <p className="checkout-empty-text">
            {lang === 'zh' ? '暂无商品' : 'No items to checkout'}
          </p>
            <Link to="/products" className="checkout-empty-btn">
              {lang === 'zh' ? '去购物' : 'Go shopping'}
          </Link>
        </div>
      </main>
    )
  }

  if (!userId) {
    return (
      <main className="app-main checkout-page">
        <div className="checkout-inner" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>{lang === 'zh' ? '正在跳转到登录页…' : 'Redirecting to login…'}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="app-main checkout-page">
      <div className="checkout-inner">
        <h1 className="checkout-title">
          {lang === 'zh' ? '下单' : 'Checkout'}
        </h1>

        <section className="checkout-section">
          <h2 className="checkout-section-title">
            {lang === 'zh' ? '收件地址' : 'Shipping address'}
          </h2>
          <button
            type="button"
            className="checkout-address-row"
            onClick={() => setAddressModalOpen(true)}
            aria-label={
              lang === 'zh'
                ? '选择或添加收件地址'
                : 'Select or add a shipping address'
            }
          >
            <span className="checkout-address-add-icon" aria-hidden>+</span>
            <span className="checkout-address-text">
              {selectedAddress
                ? `${selectedAddress.recipient} ${selectedAddress.phoneCode} ${selectedAddress.phone} ${formatAddress(selectedAddress)}`
                : lang === 'zh'
                  ? '请选择收件地址'
                  : 'Please select a shipping address'}
            </span>
            <span className="checkout-address-arrow" aria-hidden>&gt;</span>
          </button>
        </section>

        <section className="checkout-section">
          <div className="checkout-seller-row">
            <span className="checkout-seller-check" aria-hidden>✓</span>
            <span className="checkout-seller-name">
              {lang === 'zh'
                ? `购买商品 (总计 ${itemsToCheckout.length} 项目)`
                : `Items to purchase (total ${itemsToCheckout.length})`}
            </span>
          </div>
          <div className="checkout-items">
            {itemsToCheckout.map((item) => (
              <div key={item.id} className="checkout-item">
                <span className="checkout-item-check" aria-hidden>✓</span>
                <div className="checkout-item-thumb">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="checkout-item-thumb-placeholder" />
                  )}
                </div>
                <div className="checkout-item-info">
                  <div className="checkout-item-title">{item.title}</div>
                  <div className="checkout-item-price">${item.price.toFixed(2)}</div>
                </div>
                <div className="checkout-item-qty">
                  {fromCartCheckout ? (
                    <>
                      <button
                        type="button"
                        className="checkout-qty-btn"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="checkout-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="checkout-qty-btn"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </>
                  ) : directItems?.length ? (
                    <>
                      <button
                        type="button"
                        className="checkout-qty-btn"
                        onClick={() => {
                          if (item.quantity <= 1) return
                          setDirectCheckoutItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)),
                          )
                        }}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="checkout-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="checkout-qty-btn"
                        onClick={() =>
                          setDirectCheckoutItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
                          )
                        }
                      >
                        +
                      </button>
                    </>
                  ) : (
                    <span className="checkout-qty-value">{item.quantity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="checkout-payment-section" className="checkout-section checkout-payment">
          <h2 className="checkout-section-title">
            {lang === 'zh' ? '支付方式' : 'Payment method'}
          </h2>
          <div className="checkout-payment-options">
            {balanceInsufficient ? (
              <div
                className="checkout-payment-option checkout-payment-option--disabled"
                role="button"
                tabIndex={0}
              onClick={() =>
                showToast(
                  lang === 'zh'
                    ? '余额不足，请更换支付方式'
                    : 'Insufficient balance, please choose another payment method',
                  'error',
                )
              }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    showToast(
                      lang === 'zh'
                        ? '余额不足，请更换支付方式'
                        : 'Insufficient balance, please choose another payment method',
                      'error',
                    )
                  }
                }}
                aria-disabled="true"
              >
                <span className="checkout-payment-radio checkout-payment-radio--fake" aria-hidden />
                <span className="checkout-payment-icon checkout-payment-icon--img">
                  <img src={walletIcon} alt="" />
                </span>
                <span className="checkout-payment-label">
                  {lang === 'zh' ? '余额 ' : 'Balance '}
                  (${balance.toFixed(2)})
                  {balanceInsufficient && (
                    <span className="checkout-payment-region-hint">
                      {lang === 'zh' ? '余额不足' : 'Insufficient balance'}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <label className={`checkout-payment-option${paymentMethod === 'balance' ? ' checkout-payment-option--selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="balance"
                  checked={paymentMethod === 'balance'}
                  onChange={() => setPaymentMethod('balance')}
                  className="checkout-payment-radio"
                />
                <span className="checkout-payment-icon checkout-payment-icon--img">
                  <img src={walletIcon} alt="" />
                </span>
                <span className="checkout-payment-label">余额 (${balance.toFixed(2)})</span>
              </label>
            )}
            <label className={`checkout-payment-option${paymentMethod === 'visa' ? ' checkout-payment-option--selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="visa"
                checked={paymentMethod === 'visa'}
                onChange={() => setPaymentMethod('visa')}
                className="checkout-payment-radio"
              />
              <span className="checkout-payment-icon checkout-payment-icon--img">
                <img src={visaIcon} alt="" />
              </span>
              <span className="checkout-payment-label">
                Visa{boundCards.visa ? ` **** ${boundCards.visa}` : ''}
              </span>
            </label>
            <label className={`checkout-payment-option${paymentMethod === 'mastercard' ? ' checkout-payment-option--selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="mastercard"
                checked={paymentMethod === 'mastercard'}
                onChange={() => setPaymentMethod('mastercard')}
                className="checkout-payment-radio"
              />
              <span className="checkout-payment-icon checkout-payment-icon--img">
                <img src={mastercardIcon} alt="" />
              </span>
              <span className="checkout-payment-label">
                Mastercard{boundCards.mastercard ? ` **** ${boundCards.mastercard}` : ''}
              </span>
            </label>
            <div
              className="checkout-payment-option checkout-payment-option--disabled"
              role="button"
              tabIndex={0}
              onClick={() => showToast(regionRestrictedMsg, 'error')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  showToast(regionRestrictedMsg, 'error')
                }
              }}
              aria-disabled="true"
            >
              <span className="checkout-payment-radio checkout-payment-radio--fake" aria-hidden />
              <span className="checkout-payment-icon checkout-payment-icon--img">
                <img src={paypalIcon} alt="" />
              </span>
              <span className="checkout-payment-label">
                PayPal
                <span className="checkout-payment-region-hint">{regionRestrictedMsg}</span>
              </span>
            </div>
            <div
              className="checkout-payment-option checkout-payment-option--disabled"
              role="button"
              tabIndex={0}
              onClick={() => showToast(regionRestrictedMsg, 'error')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  showToast(regionRestrictedMsg, 'error')
                }
              }}
              aria-disabled="true"
            >
              <span className="checkout-payment-radio checkout-payment-radio--fake" aria-hidden />
              <span className="checkout-payment-icon checkout-payment-icon--img">
                <img src={unionpayIcon} alt="" />
              </span>
              <span className="checkout-payment-label">
                银联
                <span className="checkout-payment-region-hint">{regionRestrictedMsg}</span>
              </span>
            </div>
          </div>
        </section>

        <section className="checkout-section checkout-summary">
          <h2 className="checkout-section-title">
            {lang === 'zh' ? '订单汇总' : 'Order summary'}
          </h2>
          <div className="checkout-summary-rows">
            <div className="checkout-summary-row">
              <span>{lang === 'zh' ? '商品金额' : 'Items subtotal'}</span>
              <span>${itemSubtotal.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>{lang === 'zh' ? '折扣' : 'Discount'}</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>{lang === 'zh' ? '税收' : 'Tax'}</span>
              <span>+${tax.toFixed(2)}</span>
            </div>
          </div>
          <div className="checkout-submit-row">
            <button
              type="button"
              className="checkout-submit-btn"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? lang === 'zh'
                  ? '提交中...'
                  : 'Submitting...'
                : lang === 'zh'
                  ? '提交订单'
                  : 'Place order'}
            </button>
            <span className="checkout-total-label">
              {lang === 'zh' ? '合计' : 'Total'}
            </span>
            <span className="checkout-total-amount">${total.toFixed(2)}</span>
          </div>
        </section>
      </div>

      {submitting && (
        <div className="checkout-submit-overlay" role="status" aria-live="polite">
          <div className="checkout-submit-loader-wrap">
            <div className="checkout-submit-loader" aria-hidden />
            <span className="checkout-submit-loader-text">
              {lang === 'zh' ? '提交中...' : 'Submitting...'}
            </span>
            <button
              type="button"
              className="checkout-submit-cancel-btn"
              onClick={handleCancelSubmit}
              >
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {bindCardModalOpen && (
        <div
          className="checkout-address-modal-overlay checkout-bindcard-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-bindcard-modal-title"
          onClick={() => setBindCardModalOpen(false)}
        >
          <div className="checkout-bindcard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-address-modal-header">
              <h2 id="checkout-bindcard-modal-title">
                {lang === 'zh' ? '银行卡支付' : 'Pay with bank card'}
              </h2>
              <button
                type="button"
                className="checkout-address-modal-close"
                aria-label={lang === 'zh' ? '关闭' : 'Close'}
                onClick={() => setBindCardModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="checkout-bindcard-body">
              <div className="checkout-bindcard-field">
                <label className="checkout-bindcard-label">
                  {lang === 'zh' ? '卡号' : 'Card number'}
                </label>
                <div className="checkout-bindcard-input-wrap">
                  <input
                    type="text"
                    className={`checkout-bindcard-input${
                      showCardIcon ? ' checkout-bindcard-input--has-icon' : ''
                    }`}
                    placeholder={
                      lang === 'zh' ? '请输入卡号' : 'Please enter card number'
                    }
                    value={bindCardNo}
                    onChange={(e) => {
                      const v = e.target.value
                      setBindCardNo(v)
                      const result = checkCardBrand(v)
                      if (result === 'visa' || result === 'mastercard')
                        setPaymentMethod(result)
                      if (result === 'unsupported')
                        showToast(
                          lang === 'zh'
                            ? '不支持该卡，仅支持 Visa 与万事达'
                            : 'This card is not supported. Only Visa and Mastercard are supported.',
                          'error',
                        )
                    }}
                    maxLength={19}
                  />
                  {showCardIcon && (
                    <span className="checkout-bindcard-card-icon" aria-hidden>
                      {detectedCardBrand === 'visa' ? (
                        <img src={visaIcon} alt="" />
                      ) : (
                        <img src={mastercardIcon} alt="" />
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="checkout-bindcard-row">
                <div className="checkout-bindcard-field">
                  <label className="checkout-bindcard-label">
                    {lang === 'zh' ? '有效期' : 'Expiry date'}
                  </label>
                  <input
                    type="text"
                    className="checkout-bindcard-input"
                    placeholder="MM/YY"
                    value={bindCardExpiry}
                    onChange={(e) => setBindCardExpiry(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="checkout-bindcard-field">
                  <label className="checkout-bindcard-label">
                    {lang === 'zh' ? '安全码' : 'Security code'}
                  </label>
                  <input
                    type="text"
                    className="checkout-bindcard-input"
                    placeholder="CVV"
                    value={bindCardCvv}
                    onChange={(e) => setBindCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="checkout-bindcard-field">
                <label className="checkout-bindcard-label">
                  {lang === 'zh' ? '持卡人姓名' : 'Cardholder name'}
                </label>
                <input
                  type="text"
                  className="checkout-bindcard-input"
                  placeholder={
                    lang === 'zh'
                      ? '请输入持卡人姓名'
                      : 'Please enter cardholder name'
                  }
                  value={bindCardName}
                  onChange={(e) => setBindCardName(e.target.value)}
                />
              </div>
              <div className="checkout-bindcard-actions">
                <button
                  type="button"
                  className="checkout-bindcard-btn checkout-bindcard-btn--cancel"
                  onClick={() => setBindCardModalOpen(false)}
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="checkout-bindcard-btn checkout-bindcard-btn--confirm"
                  onClick={handleBindCardConfirm}
                >
                  {lang === 'zh' ? '确认绑定' : 'Confirm binding'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addressModalOpen && (
        <div
          className="checkout-address-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-address-modal-title"
          onClick={() => setAddressModalOpen(false)}
        >
          <div className="checkout-address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-address-modal-header">
              <h2 id="checkout-address-modal-title">
                {lang === 'zh' ? '选择收件地址' : 'Select shipping address'}
              </h2>
              <button
                type="button"
                className="checkout-address-modal-close"
                aria-label={lang === 'zh' ? '关闭' : 'Close'}
                onClick={() => setAddressModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="checkout-address-modal-body">
              {addressList.length === 0 ? (
                <p className="checkout-address-modal-empty">
                  {lang === 'zh'
                    ? '暂无地址，请先添加'
                    : 'No addresses yet, please add one first'}
                </p>
              ) : (
                <ul className="checkout-address-modal-list">
                  {addressList.map((addr) => (
                    <li key={addr.id}>
                      <button
                        type="button"
                        className={`checkout-address-modal-item${selectedAddress?.id === addr.id ? ' checkout-address-modal-item--active' : ''}`}
                        onClick={() => {
                          setSelectedAddress(addr)
                          setAddressModalOpen(false)
                        }}
                      >
                        <span className="checkout-address-modal-item-name">{addr.recipient}</span>
                        <span className="checkout-address-modal-item-phone">{addr.phoneCode} {addr.phone}</span>
                        <span className="checkout-address-modal-item-addr">{formatAddress(addr)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="checkout-address-modal-add"
                onClick={() => {
                  setAddressModalOpen(false)
                  setAddAddressModalOpen(true)
                }}
              >
                {lang === 'zh' ? '+ 新增地址' : '+ Add new address'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddressModal
        open={addAddressModalOpen}
        onClose={() => setAddAddressModalOpen(false)}
        onSuccess={(item) => {
          let nextList: AddressItem[] = [...addressList, item]
          if (item.isDefault) {
            nextList = nextList.map((a) => ({ ...a, isDefault: a.id === item.id }))
          }
          if (!userId) {
            showToast(
              lang === 'zh' ? '请先登录' : 'Please log in first',
              'error',
            )
            return
          }
          api
            .patch(`/api/users/${encodeURIComponent(userId)}`, { addresses: nextList })
            .then(() => {
              setAddressList(nextList)
              setSelectedAddress(item)
              showToast(
                lang === 'zh' ? '保存成功' : 'Saved successfully',
              )
              setAddAddressModalOpen(false)
            })
            .catch((err: unknown) => {
              showToast(
                err instanceof Error
                  ? err.message
                  : lang === 'zh'
                    ? '保存失败'
                    : 'Save failed',
                'error',
              )
            })
        }}
      />
    </main>
  )
}

export default Checkout
