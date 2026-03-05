import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductFavorites } from '../context/ProductFavoritesContext'
import { useToast } from '../components/ToastProvider'
import { useLang } from '../context/LangContext'

export interface ProductCardProps {
  id: number | string
  image: string
  price: string
  title: string
  subtitle: string
  discount?: string
  /** 店铺 ID，从 API 列表传入便于下单按店拆单 */
  shopId?: string
  /** 商品仓库中的商品 ID（products.product_id），用于订单明细展示 */
  productId?: string | number
}

/** 价格展示：若无金额符号则前缀 ¥ */
function formatPriceDisplay(price: string): string {
  const s = String(price).trim()
  if (/^[¥$€]/.test(s)) return s
  return `¥${s}`
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  price,
  title,
  subtitle,
  discount,
  shopId,
  productId,
}) => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { isProductFavorited, toggleProductFavorite } = useProductFavorites()
  const { showToast } = useToast()
  const favorited = isProductFavorited(id)

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    const uid = raw ? (() => { try { return (JSON.parse(raw) as { id?: string }).id } catch { return undefined } })() : undefined
    if (!uid) {
      showToast(
        lang === 'zh'
          ? '请先登录后再收藏'
          : 'Please log in before adding to favorites',
        'error',
      )
      return
    }
    toggleProductFavorite({ id, image, price, title, subtitle, discount, shopId })
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    const uid = raw ? (() => { try { return (JSON.parse(raw) as { id?: string }).id } catch { return undefined } })() : undefined
    if (!uid) {
      showToast(
        lang === 'zh' ? '请先登录后再购买' : 'Please log in before purchasing',
        'error',
      )
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    const priceNum = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0
    const directItem = {
      id: String(id),
      shopId,
      productId: productId != null ? String(productId) : undefined,
      title,
      price: priceNum,
      quantity: 1,
      image,
      spec: undefined,
    }
    navigate('/checkout', { state: { directItems: [directItem] } })
  }

  return (
    <div className="mall-product-card new-arrival-card">
      {discount && (
        <div className="product-discount-badge">{discount}</div>
      )}
      <div className="new-arrival-image-wrap">
        <img src={image} alt={title} className="new-arrival-image" />
      </div>
      <div className="new-arrival-body">
        <div className="new-arrival-price">{formatPriceDisplay(price)}</div>
        <div className="new-arrival-title" title={title}>
          {title}
        </div>
        <div className="new-arrival-subtitle" title={subtitle}>
          {subtitle}
        </div>
      </div>
      <div className="new-arrival-footer">
        <button type="button" className="new-arrival-buy" onClick={handleBuyClick}>
          <span className="new-arrival-cart-icon">🛒</span>
          <span>{lang === 'zh' ? '立即购买' : 'Buy now'}</span>
        </button>
        <button
          type="button"
          className={`new-arrival-fav${favorited ? ' new-arrival-fav--active' : ''}`}
          aria-label={
            favorited
              ? lang === 'zh'
                ? '取消收藏'
                : 'Remove from favorites'
              : lang === 'zh'
                ? '收藏'
                : 'Add to favorites'
          }
          onClick={handleFavClick}
        >
          {favorited ? '★' : '☆'}
        </button>
      </div>
    </div>
  )
}

export default ProductCard

