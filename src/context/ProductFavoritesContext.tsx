import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { FavProduct } from '../utils/productFavorites'
import { api } from '../api/client'

type ProductFavoritesContextValue = {
  productFavorites: FavProduct[]
  isProductFavorited: (id: number | string) => boolean
  addProductFavorite: (product: FavProduct) => void
  removeProductFavorite: (id: number | string) => void
  toggleProductFavorite: (product: FavProduct) => boolean
  refetchFavorites: () => void
}

const ProductFavoritesContext = createContext<ProductFavoritesContextValue | null>(null)

function getAuthUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return null
    const u = JSON.parse(raw) as { id?: string }
    return u?.id ?? null
  } catch {
    return null
  }
}

function mapApiItemToFav(item: { itemId: string; title: string | null; image: string | null; price: string | null; subtitle: string | null; shopId?: string | null }): FavProduct {
  return {
    id: item.itemId,
    title: item.title ?? '',
    image: item.image ?? '',
    price: item.price ?? '',
    subtitle: item.subtitle ?? '',
    shopId: item.shopId ?? undefined,
  }
}

export function ProductFavoritesProvider({ children }: { children: React.ReactNode }) {
  // 商品收藏只走后端持久化（不再使用 localStorage 假数据）
  const [productFavorites, setProductFavorites] = useState<FavProduct[]>([])

  const refetchFavorites = useCallback(() => {
    const userId = getAuthUserId()
    if (!userId) {
      setProductFavorites([])
      return
    }
    api.get<{ list: Array<{ itemId: string; title: string | null; image: string | null; price: string | null; subtitle: string | null; shopId?: string | null }> }>(`/api/users/${userId}/favorites`)
      .then((res) => {
        const list = Array.isArray(res.list) ? res.list.map(mapApiItemToFav) : []
        setProductFavorites(list)
      })
      .catch(() => setProductFavorites([]))
  }, [])

  useEffect(() => {
    refetchFavorites()
  }, [refetchFavorites])

  const isProductFavorited = useCallback(
    (id: number | string) => productFavorites.some((p) => String(p.id) === String(id)),
    [productFavorites]
  )

  const addProductFavorite = useCallback((product: FavProduct) => {
    const userId = getAuthUserId()
    if (userId) {
      api
        .post(`/api/users/${userId}/favorites`, {
          itemId: String(product.id),
          title: product.title,
          image: product.image,
          price: product.price,
          subtitle: product.subtitle,
          shopId: product.shopId,
        })
        .then(() => refetchFavorites())
        .catch(() => {})
    }
  }, [refetchFavorites])

  const removeProductFavorite = useCallback((id: number | string) => {
    const userId = getAuthUserId()
    if (userId) {
      api
        .delete(`/api/users/${userId}/favorites/${encodeURIComponent(String(id))}`)
        .then(() => refetchFavorites())
        .catch(() => {})
    }
  }, [refetchFavorites])

  const toggleProductFavorite = useCallback(
    (product: FavProduct): boolean => {
      const idStr = String(product.id)
      const exists = productFavorites.some((p) => String(p.id) === idStr)
      if (exists) {
        removeProductFavorite(product.id)
        return false
      }
      addProductFavorite(product)
      return true
    },
    [productFavorites, addProductFavorite, removeProductFavorite]
  )

  const value = useMemo(
    () => ({
      productFavorites,
      isProductFavorited,
      addProductFavorite,
      removeProductFavorite,
      toggleProductFavorite,
      refetchFavorites,
    }),
    [productFavorites, isProductFavorited, addProductFavorite, removeProductFavorite, toggleProductFavorite, refetchFavorites]
  )

  return (
    <ProductFavoritesContext.Provider value={value}>
      {children}
    </ProductFavoritesContext.Provider>
  )
}

export function useProductFavorites(): ProductFavoritesContextValue {
  const ctx = useContext(ProductFavoritesContext)
  if (!ctx) {
    throw new Error('useProductFavorites must be used within ProductFavoritesProvider')
  }
  return ctx
}
