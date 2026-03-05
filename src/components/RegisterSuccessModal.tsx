import type React from 'react'

interface RegisterSuccessModalProps {
  open: boolean
  onClose: () => void
}

const RegisterSuccessModal: React.FC<RegisterSuccessModalProps> = ({ open, onClose }) => {
  if (!open) return null

  return (
    <div className="auth-success-overlay" role="dialog" aria-label="注册成功" onClick={onClose}>
      <div className="auth-success-box" onClick={(e) => e.stopPropagation()}>
        <div className="auth-success-icon auth-success-icon--black">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M7 12.5 10.5 16 17 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="auth-success-text">注册成功，已为您登录</p>
      </div>
    </div>
  )
}

export default RegisterSuccessModal

