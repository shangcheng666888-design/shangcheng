/** 订单内商品快照（与购物车项结构一致，便于恢复购物车） */
export type OrderItemSnapshot = {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
  spec?: string
}

/** 订单状态（用户端展示） */
export type OrderStatus =
  | 'pending'         // 待支付
  | 'shipping'        // 待发货
  | 'outbound'        // 正在出库
  | 'transit'         // 正在配送
  | 'signed'          // 已签收
  | 'completed'       // 订单完成
  | 'return_pending'  // 申请退货
  | 'returned'        // 已退货
  | 'refund_pending'  // 正在退款
  | 'refunded'        // 已退款
  | 'cancelled'       // 已取消

/** 收件地址快照（下单时保存） */
export type OrderAddressSnapshot = {
  recipient: string
  email: string
  phoneCode: string
  phone: string
  country: string
  province: string
  city: string
  postal: string
  detail: string
}

export type Order = {
  id: string
  orderNumber: string
  status: OrderStatus
  items: OrderItemSnapshot[]
  address: OrderAddressSnapshot
  total: number
  createdAt: number
}

const ORDERS_KEY = 'accountOrders'

function loadRaw(): Order[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(ORDERS_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as Order[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRaw(orders: Order[]) {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {}
}

export function loadOrders(): Order[] {
  return loadRaw()
}

export function saveOrder(order: Order) {
  const list = loadRaw()
  const idx = list.findIndex((o) => o.id === order.id)
  if (idx >= 0) {
    list[idx] = order
  } else {
    list.unshift(order)
  }
  saveRaw(list)
}

export function createOrder(params: {
  items: OrderItemSnapshot[]
  address: OrderAddressSnapshot
  total: number
}): Order {
  const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const order: Order = {
    id,
    orderNumber: `ORD${Date.now()}`,
    status: 'pending',
    items: params.items,
    address: params.address,
    total: params.total,
    createdAt: Date.now(),
  }
  saveOrder(order)
  return order
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const list = loadRaw()
  const order = list.find((o) => o.id === orderId)
  if (!order) return null
  order.status = status
  saveRaw(list)
  return order
}

export function getOrderById(orderId: string): Order | null {
  return loadRaw().find((o) => o.id === orderId) ?? null
}

export const ORDER_STATUS_LABEL_ZH: Record<OrderStatus, string> = {
  pending: '待支付',
  shipping: '待发货',
  outbound: '正在出库',
  transit: '正在配送',
  signed: '已签收',
  completed: '订单完成',
  return_pending: '申请退货',
  returned: '已退货',
  refund_pending: '正在退款',
  refunded: '已退款',
  cancelled: '已取消',
}

export const ORDER_STATUS_LABEL_EN: Record<OrderStatus, string> = {
  pending: 'To pay',
  shipping: 'To ship',
  outbound: 'Preparing shipment',
  transit: 'In transit',
  signed: 'Delivered',
  completed: 'Completed',
  return_pending: 'Return requested',
  returned: 'Returned',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

export function getOrderStatusLabel(status: OrderStatus, lang: 'zh' | 'en'): string {
  const map = lang === 'zh' ? ORDER_STATUS_LABEL_ZH : ORDER_STATUS_LABEL_EN
  return map[status] ?? status
}
