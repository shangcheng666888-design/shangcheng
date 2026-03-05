import type React from 'react'
import { useLang } from '../context/LangContext'

interface LogoutSuccessModalProps {
  open: boolean
  onClose: () => void
}

const LogoutSuccessModal: React.FC<LogoutSuccessModalProps> = ({ open, onClose }) => {
  if (!open) return null

  const { lang } = useLang()

  const ariaLabel = lang === 'zh' ? '已退出账户' : 'Logged out'
  const text = lang === 'zh' ? '已退出账户' : 'You have been logged out'

  return (
    <div className="auth-success-overlay" role="dialog" aria-label={ariaLabel} onClick={onClose}>
      <div className="auth-success-box" onClick={(e) => e.stopPropagation()}>
        <div className="auth-success-icon auth-success-icon--black">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M9 9l6 6M15 9l-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="auth-success-text">{text}</p>
      </div>
    </div>
  )
}

export default LogoutSuccessModal

