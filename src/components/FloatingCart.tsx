import type React from 'react'
import { useCart } from '../cart/CartContext.tsx'
import { useLang } from '../context/LangContext'

interface FloatingCartProps {
  onClick?: () => void
}

const FloatingCart: React.FC<FloatingCartProps> = ({ onClick }) => {
  const { lang } = useLang()
  const { totalCount, totalAmount } = useCart()

  return (
    <button
      type="button"
      className="floating-cart"
      aria-label={lang === 'zh' ? '购物车' : 'Cart'}
      onClick={onClick}
    >
      <div className="floating-cart-inner">
        <div className="floating-cart-top">
          <span className="floating-cart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
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
          <span className="floating-cart-text">
            {lang === 'zh' ? `${totalCount} 物品` : `${totalCount} item${totalCount === 1 ? '' : 's'}`}
          </span>
        </div>
        <div className="floating-cart-amount">
          {`$${totalAmount.toFixed(2)}`}
        </div>
      </div>
    </button>
  )
}

export default FloatingCart

