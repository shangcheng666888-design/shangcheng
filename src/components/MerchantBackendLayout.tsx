import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import MerchantBackendSidebar, { MERCHANT_NAV_ITEMS } from './MerchantBackendSidebar'
import { openCrispChat } from '../utils/crispChat'
import { MerchantShopProvider, useMerchantShop } from '../context/MerchantShopContext'
import { useLang } from '../context/LangContext'
import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'
import serviceIcon from '../assets/kefu.png'

const AUTH_USER_KEY = 'authUser'

function getMobileShopLevelLabel(level: number | undefined, lang: 'zh' | 'en'): string {
  const lvl = typeof level === 'number' ? level : 1
  if (lvl >= 4) return lang === 'zh' ? '钻石店铺' : 'Diamond shop'
  if (lvl >= 3) return lang === 'zh' ? '金牌店铺' : 'Gold shop'
  if (lvl >= 2) return lang === 'zh' ? '银牌店铺' : 'Silver shop'
  return lang === 'zh' ? '普通店铺' : 'Standard shop'
}

function getMobileShopLevelIcon(level: number | undefined): string {
  const lvl = typeof level === 'number' ? level : 1
  if (lvl >= 4) return dianpu4
  if (lvl >= 3) return dianpu3
  if (lvl >= 2) return dianpu2
  return dianpu1
}

const MerchantBackendLayoutInner: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, setLang } = useLang()
  const { shop } = useMerchantShop()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [authOk, setAuthOk] = useState<boolean | null>(null)
  const [mobileShopInfoOpen, setMobileShopInfoOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_USER_KEY)
      const user = raw ? (JSON.parse(raw) as { shopId?: string | null }) : null
      if (!user || !user.shopId) {
        navigate('/shop-login', { replace: true })
        return
      }
      setAuthOk(true)
    } catch {
      navigate('/shop-login', { replace: true })
    }
  }, [navigate])

  if (authOk !== true) {
    return (
      <div
        className="merchant-backend"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          minHeight: '100vh',
        }}
      >
        加载中…
      </div>
    )
  }

  const mobileNavItems = [
    '/merchant/dashboard',
    '/merchant/warehouse',
    '/merchant/orders',
    '/merchant/plan',
    '/merchant/wallet',
    '/merchant/settings',
  ]
    .map((path) => MERCHANT_NAV_ITEMS.find((item) => item.path === path))
    .filter((item): item is (typeof MERCHANT_NAV_ITEMS)[number] => !!item)

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(AUTH_USER_KEY)
    } catch {}
    navigate('/shop-login')
  }

  const isMobile =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 768px)').matches

  const menuLabel = isMobile
    ? lang === 'zh'
      ? '店铺信息'
      : 'Shop info'
    : lang === 'zh'
      ? '展开菜单'
      : 'Toggle menu'

  const currentNavItem = [...MERCHANT_NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (item) =>
        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    )
  const headerTitle =
    currentNavItem != null
      ? lang === 'zh'
        ? currentNavItem.labelZh
        : currentNavItem.labelEn
      : lang === 'zh'
        ? '仪表盘'
        : 'Dashboard'

  return (
    <div className="merchant-backend">
      <MerchantBackendSidebar collapsed={!sidebarOpen} />

      <div className="merchant-backend-main">
        <header className="merchant-backend-header">
          <button
            type="button"
            className="merchant-backend-menu-btn"
            aria-label={menuLabel}
            onClick={() => {
              if (isMobile) {
                setMobileShopInfoOpen(true)
              } else {
                setSidebarOpen((v) => !v)
              }
            }}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className="merchant-backend-header-title">
            {headerTitle}
          </h1>
          <div className="merchant-backend-header-right">
            <button
              type="button"
              className="merchant-backend-header-icon merchant-backend-header-msg"
              aria-label={lang === 'zh' ? '客服' : 'Customer service'}
              onClick={() => openCrispChat({ shopName: shop?.name, shopId: shop?.id })}
            >
              <img
                src={serviceIcon}
                alt={lang === 'zh' ? '客服' : 'Customer service'}
                width={20}
                height={20}
                aria-hidden="true"
              />
            </button>
            <div className="merchant-backend-lang-wrap">
              <button
                type="button"
                className="merchant-backend-lang-btn"
                onClick={() => setLangDropdownOpen((v) => !v)}
                aria-expanded={langDropdownOpen}
              >
                {lang === 'zh' ? '简体中文' : 'English'}
                <span className="merchant-backend-lang-caret">▼</span>
              </button>
              {langDropdownOpen && (
                <div className="merchant-backend-lang-dropdown">
                  <button
                    type="button"
                    className="merchant-backend-lang-option"
                    aria-selected={lang === 'zh'}
                    onClick={() => {
                      setLang('zh')
                      setLangDropdownOpen(false)
                    }}
                  >
                    简体中文
                  </button>
                  <button
                    type="button"
                    className="merchant-backend-lang-option"
                    aria-selected={lang === 'en'}
                    onClick={() => {
                      setLang('en')
                      setLangDropdownOpen(false)
                    }}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="merchant-backend-header-logout"
              aria-label={lang === 'zh' ? '退出登录' : 'Logout'}
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="merchant-backend-content">
          <Outlet />
        </div>
        {logoutConfirmOpen && (
          <div
            className="merchant-backend-logout-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-backend-logout-title"
            onClick={() => setLogoutConfirmOpen(false)}
          >
            <div
              className="merchant-backend-logout-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="merchant-backend-logout-title"
                className="merchant-backend-logout-title"
              >
                {lang === 'zh' ? '确认退出登录？' : 'Log out of this shop?'}
              </h2>
              <p className="merchant-backend-logout-subtitle">
                {lang === 'zh'
                  ? '退出后需要重新登录才能管理店铺。'
                  : 'You will need to log in again to manage your shop.'}
              </p>
              <div className="merchant-backend-logout-actions">
                <button
                  type="button"
                  className="merchant-backend-logout-btn merchant-backend-logout-btn--secondary"
                  onClick={() => setLogoutConfirmOpen(false)}
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="merchant-backend-logout-btn merchant-backend-logout-btn--primary"
                  onClick={handleLogout}
                >
                  {lang === 'zh' ? '确认退出' : 'Log out'}
                </button>
              </div>
            </div>
          </div>
        )}
        {isMobile && mobileShopInfoOpen && (
          <div
            className="merchant-backend-mobile-shop-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-backend-mobile-shop-title"
            onClick={() => setMobileShopInfoOpen(false)}
          >
            <div
              className="merchant-backend-mobile-shop-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="merchant-backend-mobile-shop-head">
                <h2
                  id="merchant-backend-mobile-shop-title"
                  className="merchant-backend-mobile-shop-title"
                >
                  {lang === 'zh' ? '店铺信息' : 'Shop info'}
                </h2>
                <button
                  type="button"
                  className="merchant-backend-mobile-shop-close"
                  aria-label={lang === 'zh' ? '关闭' : 'Close'}
                  onClick={() => setMobileShopInfoOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="merchant-backend-mobile-shop-body">
                <div className="merchant-backend-avatar-wrap">
                  {shop?.logo ? (
                    <img
                      src={shop.logo}
                      alt={lang === 'zh' ? '店铺头像' : 'Shop avatar'}
                      className="merchant-backend-avatar"
                      loading="lazy"
                    />
                  ) : (
                    <div className="merchant-backend-avatar" aria-hidden="true">
                      <span>{shop?.name ? shop.name.slice(0, 1) : '店'}</span>
                    </div>
                  )}
                </div>
              {shop && (
                <div className="merchant-backend-mobile-shop-meta">
                  <span className="merchant-backend-mobile-shop-tag">
                    <img
                      src={getMobileShopLevelIcon(shop.level)}
                      alt=""
                      aria-hidden="true"
                      className="merchant-backend-mobile-shop-tag-icon"
                    />
                    {getMobileShopLevelLabel(shop.level, lang)}
                  </span>
                  <span className="merchant-backend-mobile-shop-sub">
                    {lang === 'zh'
                      ? `好评率 ${Math.round(shop.goodRate ?? 0)}% · 关注 ${shop.followers.toLocaleString()}`
                      : `Rating ${Math.round(shop.goodRate ?? 0)}% · ${shop.followers.toLocaleString()} followers`}
                  </span>
                </div>
              )}
                <div
                  className="merchant-backend-user-id"
                  title={shop?.name || (lang === 'zh' ? '我的店铺' : 'My shop')}
                >
                  {shop?.name || (lang === 'zh' ? '我的店铺' : 'My shop')}
                </div>
                {shop?.id && (
                  <div className="merchant-backend-user-phone">
                    {lang === 'zh' ? '店铺ID：' : 'Shop ID: '}
                    {shop.id}
                  </div>
                )}
                {shop?.id && (
                  <Link
                    to={`/shops/${shop.id}`}
                    className="merchant-backend-view-shop-btn merchant-backend-view-shop-btn--mobile"
                    onClick={() => setMobileShopInfoOpen(false)}
                  >
                    {lang === 'zh' ? '查看我的店铺' : 'View my shop'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        <nav className="merchant-backend-bottom-nav">
          {mobileNavItems.map((item) => {
            const isActive = item.path === '/merchant/wallet'
              ? location.pathname === '/merchant/wallet' ||
                location.pathname.startsWith('/merchant/wallet/')
              : location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`merchant-backend-bottom-item${
                  isActive ? ' merchant-backend-bottom-item--active' : ''
                }`}
              >
                <span className="merchant-backend-bottom-icon-wrap">
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt=""
                      className="merchant-backend-bottom-icon"
                      aria-hidden
                    />
                  )}
                </span>
                <span className="merchant-backend-bottom-label">
                  {lang === 'zh' ? item.labelZh : item.labelEn}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

const MerchantBackendLayout: React.FC = () => (
  <MerchantShopProvider>
    <MerchantBackendLayoutInner />
  </MerchantShopProvider>
)

export default MerchantBackendLayout
