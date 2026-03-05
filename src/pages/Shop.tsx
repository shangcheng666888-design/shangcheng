import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'

function getAuthUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    return (JSON.parse(raw) as { id?: string })?.id ?? null
  } catch { return null }
}

interface ShopInfo {
  id: string
  name: string
  logo: string | null
  banner: string | null
  productCount?: number
}

interface ShopProduct {
  listingId: string
  productId: string
  title: string
  image: string
  price: number
}

const Shop: React.FC = () => {
  const { lang } = useLang()
  const { showToast } = useToast()
  const { id } = useParams<{ id: string }>()
  const shopId = id ?? ''
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [recommendations, setRecommendations] = useState<ShopProduct[]>([])
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recommend' | 'all'>('recommend')
  const [followed, setFollowed] = useState(false)

  useEffect(() => {
    if (!shopId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([
      api.get<ShopInfo & { productCount?: number }>(`/api/shops/${shopId}`),
      api.get<{ list: ShopProduct[] }>(`/api/shops/${shopId}/recommendations`),
      api.get<{ list: ShopProduct[] }>(`/api/shops/${shopId}/products`),
    ])
      .then(([shopRes, recRes, prodRes]) => {
        if (cancelled) return
        const shopData = shopRes as ShopInfo
        const recData = recRes as { list?: ShopProduct[] }
        const prodData = prodRes as { list?: ShopProduct[] }
        setShop(shopData)
        setRecommendations(Array.isArray(recData.list) ? recData.list : [])
        setAllProducts(Array.isArray(prodData.list) ? prodData.list : [])
      })
      .catch(() => {
        if (!cancelled) {
          setShop(null)
          setRecommendations([])
          setAllProducts([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [shopId])

  // 进入店铺页时记录一次访问量（后端 shops.visits +1）
  useEffect(() => {
    if (!shopId) return
    api.post(`/api/shops/${encodeURIComponent(shopId)}/visit`).catch(() => {})
  }, [shopId])

  useEffect(() => {
    const uid = getAuthUserId()
    if (uid && shopId) {
      api.get<{ list: Array<{ shopId: string }> }>(`/api/users/${uid}/followed-shops`)
        .then((res) => {
          const list = Array.isArray(res.list) ? res.list : []
          setFollowed(list.some((s) => s.shopId === shopId))
        })
        .catch(() => setFollowed(false))
    } else {
      setFollowed(false)
    }
  }, [shopId])

  const handleFollowToggle = () => {
    const uid = getAuthUserId()
    if (uid) {
      if (followed) {
        api
          .delete(`/api/users/${uid}/followed-shops/${encodeURIComponent(shopId)}`)
          .then(() => setFollowed(false))
          .catch(() => {})
      } else {
        api
          .post(`/api/users/${uid}/followed-shops`, {
            shopId,
            shopName: shop?.name ?? (lang === 'zh' ? `店铺 ${shopId}` : `Shop ${shopId}`),
          })
          .then(() => setFollowed(true))
          .catch(() => {})
      }
    } else {
      showToast(
        lang === 'zh' ? '请先登录后再关注店铺' : 'Please log in before following a shop',
        'error',
      )
    }
  }

  const displayProducts = activeTab === 'recommend' ? recommendations : allProducts
  const bannerUrl = (shop?.banner && String(shop.banner).trim()) || null

  return (
    <div className="page shop-page">
      <div
        className="shop-hero-banner"
        style={
          bannerUrl
            ? {
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="shop-hero-overlay">
          <div className="shop-hero-left">
            <div className="shop-hero-left-card">
              <div className="shop-hero-avatar" aria-hidden="true">
                {shop?.logo ? (
                  <img src={shop.logo} alt="" className="shop-hero-avatar-img" />
                ) : (
                  (shop?.name ?? (lang === 'zh' ? '店' : 'S')).charAt(0)
                )}
              </div>
              <div className="shop-hero-meta">
                <div className="shop-hero-name">
                  {loading
                    ? (lang === 'zh' ? '加载中...' : 'Loading...')
                    : (shop?.name ?? (lang === 'zh' ? `店铺 ${shopId}` : `Shop ${shopId}`))}
                </div>
                <div className="shop-hero-welcome">
                  {lang === 'zh' ? '欢迎光临！' : 'Welcome!'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`shop-hero-follow-btn${followed ? ' shop-hero-follow-btn--active' : ''}`}
          onClick={handleFollowToggle}
        >
          {followed
            ? (lang === 'zh' ? '★ 已关注' : '★ Following')
            : (lang === 'zh' ? '☆ 关注店铺' : '☆ Follow shop')}
        </button>
      </div>

      <div className="shop-tabs">
        <button
          type="button"
          className={`shop-tab${activeTab === 'recommend' ? ' shop-tab--active' : ''}`}
          onClick={() => setActiveTab('recommend')}
        >
          {lang === 'zh' ? '推荐' : 'Recommended'}
        </button>
        <button
          type="button"
          className={`shop-tab${activeTab === 'all' ? ' shop-tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {lang === 'zh' ? '所有产品' : 'All products'}
        </button>
      </div>

      <div className="mall-product-grid card-grid shop-products-grid">
        {loading ? (
          <p className="products-empty">
            {lang === 'zh' ? '加载中...' : 'Loading...'}
          </p>
        ) : displayProducts.length === 0 ? (
          <p className="products-empty">
            {activeTab === 'recommend'
              ? (lang === 'zh' ? '暂无推荐商品' : 'No recommended products')
              : (lang === 'zh' ? '暂无商品' : 'No products yet')}
          </p>
        ) : (
          displayProducts.map((item) => (
            <Link key={item.listingId} to={`/products/${item.listingId}`} className="product-card-link">
              <ProductCard
                id={item.listingId}
                image={item.image || ''}
                price={`$${item.price.toFixed(2)}`}
                title={item.title}
                subtitle=""
                shopId={shopId}
                productId={item.productId}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default Shop
