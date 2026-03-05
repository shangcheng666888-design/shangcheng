import type React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import RegisterSuccessModal from '../components/RegisterSuccessModal.tsx'
import registerPoster from '../assets/login-illustration.png'
import iconZhengpin from '../assets/zhifu.png'
import iconTuihuo from '../assets/tuihuo.png'
import iconYunshu from '../assets/yunshu.png'
import iconZhifu from '../assets/zhengping.png'
import PhoneCodeSelect from '../components/PhoneCodeSelect'
import { api } from '../api/client'
import { updateCrispUser } from '../utils/crispInit'

const Register: React.FC = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phoneCode, setPhoneCode] = useState('+65')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [successOpen, setSuccessOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { lang } = useLang()

  const validate = () => {
    const next = { email: '', phone: '', password: '', confirmPassword: '' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,22}$/

    if (method === 'email') {
      if (!email.trim()) next.email = lang === 'zh' ? '请输入邮箱' : 'Please enter your email'
      else if (!emailRegex.test(email.trim())) next.email = lang === 'zh' ? '邮箱格式不正确' : 'Invalid email format'
    } else {
      if (!phone.trim()) next.phone = lang === 'zh' ? '请输入手机号' : 'Please enter your phone number'
    }

    if (!password) next.password = lang === 'zh' ? '请输入密码' : 'Please enter your password'
    else if (!pwdRegex.test(password)) next.password = lang === 'zh' ? '密码需为 6-22 位字母和数字组合' : 'Password must be 6-22 characters with letters and numbers'

    if (!confirmPassword) next.confirmPassword = lang === 'zh' ? '请再次输入密码' : 'Please confirm your password'
    else if (confirmPassword !== password) next.confirmPassword = lang === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match'

    setErrors(next)
    return !next.email && !next.phone && !next.password && !next.confirmPassword
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const account = method === 'email' ? email.trim() : `${phoneCode}${phone.trim()}`
    setLoading(true)
    setErrors({ email: '', phone: '', password: '', confirmPassword: '' })
    try {
      const res = await api.post<{ success?: boolean; user?: { id: string; account: string; balance: number; shopId: string | null; avatar: string | null } }>(
        '/api/auth/register',
        { account, password, type: method === 'email' ? 'email' : 'phone' }
      )
      if (res.success && res.user) {
        window.localStorage.setItem('authUser', JSON.stringify({
          type: method === 'email' ? 'email' as const : 'phone' as const,
          value: res.user.account,
          id: res.user.id,
          balance: res.user.balance,
          shopId: res.user.shopId,
          avatar: res.user.avatar ?? null,
          ...(method === 'email' && { email: email.trim() }),
        }))
        updateCrispUser()
        setSuccessOpen(true)
        setTimeout(() => navigate('/'), 1200)
      } else {
        setErrors((prev) => ({ ...prev, [method === 'email' ? 'email' : 'phone']: lang === 'zh' ? '注册失败，请重试' : 'Registration failed, please try again' }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : (lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later')
      const isDuplicate = /已注册|重复|exists|already registered/i.test(msg) || msg.includes('409')
      const fieldMsg = isDuplicate
        ? (method === 'email' ? (lang === 'zh' ? '该邮箱已注册，请直接登录' : 'This email is already registered, please log in') : (lang === 'zh' ? '该手机号已注册，请直接登录' : 'This phone number is already registered, please log in'))
        : msg
      setErrors((prev) => ({ ...prev, [method === 'email' ? 'email' : 'phone']: fieldMsg }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page register-page">
      <div className="login-card">
        <div className="login-card-left">
          <img src={registerPoster} alt={lang === 'zh' ? '注册海报' : 'Sign up'} className="login-poster-image" />
        </div>
        <div className="login-card-right">
          <div className="login-auth-entry">
            <Link to="/login" className="login-auth-link">{lang === 'zh' ? '登录' : 'Log in'}</Link>
            <span className="login-auth-sep" aria-hidden="true">|</span>
            <span className="login-auth-current">{lang === 'zh' ? '注册' : 'Sign up'}</span>
          </div>
          <h1 className="login-title">{lang === 'zh' ? '注册' : 'Sign up'}</h1>
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab${method === 'email' ? ' login-tab--active' : ''}`}
              onClick={() => {
                setMethod('email')
                setErrors((prev) => ({ ...prev, email: '', phone: '' }))
              }}
            >
              {lang === 'zh' ? '邮箱' : 'Email'}
            </button>
            <button
              type="button"
              className={`login-tab${method === 'phone' ? ' login-tab--active' : ''}`}
              onClick={() => {
                setMethod('phone')
                setErrors((prev) => ({ ...prev, email: '', phone: '' }))
              }}
            >
              {lang === 'zh' ? '手机号' : 'Phone'}
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {method === 'email' ? (
              <div className="login-form-field">
                <label className="login-label">
                  <span className="login-label-required">*</span> {lang === 'zh' ? '邮箱' : 'Email'}
                </label>
                <input
                  className={`login-input${errors.email ? ' login-input--error' : ''}`}
                  placeholder={lang === 'zh' ? '请设置账户邮箱' : 'Enter your email'}
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
            ) : (
              <div className="login-form-field">
                <label className="login-label">
                  <span className="login-label-required">*</span> {lang === 'zh' ? '手机号码' : 'Phone number'}
                </label>
                <div className="login-phone-combo-wrap">
                  <div className="login-phone-combo">
                    <PhoneCodeSelect value={phoneCode} onChange={setPhoneCode} />
                    <input
                      className={`login-phone-input${errors.phone ? ' login-input--error' : ''}`}
                      placeholder={lang === 'zh' ? '请设置账户手机号' : 'Enter your phone number'}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
                      }}
                    />
                  </div>
                </div>
                <div className="login-error-slot">
                  {errors.phone && <p className="login-error-text">{errors.phone}</p>}
                </div>
              </div>
            )}

            <div className="login-form-field">
              <label className="login-label">
                <span className="login-label-required">*</span> {lang === 'zh' ? '密码' : 'Password'}
              </label>
              <div className="login-password-wrap">
                <input
                  className={`login-input${errors.password ? ' login-input--error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={lang === 'zh' ? '请设置密码（6-22 位字母和数字组合）' : 'Set password (6-22 letters and numbers)'}
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
            </div>

            <div className="login-form-field">
              <label className="login-label">
                <span className="login-label-required">*</span> {lang === 'zh' ? '确认密码' : 'Confirm password'}
              </label>
              <div className="login-password-wrap">
                <input
                  className={`login-input${errors.confirmPassword ? ' login-input--error' : ''}`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={lang === 'zh' ? '请再次输入密码' : 'Enter password again'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                  }}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showConfirmPassword ? (lang === 'zh' ? '隐藏密码' : 'Hide password') : (lang === 'zh' ? '显示密码' : 'Show password')}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
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
                {errors.confirmPassword && <p className="login-error-text">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="login-form-footer">
              <div className="login-form-links">
                <span className="login-text">{lang === 'zh' ? '已有账号？' : 'Already have an account?'}</span>
                <Link to="/login" className="login-link-button">
                  {lang === 'zh' ? '登录' : 'Log in'}
                </Link>
              </div>
            </div>

            <button type="submit" className="login-submit-button" disabled={loading}>
              {loading ? (lang === 'zh' ? '注册中…' : 'Signing up…') : (lang === 'zh' ? '注册' : 'Sign up')}
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
      <RegisterSuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
    </div>
  )
}

export default Register

