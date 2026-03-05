import type React from 'react'
import { useEffect } from 'react'
import { useLang } from '../context/LangContext'

interface AddToCartSuccessModalProps {
  open: boolean
  onClose: () => void
}

const AddToCartSuccessModal: React.FC<AddToCartSuccessModalProps> = ({ open, onClose }) => {
  const { lang } = useLang()

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      onClose()
    }, 3000)
    return () => {
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="auth-success-overlay"
      role="dialog"
      aria-label={lang === 'zh' ? '已加入购物车' : 'Added to cart'}
      onClick={onClose}
    >
      <div className="auth-success-box" onClick={(e) => e.stopPropagation()}>
        <div className="auth-success-icon auth-success-icon--black">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M7 12l3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="auth-success-text">
          {lang === 'zh' ? '已加入购物车' : 'Added to cart'}
        </p>
      </div>
    </div>
  )
}

export default AddToCartSuccessModal

