import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import cartEmpty from '../assets/cart-empty.png'
import { useCart } from '../cart/CartContext.tsx'
import { useLang } from '../context/LangContext'
import { useToast } from './ToastProvider'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

function getAuthUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    return (JSON.parse(raw) as { id?: string })?.id ?? null
  } catch { return null }
}

const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { items, totalCount, totalAmount, updateItemQuantity, removeItem } = useCart()

  const [selectedIds, setSelectedIds] = useState<string[]>(() => items.map((it) => it.id))

  useEffect(() => {
    setSelectedIds((prev) => {
      const nextIds = items.map((it) => it.id)
      // 初次进入或购物车清空：默认全选
      if (prev.length === 0) return nextIds
      // 保留之前存在且仍在列表中的选中状态
      const stillSelected = prev.filter((id) => nextIds.includes(id))
      // 新增的商品默认选中
      nextIds.forEach((id) => {
        if (!stillSelected.includes(id)) {
          stillSelected.push(id)
        }
      })
      return stillSelected
    })
  }, [items])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectedItems = items.filter((it) => selectedIds.includes(it.id))
  const selectedAmount = selectedItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const hasSelected = selectedItems.length > 0

  if (!open) return null

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <header className="cart-drawer-header">
          <div className="cart-drawer-title-left">
            <span className="cart-drawer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <circle cx="10" cy="19" r="1.6" fill="currentColor" />
                <circle cx="17" cy="19" r="1.6" fill="currentColor" />
                <path
                  d="M3 4h2l1.5 11h11l1.5-8H7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="cart-drawer-count">
              {lang === 'zh'
                ? `${totalCount} 物品`
                : `${totalCount} item${totalCount === 1 ? '' : 's'}`}
            </span>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            aria-label={lang === 'zh' ? '关闭购物车' : 'Close cart'}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="cart-drawer-subtitle">
          {lang === 'zh' ? '我的购物车' : 'My cart'}
        </div>

        <div className="cart-drawer-body">
          {totalCount <= 0 ? (
            <div className="cart-drawer-empty">
              <img
                src={cartEmpty}
                alt={lang === 'zh' ? '购物车还没有商品' : 'Your cart is empty'}
                className="cart-drawer-empty-img"
              />
              <div className="cart-drawer-empty-text">
                {lang === 'zh' ? '购物车还没有商品' : 'Your cart has no items yet'}
              </div>
              <button
                type="button"
                className="cart-drawer-go-btn"
                onClick={() => {
                  onClose()
                  navigate('/products')
                }}
              >
                {lang === 'zh' ? '去购物' : 'Go shopping'}
              </button>
            </div>
          ) : (
            <div className="cart-drawer-items">
              {items.map((item) => (
                <div key={item.id} className="cart-drawer-item">
                  <div className="cart-drawer-item-main">
                    <input
                      type="checkbox"
                      className="cart-drawer-item-check"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                    <div className="cart-drawer-item-thumb">
                      {item.image ? (
                        <img src={item.image} alt={item.title} />
                      ) : (
                        <div className="cart-drawer-item-thumb-placeholder" />
                      )}
                    </div>
                    <div className="cart-drawer-item-info">
                      <div className="cart-drawer-item-title" title={item.title}>
                        {item.title}
                      </div>
                      {item.spec && (
                        <div className="cart-drawer-item-spec">{item.spec}</div>
                      )}
                      <div className="cart-drawer-item-qty">
                        <div className="product-detail-qty-control">
                          <button
                            type="button"
                            className="product-detail-qty-btn"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="product-detail-qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="product-detail-qty-btn"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="cart-drawer-item-price">
                      ${item.price.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      className="cart-drawer-item-remove"
                      aria-label={lang === 'zh' ? '移除商品' : 'Remove item'}
                      onClick={() => removeItem(item.id)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 7h14M10 11v6M14 11v6M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer
          className={`cart-drawer-footer${!hasSelected ? ' cart-drawer-footer--disabled' : ''}`}
          onClick={() => {
            if (!hasSelected) return
            if (!getAuthUserId()) {
              showToast(
                lang === 'zh' ? '请先登录后再下单' : 'Please log in before checkout',
                'error',
              )
              onClose()
              navigate('/login', { state: { from: '/checkout' } })
              return
            }
            onClose()
            navigate('/checkout')
          }}
        >
          <span className="cart-drawer-footer-label">
            {lang === 'zh' ? '下单' : 'Checkout'}
          </span>
          <span className="cart-drawer-footer-amount">${selectedAmount.toFixed(2)}</span>
        </footer>
      </div>
    </div>
  )
}

export default CartDrawer

