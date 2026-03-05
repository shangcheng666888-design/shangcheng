import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

interface MerchantShop {
  id: string
  name: string
  logo: string | null
  level: number
  creditScore: number
  walletBalance: number
  goodRate: number
  followers: number
  sales: number
  visits: number
}

interface MerchantShopContextValue {
  shop: MerchantShop | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const MerchantShopContext = createContext<MerchantShopContextValue | undefined>(undefined)

function readAuthShopId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    const parsed = JSON.parse(raw) as { shopId?: string | null }
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    return shopId || null
  } catch {
    return null
  }
}

export const MerchantShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shop, setShop] = useState<MerchantShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShop = useCallback(async (silent = false) => {
    const shopId = readAuthShopId()
    if (!shopId) {
      setShop(null)
      setLoading(false)
      setError('未找到店铺信息')
      return
    }
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await api.get<{
        id: string
        name: string
        logo?: string | null
        level: number
        creditScore: number
        walletBalance: number
        goodRate: number
        followers: number
        sales: number
        visits: number
      }>(`/api/shops/${encodeURIComponent(shopId)}`)
      setShop({
        id: res.id,
        name: res.name,
        logo: res.logo ?? null,
        level: res.level ?? 1,
        creditScore: Number(res.creditScore ?? 0),
        walletBalance: Number(res.walletBalance ?? 0),
        goodRate: Number(res.goodRate ?? 0),
        followers: Number(res.followers ?? 0),
        sales: Number(res.sales ?? 0),
        visits: Number(res.visits ?? 0),
      })
      setError(null)
    } catch (e: any) {
      const msg =
        e && typeof e.message === 'string' && e.message.trim()
          ? e.message.trim()
          : '无法加载店铺信息'
      setError(msg)
      setShop(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShop(false)
  }, [fetchShop])

  return (
    <MerchantShopContext.Provider
      value={{
        shop,
        loading,
        error,
        refresh: () => fetchShop(true),
      }}
    >
      {children}
    </MerchantShopContext.Provider>
  )
}

export function useMerchantShop(): MerchantShopContextValue {
  const ctx = useContext(MerchantShopContext)
  if (!ctx) {
    throw new Error('useMerchantShop must be used within MerchantShopProvider')
  }
  return ctx
}

