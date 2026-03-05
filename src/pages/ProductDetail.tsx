import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import productImage from '../assets/new-arrival-bag.png'
import reviewsEmpty from '../assets/reviews-empty.png'
import { useCart } from '../cart/CartContext.tsx'
import AddToCartSuccessModal from '../components/AddToCartSuccessModal'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import { getCategoryNameZh } from '../constants/categoryNameZh'
import { formatSkuAttrsDisplay, getAttrOptionsFromSkus, findSkuByAttrs } from '../constants/skuAttrDisplay'
import SkuAttrSelect from '../components/SkuAttrSelect'
import { useLang } from '../context/LangContext'
import { sanitizeHtml } from '../utils/sanitizeHtml'

interface ListingSku {
  sku_id: string
  product_id: string
  attrs: Record<string, string> | string | null
  purchase_price: number | null
  selling_price: number | null
  cover_img: string | null
  images: string[] | null
}

interface ShopInfo {
  id: string
  name: string
  logo: string | null
  creditScore: number
  followers: number
  goodRate?: number
  productCount?: number
}

interface ListingDetail {
  id: string
  listingId: string
  shopId: string
  productId: string
  title: string
  image: string
  images: string[]
  price: number
  purchasePrice?: number
  category: string
  subCategory: string
  descriptionHtml?: string
  detailHtml?: string
  listedAt?: string
  skus: ListingSku[]
}

function toPrice(v: unknown): number {
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const ProductDetail: React.FC = () => {
  const { lang } = useLang()
  const { id } = useParams<{ id: string }>()
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isGalleryPaused, setIsGalleryPaused] = useState(false)
  const [addSuccessOpen, setAddSuccessOpen] = useState(false)
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSku, setSelectedSku] = useState<ListingSku | null>(null)
  /** 规格选择：属性标签 -> 原始值，用于下拉框 */
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const thumbsWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError(lang === 'zh' ? '缺少商品 ID' : 'Missing product ID')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setShopInfo(null)
    api
      .get<ListingDetail>(`/api/listings/${encodeURIComponent(id)}`)
      .then((res) => {
        if (cancelled) return
        const mainImages = Array.isArray((res as { images?: string[] }).images)
          ? (res as { images: string[] }).images.filter((s): s is string => typeof s === 'string')
          : (res as { image?: string }).image
            ? [(res as { image: string }).image]
            : []
        setListing({
          ...res,
          images: mainImages.length > 0 ? mainImages : (res as { image?: string }).image ? [(res as { image: string }).image] : [],
          skus: Array.isArray((res as { skus?: unknown[] }).skus) ? (res as { skus: ListingSku[] }).skus : [],
        })
        setSelectedSku(null)
        setSelectedAttrs({})
        const sid = (res as { shopId?: string }).shopId
        if (sid) {
          api
            .get<ShopInfo & { productCount?: number }>(`/api/shops/${encodeURIComponent(sid)}`)
            .then((s) => {
              if (!cancelled)
                setShopInfo({
                  id: s.id,
                  name: s.name,
                  logo: s.logo ?? null,
                  creditScore: Number(s.creditScore) || 0,
                  followers: Number(s.followers) || 0,
                  goodRate: s.goodRate != null ? Number(s.goodRate) : undefined,
                  productCount: s.productCount,
                })
            })
            .catch(() => {
              if (!cancelled) setShopInfo(null)
            })
        } else {
          setShopInfo(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载失败')
          setListing(null)
        setShopInfo(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const images = (() => {
    if (selectedSku) {
      const cover = selectedSku.cover_img ?? (selectedSku as { coverImg?: string }).coverImg
      const skuImages = selectedSku.images ?? (selectedSku as { images?: string[] }).images
      const arr = Array.isArray(skuImages) ? skuImages.filter((s): s is string => typeof s === 'string') : []
      const combined = cover && typeof cover === 'string' ? [cover, ...arr.filter((u) => u !== cover)] : arr
      const seen = new Set<string>()
      return combined.filter((u) => {
        if (seen.has(u)) return false
        seen.add(u)
        return true
      })
    }
    if (listing?.images?.length) return listing.images
    if (listing?.image) return [listing.image]
    return [productImage]
  })()
  useEffect(() => {
    setActiveImage(0)
  }, [selectedSku?.sku_id])

  const unitPrice = (() => {
    const sp = toPrice(selectedSku?.selling_price)
    const lp = toPrice(listing?.price)
    return sp > 0 ? sp : lp
  })()

  useEffect(() => {
    if (isGalleryPaused || images.length <= 1) return
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length, isGalleryPaused])

  useEffect(() => {
    const wrap = thumbsWrapRef.current
    const el = thumbRefs.current[activeImage]
    if (!wrap || !el) return
    const wrapRect = wrap.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const scrollLeft = wrap.scrollLeft + (elRect.left - wrapRect.left) - wrapRect.width / 2 + elRect.width / 2
    wrap.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
  }, [activeImage])

  const handleQuantityChange = (type: 'dec' | 'inc') => {
    setQuantity((q) => {
      if (type === 'dec') return Math.max(1, q - 1)
      return q + 1
    })
  }

  const handleAddToCart = (goCheckout: boolean) => {
    if (!listing) return
    if (listing.skus && listing.skus.length > 0 && !selectedSku) {
      showToast(
        lang === 'zh' ? '请先选择规格' : 'Please select a variant first',
        'error',
      )
      return
    }
    if (goCheckout) {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
        const uid = raw ? (JSON.parse(raw) as { id?: string })?.id : null
        if (!uid) {
          showToast(
            lang === 'zh' ? '请先登录后再购买' : 'Please log in before purchasing',
            'error',
          )
          navigate('/login', { state: { from: '/checkout' } })
          return
        }
      } catch {
        showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
        navigate('/login', { state: { from: '/checkout' } })
        return
      }
    }
    const spec = selectedSku ? formatSkuAttrsDisplay(selectedSku.attrs) : ''
    const cartId = selectedSku ? `${listing.listingId ?? listing.id}-${selectedSku.sku_id}` : (listing.listingId ?? listing.id)
    const item = {
      id: cartId,
      shopId: listing.shopId,
      productId: listing.productId,
      title: listing.title,
      price: unitPrice,
      quantity,
      image: listing.image || images[0],
      spec: spec || undefined,
    }
    if (goCheckout) {
      navigate('/checkout', { state: { directItems: [item] } })
    } else {
      addItem(item)
      setAddSuccessOpen(true)
    }
  }

  const description = (listing?.descriptionHtml || listing?.detailHtml || '').trim()

  const attrSelectors = listing?.skus?.length
    ? getAttrOptionsFromSkus(listing.skus as Parameters<typeof getAttrOptionsFromSkus>[0])
    : []

  const handleAttrChange = (label: string, rawValue: string) => {
    const next = { ...selectedAttrs, [label]: rawValue }
    setSelectedAttrs(next)
    const found = findSkuByAttrs(
      listing!.skus as unknown as Array<{ attrs: unknown; sku_id: string; [k: string]: unknown }>,
      next
    )
    setSelectedSku((found ?? null) as ListingSku | null)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/products')
    }
  }

  if (loading) {
    return (
      <div className="page product-detail-page">
        <button
          type="button"
          className="product-detail-mobile-back"
          onClick={handleBack}
          aria-label={lang === 'zh' ? '返回' : 'Back'}
        >
          <span className="product-detail-mobile-back-icon" aria-hidden>←</span>
          <span className="product-detail-mobile-back-text">
            {lang === 'zh' ? '返回' : 'Back'}
          </span>
        </button>
        <div className="product-detail-main" style={{ padding: '2rem', textAlign: 'center' }}>
          {lang === 'zh' ? '加载中…' : 'Loading…'}
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="page product-detail-page">
        <button
          type="button"
          className="product-detail-mobile-back"
          onClick={handleBack}
          aria-label={lang === 'zh' ? '返回' : 'Back'}
        >
          <span className="product-detail-mobile-back-icon" aria-hidden>←</span>
          <span className="product-detail-mobile-back-text">
            {lang === 'zh' ? '返回' : 'Back'}
          </span>
        </button>
        <div className="product-detail-main" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>
            {error ||
              (lang === 'zh'
                ? '商品不存在或已下架'
                : 'Product does not exist or has been removed')}
          </p>
          <Link to="/products" className="product-detail-back-link">
            {lang === 'zh' ? '< 返回商品列表' : '< Back to product list'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page product-detail-page">
      <AddToCartSuccessModal open={addSuccessOpen} onClose={() => setAddSuccessOpen(false)} />
      <button
        type="button"
        className="product-detail-mobile-back"
        onClick={handleBack}
        aria-label={lang === 'zh' ? '返回' : 'Back'}
      >
        <span className="product-detail-mobile-back-icon" aria-hidden>←</span>
        <span className="product-detail-mobile-back-text">
          {lang === 'zh' ? '返回' : 'Back'}
        </span>
      </button>
      <div className="product-detail-main">
        <div
          className="product-detail-gallery"
          onMouseEnter={() => setIsGalleryPaused(true)}
          onMouseLeave={() => setIsGalleryPaused(false)}
        >
          <div className="product-detail-image-main">
            <img src={images[activeImage] || productImage} alt={listing.title} />
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbs-wrap" ref={thumbsWrapRef}>
              <div className="product-detail-thumbs">
                {images.map((img, index) => (
                  <button
                    key={index}
                    ref={(el) => { thumbRefs.current[index] = el }}
                    type="button"
                    className={`product-detail-thumb${activeImage === index ? ' product-detail-thumb--active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={img} alt={`${listing.title} 图 ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-title">{listing.title}</h1>
          <div className="product-detail-subtitle">
            {lang === 'zh'
              ? getCategoryNameZh(listing.subCategory) ||
                getCategoryNameZh(listing.category) ||
                listing.subCategory ||
                listing.category
              : listing.subCategory || listing.category}
          </div>

          <div className="product-detail-field-list">
            <div className="product-detail-field">
              <span className="product-detail-field-label">
                {lang === 'zh' ? '零售价' : 'Retail price'}
              </span>
              <span className="product-detail-price-value">${unitPrice.toFixed(2)}</span>
            </div>
            <div className="product-detail-field">
              <span className="product-detail-field-label">
                {lang === 'zh' ? '发货' : 'Shipping time'}
              </span>
              <span className="product-detail-field-value">
                {lang === 'zh'
                  ? '商品下单后，24 小时内发货。如下单存在物流管控，订单可能被延时发货，请留意订单物流信息或联系客服'
                  : 'Orders are shipped within 24 hours after payment. If there are logistics controls, delivery may be delayed — please follow the tracking info or contact support.'}
              </span>
            </div>
            <div className="product-detail-field">
              <span className="product-detail-field-label">
                {lang === 'zh' ? '运费' : 'Shipping fee'}
              </span>
              <span className="product-detail-field-value product-detail-freight">
                {lang === 'zh' ? '免运费' : 'Free shipping'}
                <span className="product-detail-info-icon-wrapper">
                  <span className="product-detail-info-icon" aria-hidden="true">i</span>
                  <div className="product-detail-info-tooltip">
                    {lang === 'zh' ? (
                      <>
                        1、跨境商品运费构成：运费=派送费+长途运费+送货费<br />
                        2、如不满足包邮条件，按实际收取运费产品<br />
                        3、最终解释权归平台所有
                      </>
                    ) : (
                      <>
                        1. Cross‑border shipping fee = delivery fee + long‑distance fee + door‑to‑door
                        fee
                        <br />
                        2. If free‑shipping conditions are not met, shipping will be charged as shown on
                        the product page
                        <br />
                        3. The platform reserves the final right of interpretation
                      </>
                    )}
                  </div>
                </span>
              </span>
            </div>
            {attrSelectors.some((s) => s.label !== '颜色') && (
              attrSelectors
                .filter((s) => s.label !== '颜色')
                .map(({ label, options }) => (
                  <div key={label} className="product-detail-field">
                    <span className="product-detail-field-label">{label}</span>
                    <div className="product-detail-field-value">
                      <SkuAttrSelect
                        label=""
                        options={options}
                        value={selectedAttrs[label] ?? ''}
                        onChange={(raw) => handleAttrChange(label, raw)}
                      />
                    </div>
                  </div>
                ))
            )}
            {attrSelectors.some((s) => s.label === '颜色') && (
              <div className="product-detail-field product-detail-sku-color-field">
                <span className="product-detail-field-label" aria-hidden="true" />
                <div className="product-detail-sku-color-grid">
                  {attrSelectors
                    .filter((s) => s.label === '颜色')
                    .flatMap(({ label, options }) =>
                      options.map((opt) => {
                        const isSelected = selectedAttrs[label] === opt.raw
                          return (
                            <button
                              key={opt.raw}
                              type="button"
                              className={`product-detail-sku-color-swatch${isSelected ? ' product-detail-sku-color-swatch--active' : ''}`}
                              onClick={() => handleAttrChange(label, opt.raw)}
                              title={opt.display}
                              aria-label={opt.display}
                            >
                              {opt.image ? (
                                <img src={opt.image} alt={opt.display} />
                              ) : (
                                <span className="product-detail-sku-color-swatch-text">{opt.display}</span>
                              )}
                            </button>
                          )
                      }))
                  }
                </div>
              </div>
            )}
            <div className="product-detail-field">
              <span className="product-detail-field-label">
                {lang === 'zh' ? '数量' : 'Quantity'}
              </span>
              <div className="product-detail-field-value">
                <div className="product-detail-qty-control">
                  <button type="button" className="product-detail-qty-btn" onClick={() => handleQuantityChange('dec')} disabled={quantity <= 1}>-</button>
                  <span className="product-detail-qty-value">{quantity}</span>
                  <button type="button" className="product-detail-qty-btn" onClick={() => handleQuantityChange('inc')}>+</button>
                </div>
              </div>
            </div>
            <div className="product-detail-field">
              <span className="product-detail-field-label">
                {lang === 'zh' ? '总价' : 'Total'}
              </span>
              <span className="product-detail-field-value product-detail-total">
                ${(unitPrice * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="product-detail-buttons">
            <button
              type="button"
              className="product-detail-btn product-detail-btn-primary"
              onClick={() => handleAddToCart(true)}
            >
              {lang === 'zh' ? '立即购买' : 'Buy now'}
            </button>
            <button
              type="button"
              className="product-detail-btn product-detail-btn-secondary"
              onClick={() => handleAddToCart(false)}
            >
              {lang === 'zh' ? '添加购物车' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>

      {description && (
        <section className="product-detail-desc">
          <h2 className="product-detail-desc-title">
            {lang === 'zh' ? '商品描述' : 'Product description'}
          </h2>
          <div
            className="product-detail-desc-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
          />
        </section>
      )}

      <section className="product-detail-reviews">
        <div className="product-detail-reviews-header">
          <h2 className="product-detail-reviews-title">
            {lang === 'zh' ? '用户评价 (0)' : 'Reviews (0)'}
          </h2>
        </div>
        <div className="product-detail-reviews-body">
          <img
            src={reviewsEmpty}
            alt={lang === 'zh' ? '暂无评价' : 'No reviews yet'}
            className="product-detail-reviews-empty-icon"
          />
          <div className="product-detail-reviews-empty-text">
            {lang === 'zh' ? '暂无评价' : 'No reviews yet'}
          </div>
        </div>
      </section>

      <aside className="product-detail-shop-card">
        <div className="product-detail-shop-header">
          {shopInfo?.logo ? (
            <img src={shopInfo.logo} alt={shopInfo.name} className="product-detail-shop-logo-img" />
          ) : (
            <div className="product-detail-shop-logo">{shopInfo?.name?.slice(0, 1) ?? listing.shopId?.slice(0, 1) ?? '?'}</div>
          )}
          <div className="product-detail-shop-title">{shopInfo?.name ?? listing.shopId ?? '—'}</div>
          <div className="product-detail-shop-score">{shopInfo != null ? String(shopInfo.creditScore) : '—'}</div>
        </div>
        <div className="product-detail-shop-stats">
          <div className="product-detail-shop-stat">
            <div className="product-detail-shop-stat-value">{shopInfo?.productCount ?? '—'}</div>
            <div className="product-detail-shop-stat-label">
              {lang === 'zh' ? '全部商品' : 'All products'}
            </div>
          </div>
          <div className="product-detail-shop-stat">
            <div className="product-detail-shop-stat-value">
              {shopInfo?.goodRate != null ? `${shopInfo.goodRate}%` : '—'}
            </div>
            <div className="product-detail-shop-stat-label">
              {lang === 'zh' ? '好评率' : 'Good rate'}
            </div>
          </div>
          <div className="product-detail-shop-stat">
            <div className="product-detail-shop-stat-value">{shopInfo != null ? String(shopInfo.followers) : '—'}</div>
            <div className="product-detail-shop-stat-label">
              {lang === 'zh' ? '关注度' : 'Followers'}
            </div>
          </div>
        </div>
        <Link to={`/shops/${listing.shopId}`} className="product-detail-shop-btn">
          {lang === 'zh' ? '访问商店 >' : 'Visit shop >'}
        </Link>
        <div className="product-detail-shop-recommend">
          <h3 className="product-detail-shop-recommend-title">
            {lang === 'zh' ? '推荐产品' : 'Recommended products'}
          </h3>
          <div className="product-detail-shop-recommend-list">
            <Link to="/products" className="product-detail-shop-recommend-item">
              <div className="product-detail-shop-recommend-thumb"><img src={productImage} alt="" /></div>
              <div className="product-detail-shop-recommend-info">
                <div className="product-detail-shop-recommend-name">
                  {lang === 'zh'
                    ? '更多商品请返回列表'
                    : 'For more products please go back to the list'}
                </div>
                <div className="product-detail-shop-recommend-price">—</div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      <div className="product-detail-back">
        <Link to="/products" className="product-detail-back-link">
          {lang === 'zh' ? '< 返回商品列表' : '< Back to product list'}
        </Link>
      </div>
    </div>
  )
}

export default ProductDetail
