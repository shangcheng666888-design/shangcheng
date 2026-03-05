import React, { useState, useMemo, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/ToastProvider'
import { useLang } from '../context/LangContext'

type OrderStatus =
  | 'all'
  | 'pending_pay'
  | 'paid'   // 店铺待支付（客户已付，店铺未发货结算）
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'return_pending'
  | 'returned'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled'

const STATUS_TABS: OrderStatus[] = [
  'all',
  'paid',
  'shipped',
  'in_transit',
  'delivered',
  'completed',
  'return_pending',
  'returned',
  'refund_pending',
  'refunded',
  'cancelled',
]

const STATUS_LABEL_MAP: Record<OrderStatus, { zh: string; en: string }> = {
  all: { zh: '全部', en: 'All' },
  pending_pay: { zh: '待付款', en: 'Awaiting payment' },
  paid: { zh: '待支付', en: 'To ship' },
  shipped: { zh: '正在出库', en: 'Preparing shipment' },
  in_transit: { zh: '正在配送', en: 'In transit' },
  delivered: { zh: '已签收', en: 'Delivered' },
  completed: { zh: '订单完成', en: 'Completed' },
  return_pending: { zh: '申请退货', en: 'Return requested' },
  returned: { zh: '已退货', en: 'Returned' },
  refund_pending: { zh: '正在退款', en: 'Refund in progress' },
  refunded: { zh: '已退款', en: 'Refunded' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
}

function getStatusTabLabel(status: OrderStatus, lang: 'zh' | 'en'): string {
  const entry = STATUS_LABEL_MAP[status]
  if (!entry) return status
  return lang === 'zh' ? entry.zh : entry.en
}

function getStatusLabel(status: Exclude<OrderStatus, 'all'>, lang: 'zh' | 'en'): string {
  const entry = STATUS_LABEL_MAP[status]
  if (!entry) return status
  return lang === 'zh' ? entry.zh : entry.en
}

/** 后端订单状态 -> 店铺后台 Tab 状态 */
const API_STATUS_TO_TAB: Record<string, Exclude<OrderStatus, 'all'>> = {
  pending: 'pending_pay',
  paid: 'paid',
  shipped: 'shipped',
  in_transit: 'in_transit',
  delivered: 'delivered',
  completed: 'completed',
  return_pending: 'return_pending',
  returned: 'returned',
  refund_pending: 'refund_pending',
  refunded: 'refunded',
  cancelled: 'cancelled',
}

interface OrderItem {
  id: string
  orderNo: string
  orderTime: string
  buyer: string
  productCodes: string
  amount: number
  /** 采购总价（店铺成本），来自后端计算字段 */
  procurementTotal: number
  status: Exclude<OrderStatus, 'all'>
  firstProductTitle: string
  firstProductImage?: string
  totalItems: number
}

interface OrderDetailProduct {
  sku: string
  /** 规格明文，如「黑色 / L码」，无则显示「规格」不显示 UUID */
  specDisplay: string
  name: string
  qty: number
  price: number
  image?: string
}

interface OrderDetail extends OrderItem {
  products: OrderDetailProduct[]
  address: string
  trackingNo?: string
}

function getAuthShopId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    const shopId = (JSON.parse(raw) as { shopId?: string | null })?.shopId
    if (typeof shopId !== 'string') return null
    const trimmed = shopId.trim()
    return trimmed ? trimmed : null
  } catch {
    return null
  }
}

interface ApiOrder {
  id: string
  orderNumber: string
  shopId: string
  userId: string
  amount: number
  procurementTotal?: number
  status: string
  trackingNo?: string
  items: Array<{ id: string; productId?: string; title: string; price: number; quantity: number; image?: string; spec?: string }>
  address: {
    recipient?: string
    email?: string
    phoneCode?: string
    phone?: string
    country?: string
    province?: string
    city?: string
    postal?: string
    detail?: string
  }
  createdAt: string
}

// 简单的内存 + 本地缓存：用于页面切换或刷新时保留上一次的订单列表，避免白屏
const ORDERS_CACHE_KEY_PREFIX = 'merchantOrders:'
let cachedApiOrders: ApiOrder[] | null = null
let cachedBuyerAccounts: Record<string, string> | null = null

if (typeof window !== 'undefined') {
  const initialShopId = getAuthShopId()
  if (initialShopId) {
    try {
      const raw = window.localStorage.getItem(`${ORDERS_CACHE_KEY_PREFIX}${initialShopId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as ApiOrder[]
        if (Array.isArray(parsed)) {
          cachedApiOrders = parsed
        }
      }
    } catch {
      // ignore cache error
    }
  }
}

function formatOrderAddress(addr: ApiOrder['address'], lang: 'zh' | 'en'): string {
  if (!addr) return '—'
  const parts: string[] = []
  const labels =
    lang === 'zh'
      ? {
          recipient: '收件人：',
          phone: '电话：',
          email: '邮箱：',
          region: '地区：',
          postal: '邮编：',
          detail: '详细地址：',
        }
      : {
          recipient: 'Recipient: ',
          phone: 'Phone: ',
          email: 'Email: ',
          region: 'Region: ',
          postal: 'Postal code: ',
          detail: 'Address: ',
        }
  // 店铺侧隐私规则：只展示收件人姓名与国家/省份/城市，其余字段统一做掩码处理
  if (addr.recipient) parts.push(`${labels.recipient}${addr.recipient}`)
  const region = [addr.country, addr.province, addr.city].filter(Boolean).join(' ')
  if (region) parts.push(`${labels.region}${region}`)
  if (addr.phone || addr.phoneCode) {
    parts.push(`${labels.phone}******`)
  }
  if (addr.email) {
    parts.push(`${labels.email}***`)
  }
  if (addr.postal) {
    parts.push(`${labels.postal}***`)
  }
  if (addr.detail) {
    parts.push(`${labels.detail}***`)
  }
  return parts.join('  ')
}

/** 统一规格文案：无规格或占位内容时不显示，只保留真正的颜色/尺码等文字 */
function normalizeSpecDisplay(raw: string | null | undefined): string {
  if (!raw) return '—'
  const s = String(raw).trim()
  if (!s) return '—'
  if (s === '规格') return '—'
  return s
}

/** 缩短商品名，超出部分用省略号 */
function truncateProductName(name: string, maxLen: number = 16): string {
  const s = typeof name === 'string' ? name.trim() : ''
  if (!s) return '—'
  if (s.length <= maxLen) return s
  return s.slice(0, maxLen) + '…'
}

function maskAccount(account: string): string {
  const trimmed = account.trim()
  if (!trimmed) return '—'
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@')
    if (name.length <= 2) return `${name[0] ?? ''}***@${domain}`
    return `${name[0]}***${name[name.length - 1]}@${domain}`
  }
  if (/^\d{6,}$/.test(trimmed)) {
    return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`
  }
  if (trimmed.length <= 2) return `${trimmed[0] ?? ''}*`
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`
}

const MerchantOrders: React.FC = () => {
  const { lang } = useLang()
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('all')
  const [orderNoSearch, setOrderNoSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null)
  // 结算弹窗使用独立的选中订单，避免触发详情抽屉
  const [settleOrder, setSettleOrder] = useState<OrderItem | null>(null)
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>(cachedApiOrders ?? [])
  const [loading, setLoading] = useState(!cachedApiOrders)
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipSubmitting, setShipSubmitting] = useState(false)
  const [settlePreview, setSettlePreview] = useState<{
    orderAmount: number
    procurementTotal: number
    walletBalance: number
  } | null>(null)
  const [settlePreviewLoading, setSettlePreviewLoading] = useState(false)
  const [settlePreviewError, setSettlePreviewError] = useState<string | null>(null)
  const [buyerAccounts, setBuyerAccounts] = useState<Record<string, string>>({})
  const pageSize = 10
  const { showToast } = useToast()

  useEffect(() => {
    if (!shipModalOpen || !settleOrder) {
      setSettlePreview(null)
      setSettlePreviewError(null)
      return
    }
    let cancelled = false
    setSettlePreviewLoading(true)
    setSettlePreviewError(null)
    api
      .get<{ orderAmount: number; procurementTotal: number; walletBalance: number }>(
        `/api/orders/${settleOrder.id}/ship-preview`,
      )
      .then((res) => {
        if (cancelled) return
        setSettlePreview({
          orderAmount: res.orderAmount ?? 0,
          procurementTotal: res.procurementTotal ?? 0,
          walletBalance: res.walletBalance ?? 0,
        })
      })
      .catch((e: any) => {
        if (cancelled) return
        const msg =
          e && typeof e?.message === 'string' && e.message.trim()
            ? e.message.trim()
            : lang === 'zh'
              ? '无法加载结算信息'
              : 'Failed to load settlement information'
        setSettlePreviewError(msg)
      })
      .finally(() => {
        if (!cancelled) setSettlePreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shipModalOpen, settleOrder?.id])

  const loadOrders = React.useCallback((silent = false) => {
    const shopId = getAuthShopId()
    if (!shopId) {
      setApiOrders([])
      cachedApiOrders = []
      setLoading(false)
      return
    }
    if (!silent && apiOrders.length === 0) setLoading(true)
    api.get<{ list: ApiOrder[] }>(`/api/orders?shop=${encodeURIComponent(shopId)}`)
      .then(async (res) => {
        if (!res?.list) return
        const list = res.list
        setApiOrders(list)
        cachedApiOrders = list
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              `${ORDERS_CACHE_KEY_PREFIX}${shopId}`,
              JSON.stringify(list),
            )
          }
        } catch {
          // ignore cache write error
        }
        const ids = Array.from(new Set(list.map((o) => o.userId).filter((id): id is string => !!id)))
        if (ids.length === 0) return
        try {
          const results = await Promise.all(
            ids.map(async (id) => {
              try {
                const u = await api.get<{ account?: string }>(
                  `/api/users/${encodeURIComponent(id)}`,
                )
                const label = u.account
                  ? maskAccount(u.account)
                  : lang === 'zh'
                    ? `用户 ${id}`
                    : `User ${id}`
                return { id, label }
              } catch {
                return {
                  id,
                  label: lang === 'zh' ? `用户 ${id}` : `User ${id}`,
                }
              }
            }),
          )
          setBuyerAccounts((prev) => {
            const next = { ...prev }
            for (const { id, label } of results) {
              if (!next[id]) next[id] = label
            }
            cachedBuyerAccounts = next
            return next
          })
        } catch {
          // ignore buyer fetch error
        }
      })
      .catch(() => {
        if (!silent) {
          setApiOrders([])
          cachedApiOrders = []
        }
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [apiOrders.length, lang])

  useEffect(() => {
    // 首次进入：如果有缓存，先用缓存渲染，再静默刷新；否则正常加载
    if (cachedApiOrders && cachedApiOrders.length > 0) {
      setApiOrders(cachedApiOrders)
      if (cachedBuyerAccounts) {
        setBuyerAccounts(cachedBuyerAccounts)
      }
      loadOrders(true)
    } else {
      loadOrders(false)
    }
  }, [loadOrders])

  // 页面重新可见时立即拉取一次
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && getAuthShopId()) loadOrders(true)
    }
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', onVisibilityChange)
      return () => document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [loadOrders])

  // 定时轮询：后台修改状态后店铺端无需操作即可在数秒内看到更新
  useEffect(() => {
    if (!getAuthShopId()) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadOrders(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const orderList = useMemo(
    () =>
      apiOrders.map<OrderItem>((o) => {
        const status = API_STATUS_TO_TAB[o.status] ?? 'paid'
        const items = o.items ?? []
        const first = items[0]
        const totalItems = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0)
        const buyerLabel = o.userId
          ? buyerAccounts[o.userId] ??
            (lang === 'zh' ? `用户 ${o.userId}` : `User ${o.userId}`)
          : '—'
        const separator = lang === 'zh' ? '、' : ', '
        return {
          id: o.id,
          orderNo: o.orderNumber,
          orderTime: o.createdAt.replace('T', ' ').slice(0, 19),
          buyer: buyerLabel,
          productCodes:
            items
              .map(
                (i) => `${truncateProductName(i.title, 14)} x${i.quantity}`,
              )
              .join(separator) || '—',
          amount: o.amount,
          procurementTotal: typeof o.procurementTotal === 'number' ? o.procurementTotal : 0,
          status,
          firstProductTitle: truncateProductName(first?.title ?? '', 16),
          firstProductImage: first?.image,
          totalItems: totalItems || items.length || 0,
        }
      }),
    [apiOrders, buyerAccounts, lang],
  )
  const orderDetail: OrderDetail | null = detailOrder
    ? (() => {
        const o = apiOrders.find((x) => x.id === detailOrder.id)
        if (o) {
          return {
            ...detailOrder,
            products: (o.items ?? []).map((i) => ({
              sku: i.id,
              specDisplay: normalizeSpecDisplay(i.spec),
              name: i.title,
              qty: i.quantity,
              price: i.price,
              image: i.image,
            })),
            address: formatOrderAddress(o.address, lang),
            trackingNo: o.trackingNo,
          }
        }
        return { ...detailOrder, products: [], address: '—' }
      })()
    : null

  const filteredOrders = useMemo(() => {
    let list = orderList
    if (activeStatus !== 'all') list = list.filter((o) => o.status === activeStatus)
    if (orderNoSearch.trim()) list = list.filter((o) => o.orderNo.toLowerCase().includes(orderNoSearch.trim().toLowerCase()))
    return list
  }, [orderList, activeStatus, orderNoSearch])

  const handleShip = async () => {
    if (!settleOrder) return
    setShipSubmitting(true)
    try {
      const res = await api.post<{ success?: boolean; status?: string; settleAmount?: number; walletBalance?: number }>(
        `/api/orders/${settleOrder.id}/merchant-ship`,
        {},
      )
      setApiOrders((prev) =>
        prev.map((o) =>
          o.id === settleOrder.id
            ? { ...o, status: res.status ?? 'shipped' }
            : o,
        ),
      )
      // 如果详情抽屉正打开同一单，也同步状态
      setDetailOrder((prev) =>
        prev && prev.id === settleOrder.id ? { ...prev, status: (res.status as any) ?? 'shipped' } : prev,
      )
      setShipModalOpen(false)
      setSettleOrder(null)
      if (typeof res.settleAmount === 'number') {
        showToast(
          lang === 'zh'
            ? `发货成功，本次已从店铺余额扣除采购总价 $${res.settleAmount.toFixed(2)}`
            : `Shipment successful. Purchase total $${res.settleAmount.toFixed(
                2,
              )} has been deducted from your shop balance.`,
          'success',
        )
      } else {
        showToast(
          lang === 'zh' ? '发货成功' : 'Shipment successful',
          'success',
        )
      }
    } catch (e: any) {
      const msg: string =
        e?.response?.message ||
        e?.message ||
        (lang === 'zh'
          ? '发货失败，请稍后重试'
          : 'Shipment failed, please try again later')
      showToast(msg, 'error')
    } finally {
      setShipSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const currentOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="merchant-orders-page">
      <header className="merchant-orders-header">
        <div className="merchant-orders-header-inner">
          <h1 className="merchant-orders-title">
            {lang === 'zh' ? '店铺订单' : 'Shop orders'}
          </h1>
          <p className="merchant-orders-subtitle">
            {lang === 'zh'
              ? '积极处理订单有助于提升店铺权重，增加曝光率'
              : 'Actively handling orders helps improve your shop ranking and exposure.'}
          </p>
        </div>
      </header>

      <section className="merchant-orders-section">
        <div className="merchant-orders-toolbar">
          <div className="merchant-orders-tabs">
            {STATUS_TABS.map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                className={`merchant-orders-tab${
                  activeStatus === statusKey ? ' merchant-orders-tab--active' : ''
                }`}
                onClick={() => setActiveStatus(statusKey)}
              >
                {getStatusTabLabel(statusKey, lang)}
              </button>
            ))}
          </div>
          <div className="merchant-orders-search">
            <input
              type="text"
              className="merchant-orders-search-input"
              placeholder={lang === 'zh' ? '搜索订单号' : 'Search by order number'}
              value={orderNoSearch}
              onChange={(e) => setOrderNoSearch(e.target.value)}
            />
            <button
              type="button"
              className="merchant-orders-refresh-btn"
              onClick={() => loadOrders()}
              disabled={loading}
              title={
                lang === 'zh'
                  ? '刷新订单列表（管理员修改状态后会同步显示）'
                  : 'Refresh order list (sync changes made in admin)'
              }
            >
              {lang === 'zh' ? '刷新' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="merchant-orders-table-wrap">
          {loading ? (
            <div className="merchant-orders-empty">
              <p className="merchant-orders-empty-text">
                {lang === 'zh' ? '加载中…' : 'Loading…'}
              </p>
            </div>
          ) : currentOrders.length === 0 ? (
            <div className="merchant-orders-empty">
              <div className="merchant-orders-empty-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              </div>
              <p className="merchant-orders-empty-text">
                {lang === 'zh' ? '暂无订单' : 'No orders yet'}
              </p>
              <p className="merchant-orders-empty-hint">
                {lang === 'zh'
                  ? '切换状态或修改搜索条件试试'
                  : 'Try switching status or changing search conditions.'}
              </p>
            </div>
          ) : (
            <div className="merchant-orders-card-list">
              {currentOrders.map((order) => (
                <article key={order.id} className="merchant-orders-card">
                  <div className="merchant-orders-card-head">
                    <div className="merchant-orders-card-row">
                      <span className="merchant-orders-card-order-label">
                        {lang === 'zh' ? '订单号' : 'Order No.'}
                      </span>
                      <span className="merchant-orders-card-order-no">{order.orderNo}</span>
                    </div>
                    <span
                      className={`merchant-orders-status merchant-orders-status--${order.status}`}
                    >
                      {getStatusLabel(order.status, lang)}
                    </span>
                  </div>
                  <div className="merchant-orders-card-body">
                    <div className="merchant-orders-card-meta-col">
                      <div className="merchant-orders-card-row">
                        <span className="merchant-orders-card-meta-label">
                          {lang === 'zh' ? '下单时间' : 'Order time'}
                        </span>
                        <span className="merchant-orders-card-meta-value">{order.orderTime}</span>
                      </div>
                      <div className="merchant-orders-card-row">
                        <span className="merchant-orders-card-meta-label">
                          {lang === 'zh' ? '买家' : 'Buyer'}
                        </span>
                        <span className="merchant-orders-card-meta-value">{order.buyer}</span>
                      </div>
                    </div>
                    <div className="merchant-orders-card-products-col">
                      <div className="merchant-orders-card-products">
                        {order.firstProductImage && (
                          <div className="merchant-orders-card-thumb">
                            <img
                              src={order.firstProductImage}
                              alt={
                                order.firstProductTitle ||
                                (lang === 'zh' ? '商品图片' : 'Product image')
                              }
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="merchant-orders-card-products-text">
                          <div className="merchant-orders-card-product-title">
                            {order.firstProductTitle || order.productCodes || '—'}
                          </div>
                          {order.totalItems > 0 && (
                            <div className="merchant-orders-card-product-sub">
                              {lang === 'zh'
                                ? `共 ${order.totalItems} 件商品`
                                : `${order.totalItems} item(s)`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="merchant-orders-card-foot">
                    <div className="merchant-orders-card-amount">
                      <span className="merchant-orders-card-amount-label">
                        {lang === 'zh' ? '买家实付金额' : 'Buyer paid amount'}
                      </span>
                      <span className="merchant-orders-card-amount-value">
                        ${order.amount.toFixed(2)}
                      </span>
                      <span className="merchant-orders-card-amount-sub">
                        {lang === 'zh' ? '采购总价' : 'Purchase total'} $
                        {order.procurementTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="merchant-orders-actions">
                      <button
                        type="button"
                        className="merchant-orders-action-btn"
                        onClick={() => setDetailOrder(order)}
                      >
                        {lang === 'zh' ? '查看' : 'View'}
                      </button>
                      {order.status === 'paid' && (
                        <button
                          type="button"
                          className="merchant-orders-action-btn merchant-orders-action-btn--primary"
                          onClick={() => { setSettleOrder(order); setShipModalOpen(true) }}
                        >
                          {lang === 'zh' ? '发货' : 'Ship'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="merchant-orders-pagination">
            <button
              type="button"
              className="merchant-orders-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {lang === 'zh' ? '上一页' : 'Previous'}
            </button>
            <span className="merchant-orders-page-info">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="merchant-orders-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {lang === 'zh' ? '下一页' : 'Next'}
            </button>
          </div>
        )}
      </section>

      {/* 结算弹窗打开时，暂时隐藏抽屉与其遮罩，避免“阴影残留/叠加” */}
      {orderDetail && !shipModalOpen && (
        <>
          <div
            className="merchant-orders-drawer-overlay"
            onClick={() => setDetailOrder(null)}
            role="presentation"
            aria-hidden="true"
          />
          <aside
            className="merchant-orders-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-orders-drawer-title"
          >
            <div className="merchant-orders-drawer-head">
              <h2
                id="merchant-orders-drawer-title"
                className="merchant-orders-drawer-title"
              >
                {lang === 'zh' ? '订单详情' : 'Order details'}
              </h2>
              <button
                type="button"
                className="merchant-orders-drawer-close"
                onClick={() => setDetailOrder(null)}
                aria-label={lang === 'zh' ? '关闭' : 'Close'}
              >
                ×
              </button>
            </div>
            <div className="merchant-orders-drawer-body">
              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {lang === 'zh' ? '基本信息' : 'Basic info'}
                </h3>
                <dl className="merchant-orders-detail-dl">
                  <dt>{lang === 'zh' ? '订单号' : 'Order No.'}</dt>
                  <dd>{orderDetail.orderNo}</dd>
                  <dt>{lang === 'zh' ? '下单时间' : 'Order time'}</dt>
                  <dd>{orderDetail.orderTime}</dd>
                  <dt>{lang === 'zh' ? '订单状态' : 'Order status'}</dt>
                  <dd>
                    <span className={`merchant-orders-status merchant-orders-status--${orderDetail.status}`}>
                      {getStatusLabel(orderDetail.status, lang)}
                    </span>
                  </dd>
                </dl>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {lang === 'zh' ? '买家信息' : 'Buyer info'}
                </h3>
                <div className="merchant-orders-detail-buyer-row">
                  <dl className="merchant-orders-detail-dl">
                    <dt>{lang === 'zh' ? '买家' : 'Buyer'}</dt>
                    <dd>{orderDetail.buyer}</dd>
                  </dl>
                </div>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {lang === 'zh' ? '商品信息' : 'Products'}
                </h3>
                <ul className="merchant-orders-detail-products">
                  {orderDetail.products.map((p, i) => (
                    <li key={i} className="merchant-orders-detail-product">
                      {p.image && (
                        <div className="merchant-orders-detail-product-thumb">
                          <img src={p.image} alt={p.name} loading="lazy" />
                        </div>
                      )}
                      <div className="merchant-orders-detail-product-main">
                        <span className="merchant-orders-detail-product-name" title={p.name}>
                          {truncateProductName(p.name, 24)}
                        </span>
                        <span className="merchant-orders-detail-product-meta">
                          {p.specDisplay} × {p.qty}
                        </span>
                      </div>
                      <span className="merchant-orders-detail-product-price">
                        ${(p.price * p.qty).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {lang === 'zh' ? '订单金额' : 'Order amount'}
                </h3>
                <div className="merchant-orders-detail-amount-row">
                  <span>{lang === 'zh' ? '买家实付金额' : 'Buyer paid amount'}</span>
                  <strong>${orderDetail.amount.toFixed(2)}</strong>
                </div>
                <div className="merchant-orders-detail-amount-row merchant-orders-detail-amount-row--sub">
                  <span>{lang === 'zh' ? '采购总价' : 'Purchase total'}</span>
                  <span>${orderDetail.procurementTotal.toFixed(2)}</span>
                </div>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {lang === 'zh' ? '收货地址' : 'Shipping address'}
                </h3>
                <p className="merchant-orders-detail-address">{orderDetail.address}</p>
              </section>

              {orderDetail.trackingNo && (
                <section className="merchant-orders-detail-block">
                  <h3 className="merchant-orders-detail-block-title">
                    {lang === 'zh' ? '物流信息' : 'Logistics'}
                  </h3>
                  <dl className="merchant-orders-detail-dl">
                    <dt>{lang === 'zh' ? '物流单号' : 'Tracking No.'}</dt>
                    <dd className="merchant-orders-detail-tracking">{orderDetail.trackingNo}</dd>
                  </dl>
                </section>
              )}

              <section className="merchant-orders-detail-actions">
                {orderDetail.status === 'paid' && (
                  <button
                    type="button"
                    className="merchant-orders-detail-btn merchant-orders-detail-btn--primary"
                    onClick={() => { setSettleOrder(orderDetail); setShipModalOpen(true) }}
                  >
                    {lang === 'zh' ? '发货' : 'Ship'}
                  </button>
                )}
                {orderDetail.status === 'shipped' && orderDetail.trackingNo && (
                  <button type="button" className="merchant-orders-detail-btn">
                    {lang === 'zh' ? '更新物流' : 'Update logistics'}
                  </button>
                )}
                <button
                  type="button"
                  className="merchant-orders-detail-btn"
                  onClick={() => setDetailOrder(null)}
                >
                  {lang === 'zh' ? '关闭' : 'Close'}
                </button>
              </section>
            </div>
          </aside>
        </>
      )}

      {shipModalOpen && settleOrder && (
        <div className="merchant-orders-ship-overlay" role="dialog" aria-modal="true" aria-labelledby="merchant-orders-settle-title">
          <div
            className="merchant-orders-ship-backdrop"
            onClick={() => { setShipModalOpen(false); setSettleOrder(null) }}
            aria-hidden="true"
          />
          <div className="merchant-orders-settle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="merchant-orders-settle-head">
              <h2 id="merchant-orders-settle-title" className="merchant-orders-settle-title">
                {lang === 'zh' ? '发货结算' : 'Shipment settlement'}
              </h2>
              <p className="merchant-orders-settle-order-no">
                {lang === 'zh' ? '订单号：' : 'Order No: '}
                {settleOrder.orderNo}
              </p>
            </div>
            {settlePreviewLoading && (
              <div className="merchant-orders-settle-loading">
                {lang === 'zh' ? '加载结算信息中…' : 'Loading settlement info…'}
              </div>
            )}
            {settlePreviewError && (
              <div className="merchant-orders-settle-error">{settlePreviewError}</div>
            )}
            {!settlePreviewLoading && !settlePreviewError && settlePreview && (() => {
              const { orderAmount, procurementTotal, walletBalance } = settlePreview
              const profitAmount = Math.round((orderAmount - procurementTotal) * 100) / 100
              const profitRatio = procurementTotal > 0
                ? Math.round((profitAmount / procurementTotal) * 1000) / 10
                : 0
              const expectedTotal = orderAmount
              const canSettle = walletBalance >= procurementTotal
              return (
                <>
                  <div className="merchant-orders-settle-card">
                    <div className="merchant-orders-settle-row merchant-orders-settle-row--amount">
                      <span className="merchant-orders-settle-label">
                        {lang === 'zh' ? '订单金额（买家实付）' : 'Order amount (buyer paid)'}
                      </span>
                      <span className="merchant-orders-settle-value">${orderAmount.toFixed(2)}</span>
                    </div>
                    <div className="merchant-orders-settle-row">
                      <span className="merchant-orders-settle-label">
                        {lang === 'zh' ? '采购总价' : 'Purchase total'}
                      </span>
                      <span className="merchant-orders-settle-value">${procurementTotal.toFixed(2)}</span>
                    </div>
                    <div className="merchant-orders-settle-row merchant-orders-settle-row--profit">
                      <span className="merchant-orders-settle-label">
                        {lang === 'zh' ? '利润金额' : 'Profit amount'}
                      </span>
                      <span className="merchant-orders-settle-value merchant-orders-settle-value--profit">
                        ${profitAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="merchant-orders-settle-row">
                      <span className="merchant-orders-settle-label">
                        {lang === 'zh' ? '利润比' : 'Profit ratio'}
                      </span>
                      <span className="merchant-orders-settle-value merchant-orders-settle-value--ratio">
                        {profitRatio}%
                      </span>
                    </div>
                    <div className="merchant-orders-settle-divider" />
                    <div className="merchant-orders-settle-row merchant-orders-settle-row--total">
                      <span className="merchant-orders-settle-label">
                        {lang === 'zh' ? '预计回款总额' : 'Expected total payout'}
                      </span>
                      <span className="merchant-orders-settle-value merchant-orders-settle-value--total">
                        ${expectedTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="merchant-orders-settle-wallet">
                      <span className="merchant-orders-settle-label">
                        {lang === 'zh' ? '当前店铺余额' : 'Current shop balance'}
                      </span>
                      <span className={`merchant-orders-settle-value ${!canSettle ? 'merchant-orders-settle-value--insufficient' : ''}`}>
                        ${walletBalance.toFixed(2)}
                        {!canSettle && (
                          <em className="merchant-orders-settle-insufficient">
                            {lang === 'zh' ? '（余额不足）' : '(Insufficient balance)'}
                          </em>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="merchant-orders-settle-actions">
                    <button
                      type="button"
                      className="merchant-orders-settle-btn"
                      onClick={() => { setShipModalOpen(false); setSettleOrder(null) }}
                    >
                      {lang === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      className="merchant-orders-settle-btn merchant-orders-settle-btn--primary"
                      disabled={shipSubmitting || !canSettle}
                      onClick={handleShip}
                    >
                      {shipSubmitting
                        ? lang === 'zh'
                          ? '提交中…'
                          : 'Submitting…'
                        : lang === 'zh'
                          ? '确认发货并结算'
                          : 'Confirm shipment and settle'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantOrders
