import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { api } from '../api/client'
import { ADMIN_AUTH_KEY } from '../pages/admin/AdminLogin'

const TOP_NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/admin/dashboard', label: '仪表盘' },
  { path: '/admin/users', label: '商城用户' },
  { path: '/admin/shops', label: '店铺管理' },
  { path: '/admin/orders', label: '订单管理' },
  { path: '/admin/warehouse', label: '商品仓' },
  { path: '/admin/audit/shops', label: '店铺审核' },
  { path: '/admin/audit/shop-funds', label: '店铺资金审核' },
  { path: '/admin/audit/mall-funds', label: '商城资金审核' },
  { path: '/admin/system', label: '系统管理' },
]

const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [authChecked, setAuthChecked] = useState(false)
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    const raw = window.localStorage.getItem(ADMIN_AUTH_KEY)
    if (!raw) {
      navigate('/admin/login', { state: { from: { pathname: location.pathname } }, replace: true })
      return
    }
    let cancelled = false
    api
      .get<{ success?: boolean; ok?: boolean }>('/api/admin/auth/verify')
      .then((res) => {
        if (cancelled) return
        if (res.success && res.ok) {
          try {
            const data = JSON.parse(raw) as { username?: string }
            setUsername(data.username ?? '')
          } catch {
            setUsername('')
          }
          setAuthChecked(true)
        } else {
          window.localStorage.removeItem(ADMIN_AUTH_KEY)
          navigate('/admin/login', { state: { from: { pathname: location.pathname } }, replace: true })
        }
      })
      .catch(() => {
        if (cancelled) return
        try {
          window.localStorage.removeItem(ADMIN_AUTH_KEY)
        } catch {}
        navigate('/admin/login', { state: { from: { pathname: location.pathname } }, replace: true })
      })
    return () => { cancelled = true }
  }, [navigate, location.pathname])

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ADMIN_AUTH_KEY)
    } catch {}
    navigate('/admin/login')
  }

  if (!authChecked) {
    return (
      <div className="admin-backend" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#64748b' }}>验证中…</span>
      </div>
    )
  }

  return (
    <div className="admin-backend">
      <div className="admin-main">
        <header className="admin-header admin-header--fixed">
          <Link to="/admin/dashboard" className="admin-header-title-link">
            <h1 className="admin-header-title">全站管理</h1>
          </Link>
          <nav className="admin-header-nav">
            {TOP_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-header-nav-item${isActive ? ' admin-header-nav-item--active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="admin-header-right">
            {username && <span className="admin-header-username">{username}</span>}
            <button
              type="button"
              className="admin-header-logout"
              aria-label="退出登录"
              onClick={handleLogout}
            >
              退出
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
