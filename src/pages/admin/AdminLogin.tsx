import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../components/ToastProvider'

const ADMIN_AUTH_KEY = 'adminAuth'

const AdminLogin: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpToken, setTotpToken] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/admin/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      showToast('请输入用户名', 'error')
      return
    }
    if (!password) {
      showToast('请输入密码', 'error')
      return
    }
    const code = totpToken.replace(/\s/g, '')
    if (!code || code.length !== 6) {
      showToast('请输入 6 位谷歌验证码', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; admin?: { username: string }; token?: string; message?: string }>(
        '/api/admin/auth/login',
        { username: username.trim(), password, totpToken: code }
      )
      if (res.success && res.admin && res.token) {
        window.localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ username: res.admin.username, at: Date.now(), token: res.token }))
        showToast('登录成功', 'success')
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 1500)
      } else {
        showToast((res as { message?: string }).message ?? '登录失败，请重试', 'error')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '网络错误，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <h1 className="admin-login-page-title">商城管理总后台</h1>
      <div className="admin-login-bg" aria-hidden>
        <div className="admin-login-bg-vignette" />
        <div className="admin-login-bg-illus admin-login-bg-illus--left">
          <svg viewBox="0 0 280 320" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <title>管理：设置与用户</title>
            <path d="M140 40v40M140 240v40M40 140h40M200 140h40M65 65l28 28M187 187l28 28M65 215l28-28M187 93l28-28" />
            <circle cx="140" cy="140" r="48" />
            <circle cx="140" cy="140" r="32" />
            <path d="M140 108a32 32 0 0 1 22.6 9.4l9.4-9.4M140 172a32 32 0 0 0-22.6-9.4l-9.4 9.4M108 140a32 32 0 0 0 9.4 22.6l-9.4 9.4M172 140a32 32 0 0 1-9.4-22.6l9.4-9.4" />
            <circle cx="70" cy="260" r="24" />
            <path d="M58 260a18 18 0 0 1 24 0M70 248v6M70 266v6M58 260h6M86 260h6" />
            <path d="M220 80h32v12h-32zM220 100h24v8h-24zM220 116h28v8h-28z" />
            <rect x="215" y="75" width="42" height="58" rx="4" fill="none" stroke="currentColor" />
          </svg>
        </div>
        <div className="admin-login-bg-illus admin-login-bg-illus--right">
          <svg viewBox="0 0 320 300" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <title>管理：数据与统计</title>
            <path d="M60 220V120h35v100M120 220V90h35v130M180 220V140h35v80M240 220V100h35v120" />
            <path d="M60 220h215" />
            <circle cx="260" cy="80" r="50" />
            <path d="M260 80v50a50 50 0 0 1-43.3-25M260 80a50 50 0 0 1 43.3 25" />
            <path d="M260 80a50 50 0 0 0-86.6 25H260" />
            <rect x="50" y="40" width="120" height="80" rx="6" fill="none" stroke="currentColor" />
            <path d="M65 58h90M65 72h70M65 86h50" />
          </svg>
        </div>
      </div>
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1 className="admin-login-title">全站管理后台</h1>
          <p className="admin-login-subtitle">请使用管理员账号登录</p>
        </div>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-field">
            <label htmlFor="admin-login-username" className="admin-login-label">用户名</label>
            <input
              id="admin-login-username"
              type="text"
              className="admin-login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>
          <div className="admin-login-field">
            <label htmlFor="admin-login-password" className="admin-login-label">密码</label>
            <input
              id="admin-login-password"
              type="password"
              className="admin-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>
          <div className="admin-login-field">
            <label htmlFor="admin-login-totp" className="admin-login-label">谷歌验证器</label>
            <input
              id="admin-login-totp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="admin-login-input"
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入 6 位动态码"
              autoComplete="one-time-code"
            />
          </div>
          <button type="submit" className="admin-login-submit" disabled={loading}>{loading ? '登录中…' : '登录'}</button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
export { ADMIN_AUTH_KEY }
