import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { api } from '../api/client'

export interface CartItem {
  id: string
  /** 店铺 ID，用于按店拆单与后端下单 */
  shopId?: string
  /** 商品仓库中的商品 ID（如 230314225545003），用于订单明细展示 */
  productId?: string
  title: string
  price: number
  quantity: number
  image?: string
  spec?: string
}

interface CartContextValue {
  items: CartItem[]
  totalCount: number
  totalAmount: number
  addItem: (item: CartItem) => void
  updateItemQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: () => void
  /** 用指定商品列表替换购物车（如从待支付订单恢复） */
  replaceCart: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = 'cartItems'

function getCartUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string }
    return parsed?.id && typeof parsed.id === 'string' ? parsed.id : null
  } catch {
    return null
  }
}

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const loadedRef = useRef(false)

  const loadCart = () => {
    const uid = getCartUserId()
    if (uid) {
      api
        .get<{ items?: CartItem[] }>(`/api/cart?userId=${encodeURIComponent(uid)}`)
        .then((res) => {
          const list = Array.isArray(res.items) ? res.items : []
          setItems(list)
        })
        .catch(() => {})
    } else if (!loadedRef.current) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as CartItem[]
          if (Array.isArray(parsed)) setItems(parsed)
        }
      } catch {}
    }
  }

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadCart()
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (getCartUserId()) loadCart()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const uid = getCartUserId()
    if (uid) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem: CartContextValue['addItem'] = (item) => {
    setItems((prev) => {
      const index = prev.findIndex((p) => p.id === item.id)
      if (index === -1) return [...prev, item]
      const n = [...prev]
      n[index] = { ...n[index], quantity: n[index].quantity + item.quantity }
      return n
    })
    const uid = getCartUserId()
    if (uid) api.post('/api/cart/items', { userId: uid, item }).catch(() => {})
  }

  const updateItemQuantity: CartContextValue['updateItemQuantity'] = (id, quantity) => {
    const qty = Math.max(0, quantity)
    setItems((prev) => {
      return prev
        .map((it) => (it.id === id ? { ...it, quantity: Math.max(1, qty) } : it))
        .filter((it) => it.quantity > 0)
    })
    const uid = getCartUserId()
    if (uid) {
      if (qty <= 0) {
        api.delete(`/api/cart/items/${encodeURIComponent(id)}?userId=${encodeURIComponent(uid)}`).catch(() => {})
      } else {
        api.patch(`/api/cart/items/${encodeURIComponent(id)}`, { userId: uid, quantity: qty }).catch(() => {})
      }
    }
  }

  const removeItem: CartContextValue['removeItem'] = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    const uid = getCartUserId()
    if (uid) api.delete(`/api/cart/items/${encodeURIComponent(id)}?userId=${encodeURIComponent(uid)}`).catch(() => {})
  }

  const clear = () => {
    setItems([])
    const uid = getCartUserId()
    if (uid) {
      api.put('/api/cart', { userId: uid, items: [] }).catch(() => {})
    }
  }

  const replaceCart: CartContextValue['replaceCart'] = (newItems) => {
    const list = Array.isArray(newItems) ? [...newItems] : []
    setItems(list)
    const uid = getCartUserId()
    if (uid) {
      api.put('/api/cart', { userId: uid, items: list }).catch(() => {})
    }
  }

  const { totalCount, totalAmount } = useMemo(() => {
    const count = items.reduce((sum, it) => sum + it.quantity, 0)
    const amount = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    return { totalCount: count, totalAmount: amount }
  }, [items])

  const value: CartContextValue = {
    items,
    totalCount,
    totalAmount,
    addItem,
    updateItemQuantity,
    removeItem,
    clear,
    replaceCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}

