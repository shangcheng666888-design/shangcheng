import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneCodeSelect from '../components/PhoneCodeSelect'
import serviceIcon from '../assets/kefu.png'
import { openCrispChat } from '../utils/crispChat'
import zhFlagIcon from '../assets/lang-zh.png'
import enFlagIcon from '../assets/lang-en.png'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'

const MerchantLogin: React.FC = () => {
  const navigate = useNavigate()
  const { lang, setLang } = useLang()
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [selectedCode, setSelectedCode] = useState('+65')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    password: '',
  })
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      import('../components/MerchantBackendLayout')
      import('./MerchantDashboard')
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const isEmail = activeTab === 'email'

  const t = lang === 'zh'
    ? {
        title: '登录到你的帐户',
        emailTab: '邮箱',
        phoneTab: '手机号',
        emailLabel: '邮箱',
        phoneLabel: '手机号',
        passwordLabel: '密码',
        emailPlaceholder: '请输入邮箱',
        phonePlaceholder: '请输入手机号',
        passwordPlaceholder: '请输入你的密码',
        loginButton: '登录',
        forgotPassword: '忘记密码?',
        langText: '简体中文',
        emailRequired: '请输入邮箱',
        emailFormat: '请输入正确的邮箱格式',
        phoneRequired: '请输入手机号',
        passwordRequired: '请输入密码',
        passwordFormat: '密码需为 6-22 位字母和数字组合',
      }
    : {
        title: 'Log in to your account',
        emailTab: 'Email',
        phoneTab: 'Phone',
        emailLabel: 'Email',
        phoneLabel: 'Phone number',
        passwordLabel: 'Password',
        emailPlaceholder: 'Please enter email',
        phonePlaceholder: 'Please enter phone number',
        passwordPlaceholder: 'Please enter your password',
        loginButton: 'Log in',
        forgotPassword: 'Forgot password?',
        langText: 'English',
        emailRequired: 'Please enter email',
        emailFormat: 'Please enter a valid email address',
        phoneRequired: 'Please enter phone number',
        passwordRequired: 'Please enter password',
        passwordFormat: 'Password must be 6-22 characters with letters and numbers',
      }

  const validate = () => {
    const next = { email: '', phone: '', password: '' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,22}$/

    if (isEmail) {
      if (!email.trim()) next.email = t.emailRequired
      else if (!emailRegex.test(email.trim())) next.email = t.emailFormat
    } else {
      if (!phone.trim()) next.phone = t.phoneRequired
    }

    if (!password) next.password = t.passwordRequired
    else if (!pwdRegex.test(password)) next.password = t.passwordFormat

    setErrors(next)
    setSubmitError('')
    return !next.email && !next.phone && !next.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return
    const value = isEmail ? email.trim() : `${selectedCode}${phone.trim()}`
    setSubmitting(true)
    try {
      const res = await api.post<{ success?: boolean; user?: { id: string; account: string; balance: number; shopId: string | null } }>('/api/auth/shop-login', { value, password })
      if (res.success && res.user) {
        try {
          window.localStorage.setItem('authUser', JSON.stringify(res.user))
        } catch {}
        navigate('/merchant/dashboard')
      } else {
        setSubmitError(lang === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'zh' ? '登录失败，请重试' : 'Login failed')
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="merchant-login-page">
      <div className="merchant-login-lang">
        <button
          type="button"
          className="merchant-login-lang-button"
          onClick={() => setLangDropdownOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={langDropdownOpen}
        >
          <span className="merchant-login-lang-flag" aria-hidden="true">
            <img
              src={lang === 'zh' ? zhFlagIcon : enFlagIcon}
              alt=""
              className="merchant-login-lang-flag-img"
            />
          </span>
          <span>{t.langText}</span>
        </button>
        {langDropdownOpen && (
          <div className="merchant-login-lang-dropdown" role="listbox">
            <button
              type="button"
              className="merchant-login-lang-option"
              aria-selected={lang === 'zh'}
              onClick={() => {
                setLang('zh')
                setLangDropdownOpen(false)
              }}
            >
              <span className="merchant-login-lang-option-flag" aria-hidden="true">
                <img src={zhFlagIcon} alt="" className="merchant-login-lang-flag-img" />
              </span>
              <span>简体中文</span>
            </button>
            <button
              type="button"
              className="merchant-login-lang-option"
              aria-selected={lang === 'en'}
              onClick={() => {
                setLang('en')
                setLangDropdownOpen(false)
              }}
            >
              <span className="merchant-login-lang-option-flag" aria-hidden="true">
                <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
              </span>
              <span>English</span>
            </button>
          </div>
        )}
      </div>

      <div className="merchant-login-card">
        <h1 className="merchant-login-title">{t.title}</h1>

        <div className="merchant-login-tabs">
          <button
            type="button"
            className={`merchant-login-tab${isEmail ? ' merchant-login-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('email')
              setErrors((prev) => ({ ...prev, email: '', phone: '' }))
              setSubmitError('')
            }}
          >
            {t.emailTab}
          </button>
          <button
            type="button"
            className={`merchant-login-tab${!isEmail ? ' merchant-login-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('phone')
              setErrors((prev) => ({ ...prev, email: '', phone: '' }))
              setSubmitError('')
            }}
          >
            {t.phoneTab}
          </button>
        </div>

        <form className="merchant-login-form" onSubmit={handleSubmit}>
          {isEmail ? (
            <div className="merchant-login-field">
              <label className="merchant-login-label">
                <span className="merchant-login-required">*</span> {t.emailLabel}
              </label>
              <div className="merchant-login-input-wrap">
                <span className="merchant-login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M4 4h16a1 1 0 0 1 1 1v14H3V5a1 1 0 0 1 1-1z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 6l7 6 7-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  className={`merchant-login-input${errors.email ? ' merchant-login-input--error' : ''}`}
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                    setSubmitError('')
                  }}
                />
              </div>
              {errors.email && <p className="merchant-login-error-text">{errors.email}</p>}
            </div>
          ) : (
            <div className="merchant-login-field">
              <label className="merchant-login-label">
                <span className="merchant-login-required">*</span> {t.phoneLabel}
              </label>
              <div
                className={`merchant-login-phone-row${
                  errors.phone ? ' merchant-login-phone-row--error' : ''
                }`}
              >
                <span className="merchant-login-input-icon merchant-login-input-icon--phone" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <rect
                      x="7"
                      y="3"
                      width="10"
                      height="18"
                      rx="2"
                      ry="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="12" cy="17" r="0.8" fill="currentColor" />
                  </svg>
                </span>
                <div className="merchant-login-phone-code">
                  <PhoneCodeSelect value={selectedCode} onChange={setSelectedCode} />
                </div>
                <input
                  className="merchant-login-input merchant-login-input--plain merchant-login-input--phone"
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
                    setSubmitError('')
                  }}
                />
              </div>
              {errors.phone && <p className="merchant-login-error-text">{errors.phone}</p>}
            </div>
          )}

          <div className="merchant-login-field">
            <label className="merchant-login-label">
              <span className="merchant-login-required">*</span> {t.passwordLabel}
            </label>
            <div className="merchant-login-input-wrap">
              <span className="merchant-login-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                    ry="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 10V8a4 4 0 0 1 8 0v2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className={`merchant-login-input${errors.password ? ' merchant-login-input--error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                  setSubmitError('')
                }}
              />
              <button
                type="button"
                className="merchant-login-password-toggle"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M3 12s2.5-5 9-5 9 5 9 5-2.5 5-9 5-9-5-9-5z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <line
                      x1="4"
                      y1="4"
                      x2="20"
                      y2="20"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M3 12s2.5-5 9-5 9 5 9 5-2.5 5-9 5-9-5-9-5z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="merchant-login-field-footer">
              <button
                type="button"
                className="merchant-login-link-button merchant-login-link-button--right"
              >
                {t.forgotPassword}
              </button>
            </div>
            {errors.password && <p className="merchant-login-error-text">{errors.password}</p>}
          </div>

          {submitError && (
            <p className="merchant-login-error-text merchant-login-submit-error" role="alert">
              {submitError}
            </p>
          )}

          <button type="submit" className="merchant-login-submit" disabled={submitting}>
            {submitting ? (lang === 'zh' ? '登录中…' : 'Logging in…') : t.loginButton}
          </button>
        </form>
      </div>

      <button
        type="button"
        className="merchant-login-service-fab"
        aria-label="在线客服"
        onClick={() => openCrispChat()}
      >
        <img src={serviceIcon} alt="" className="merchant-login-service-icon" />
      </button>

    </div>
  )
}

export default MerchantLogin

