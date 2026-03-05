import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import LoginSuccessModal from '../components/LoginSuccessModal.tsx'
import { api } from '../api/client'
import { updateCrispUser } from '../utils/crispInit'
import loginPoster from '../assets/login-illustration.png'
import iconZhengpin from '../assets/zhifu.png'
import iconTuihuo from '../assets/tuihuo.png'
import iconYunshu from '../assets/yunshu.png'
import iconZhifu from '../assets/zhengping.png'

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()
  const from = (location.state as { from?: { pathname: string; state?: unknown } } | null)?.from

  const validate = () => {
    const next = { email: '', password: '' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,22}$/

    if (!email.trim()) next.email = lang === 'zh' ? '请输入邮箱' : 'Please enter your email'
    else if (!emailRegex.test(email.trim())) next.email = lang === 'zh' ? '邮箱格式不正确' : 'Invalid email format'

    if (!password) next.password = lang === 'zh' ? '请输入密码' : 'Please enter your password'
    else if (!pwdRegex.test(password)) next.password = lang === 'zh' ? '密码需为 6-22 位字母和数字组合' : 'Password must be 6-22 characters with letters and numbers'

    setErrors(next)
    return !next.email && !next.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const value = email.trim()
    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; user?: { id: string; account: string; balance: number; shopId: string | null; avatar: string | null } }>(
        '/api/auth/login',
        { type: 'email', value, password }
      )
      if (res.success && res.user) {
        window.localStorage.setItem('authUser', JSON.stringify({
          type: 'email' as const,
          value: res.user.account,
          id: res.user.id,
          balance: res.user.balance,
          shopId: res.user.shopId,
          avatar: res.user.avatar ?? null,
          email: email.trim(),
        }))
        updateCrispUser()
        setSuccessOpen(true)
        setTimeout(() => {
          if (from?.pathname) {
            navigate(from.pathname, { replace: true, state: from.state })
          } else {
            navigate('/', { replace: true })
          }
        }, 1200)
      } else {
        setErrors((prev) => ({ ...prev, password: lang === 'zh' ? '账号或密码错误' : 'Incorrect account or password' }))
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, password: err instanceof Error ? err.message : (lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later') }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-left">
          <img src={loginPoster} alt={lang === 'zh' ? '登录海报' : 'Login'} className="login-poster-image" />
        </div>
        <div className="login-card-right">
          <div className="login-auth-entry">
            <span className="login-auth-current">{lang === 'zh' ? '登录' : 'Log in'}</span>
            <span className="login-auth-sep" aria-hidden="true">|</span>
            <Link to="/register" className="login-auth-link">{lang === 'zh' ? '注册' : 'Sign up'}</Link>
          </div>
          <h1 className="login-title">{lang === 'zh' ? '登录' : 'Log in'}</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-field">
              <label className="login-label">
                <span className="login-label-required">*</span> {lang === 'zh' ? '邮箱' : 'Email'}
              </label>
              <input
                className={`login-input${errors.email ? ' login-input--error' : ''}`}
                placeholder={lang === 'zh' ? '请输入账户邮箱' : 'Enter your email'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                }}
              />
              <div className="login-error-slot">
                {errors.email && <p className="login-error-text">{errors.email}</p>}
              </div>
            </div>

            <div className="login-form-field">
              <label className="login-label">
                <span className="login-label-required">*</span> {lang === 'zh' ? '密码' : 'Password'}
              </label>
              <div className="login-password-wrap">
                <input
                  className={`login-input${errors.password ? ' login-input--error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={lang === 'zh' ? '请输入密码（6-22 位字母和数字组合）' : 'Enter password (6-22 letters and numbers)'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                  }}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? (lang === 'zh' ? '隐藏密码' : 'Hide password') : (lang === 'zh' ? '显示密码' : 'Show password')}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M3 12s2.5-5 9-5 9 5 9 5-2.5 5-9 5-9-5-9-5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="4"
                        y1="4"
                        x2="20"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M3 12s2.5-5 9-5 9 5 9 5-2.5 5-9 5-9-5-9-5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="login-error-slot">
                {errors.password && <p className="login-error-text">{errors.password}</p>}
              </div>
              <div className="login-forgot-wrap">
                <button
                  type="button"
                  className="login-link-button login-link-button--right"
                  onClick={() => setForgotOpen(true)}
                >
                  {lang === 'zh' ? '忘记密码?' : 'Forgot password?'}
                </button>
              </div>
            </div>

            <div className="login-form-footer">
              <div className="login-form-links">
                <span className="login-text">{lang === 'zh' ? '还没有账号？' : "Don't have an account?"}</span>
                <Link to="/register" className="login-link-button">
                  {lang === 'zh' ? '注册' : 'Sign up'}
                </Link>
              </div>
            </div>

            <button type="submit" className="login-submit-button" disabled={loading}>
              {loading ? (lang === 'zh' ? '登录中…' : 'Logging in…') : (lang === 'zh' ? '登录' : 'Log in')}
            </button>
          </form>
        </div>
      </div>

      <section className="section service-features login-service-features" aria-label={lang === 'zh' ? '服务保障' : 'Service'}>
        <div className="service-features-inner">
          <div className="service-feature-item">
            <img src={iconZhengpin} alt="" className="service-feature-icon" />
            <span className="service-feature-label">{lang === 'zh' ? '100% 正品' : '100% Authentic'}</span>
          </div>
          <div className="service-feature-item">
            <img src={iconTuihuo} alt="" className="service-feature-icon" />
            <span className="service-feature-label">{lang === 'zh' ? '7 天退货' : '7-day returns'}</span>
          </div>
          <div className="service-feature-item">
            <img src={iconYunshu} alt="" className="service-feature-icon" />
            <span className="service-feature-label">{lang === 'zh' ? '运费折扣' : 'Shipping discount'}</span>
          </div>
          <div className="service-feature-item">
            <img src={iconZhifu} alt="" className="service-feature-icon" />
            <span className="service-feature-label">{lang === 'zh' ? '安全支付' : 'Secure payment'}</span>
          </div>
        </div>
      </section>

      <LoginSuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
      {forgotOpen && (
        <div
          className="auth-success-overlay"
          role="dialog"
          aria-label={lang === 'zh' ? '找回密码' : 'Reset password'}
          onClick={() => setForgotOpen(false)}
        >
          <div className="auth-success-box" onClick={(e) => e.stopPropagation()}>
            <div className="auth-success-icon auth-success-icon--black">
              <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
                <line
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="17" r="1" fill="currentColor" />
              </svg>
            </div>
            <p className="auth-success-text">
              {lang === 'zh' ? '请联系在线客服进行申请密码找回' : 'Please contact customer service to reset your password.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login

