import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import homeNavIcon from '../assets/home-nav.png'
import footerLogo from '../assets/logo2.png'
import payBinance from '../assets/binance.png'
import payHuobi from '../assets/Huobi.png'
import payOkx from '../assets/okx.png'
import payKraken from '../assets/KraKen.png'
import payCoinbase from '../assets/Coinbase.png'
import payMetamask from '../assets/MetaMask.png'
import payKucoin from '../assets/KuCoin.png'
import payBitfinex from '../assets/Bitfinex.png'
import loginIcon from '../assets/denglu.png'
import serviceIcon from '../assets/kefu.png'
import messageIcon from '../assets/xiaoxi.png'
import cartNavIcon from '../assets/cart-nav.png'
import shopNavIcon from '../assets/shop-nav.png'
import accountNavIcon from '../assets/account-nav.png'
import productsNavIcon from '../assets/products-nav.png'
import zhFlagIcon from '../assets/lang-zh.png'
import enFlagIcon from '../assets/lang-en.png'
import FloatingCart from './FloatingCart.tsx'
import { openCrispChat } from '../utils/crispChat'
import LogoutSuccessModal from './LogoutSuccessModal.tsx'
import CartDrawer from './CartDrawer.tsx'
import { useLang } from '../context/LangContext'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '简体中文' },
]

const Layout: React.FC = () => {
  const { lang, setLang } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const isProductsPage = location.pathname === '/products'
  const isHomePage = location.pathname === '/'
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeError, setSubscribeError] = useState(false)
  const [subscribeSuccessOpen, setSubscribeSuccessOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [headerSearchKeyword, setHeaderSearchKeyword] = useState('')
  const langSwitcherRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const TOP_THRESHOLD = 80
    const scrollRoot = document.getElementById('root')
    const handleScroll = () => {
      const y = scrollRoot?.scrollTop ?? window.scrollY
      if (y <= TOP_THRESHOLD) {
        setNavCollapsed(false)
      } else {
        setNavCollapsed(true)
      }
      lastScrollY.current = y
    }
    scrollRoot?.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollRoot?.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('authUser')
      setIsAuthed(!!stored)
    } catch {
      setIsAuthed(false)
    }
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langSwitcherRef.current && !langSwitcherRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false)
      }
    }
    if (langDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [langDropdownOpen])

  const handleBackToTop = () => {
    document.getElementById('root')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubscribe = () => {
    const trimmed = subscribeEmail.trim()
    if (!trimmed) {
      setSubscribeError(true)
      return
    }
    setSubscribeError(false)
    setSubscribeEmail('')
    setSubscribeSuccessOpen(true)
  }

  const authUser = (() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem('authUser')
      if (!raw) return null
      return JSON.parse(raw) as { type?: 'email' | 'phone'; value?: string; account?: string }
    } catch {
      return null
    }
  })()

  const displayAuthValue = (value: string | undefined) => {
    const s = value != null && typeof value === 'string' ? value : ''
    if (s.length <= 8) return s || (lang === 'zh' ? '账户' : 'Account')
    return `${s.slice(0, 8)}...`
  }

  const handleLogout = () => {
    window.localStorage.removeItem('authUser')
    setIsAuthed(false)
    setLogoutSuccessOpen(true)
  }

  const handleHeaderSearchSubmit = () => {
    const q = headerSearchKeyword.trim()
    if (!q) {
      navigate('/products')
      return
    }
    navigate(`/products?keyword=${encodeURIComponent(q)}`)
  }

  const handleGoAccount = () => {
    if (!authUser) return
    navigate('/account')
  }

  const handleBottomCartClick = () => {
    if (!authUser) {
      navigate('/login')
      return
    }
    setCartOpen(true)
  }

  return (
    <div className={`app-shell${navCollapsed ? ' primary-nav-collapsed' : ''}`}>
      <div className="app-top-fixed">
      <header className={`app-header${!isAuthed ? ' app-header--guest' : ''}`}>
        <div className="app-header-inner">
          <div className="app-header-left">
            <Link to="/" className="logo-wrap">
              <img src={logo} alt="TikTok mall" className="logo-image" />
            </Link>
          </div>
          <div className="app-header-center">
            <div className="search-capsule">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <line
                  x1="15"
                  y1="15"
                  x2="20"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                className="search-input"
                placeholder={
                  lang === 'zh' ? '找货源/商品/供应商/求购' : 'Search products / suppliers / requests'
                }
                value={headerSearchKeyword}
                onChange={(e) => setHeaderSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleHeaderSearchSubmit()
                  }
                }}
              />
              <button
                type="button"
                className="search-button"
                onClick={handleHeaderSearchSubmit}
              >
                {lang === 'zh' ? '搜索' : 'Search'}
              </button>
            </div>
          </div>
          <div className="app-header-right">
            {authUser ? (
              <div
                className="header-link header-link--user"
                role="button"
                tabIndex={0}
                onClick={handleGoAccount}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleGoAccount()
                  }
                }}
              >
                <img
                  src={loginIcon}
                  alt={lang === 'zh' ? '账户' : 'Account'}
                  className="header-icon"
                />
                <span className="header-link-text">
                  {displayAuthValue(authUser.value ?? authUser.account)}
                  <span className="header-link-divider">
                    {lang === 'zh' ? ' 或者 ' : ' or '}
                  </span>
                  <button
                    type="button"
                    className="header-user-logout"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLogout()
                    }}
                  >
                    {lang === 'zh' ? '退出' : 'Logout'}
                  </button>
                </span>
              </div>
            ) : (
              <div className="header-link">
                <img
                  src={loginIcon}
                  alt={lang === 'zh' ? '登录 / 注册' : 'Login / Register'}
                  className="header-icon"
                />
                <span className="header-link-text">
                  <Link to="/login">{lang === 'zh' ? '登录' : 'Login'}</Link>
                  <span className="header-link-divider">
                    {lang === 'zh' ? '或者' : 'or'}
                  </span>
                  <Link to="/register">{lang === 'zh' ? '注册' : 'Register'}</Link>
                </span>
              </div>
            )}

            <button
              type="button"
              className="header-icon-button header-icon-button--service"
              aria-label={lang === 'zh' ? '客服' : 'Customer service'}
              onClick={() => openCrispChat()}
            >
              <img
                src={serviceIcon}
                alt={lang === 'zh' ? '客服' : 'Customer service'}
                className="header-icon"
              />
            </button>
            {!isAuthed && (
              <div className="header-mobile-auth">
                <Link to="/login" className="header-mobile-auth-btn">
                  {lang === 'zh' ? '登录' : 'Log in'}
                </Link>
                <Link to="/register" className="header-mobile-auth-btn">
                  {lang === 'zh' ? '注册' : 'Sign up'}
                </Link>
              </div>
            )}

            <button
              type="button"
              className="header-icon-button"
              aria-label={lang === 'zh' ? '消息' : 'Messages'}
            >
              <img
                src={messageIcon}
                alt={lang === 'zh' ? '消息' : 'Messages'}
                className="header-icon"
              />
            </button>

            <div className="lang-switcher" ref={langSwitcherRef}>
              <button
                type="button"
                className="header-flag-button"
                aria-label={lang === 'zh' ? '语言选择' : 'Language switch'}
                aria-expanded={langDropdownOpen}
                onClick={() => setLangDropdownOpen((v) => !v)}
              >
                <span className="lang-flag-circle" aria-hidden="true">
                  {currentLang.code === 'zh' ? (
                    <img src={zhFlagIcon} alt="简体中文" className="lang-flag-image" />
                  ) : (
                    <img src={enFlagIcon} alt="English" className="lang-flag-image" />
                  )}
                </span>
                <span className="header-caret">▾</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <LogoutSuccessModal open={logoutSuccessOpen} onClose={() => setLogoutSuccessOpen(false)} />

      <nav className={`primary-nav${navCollapsed ? ' primary-nav--collapsed' : ''}`}>
        <div className="primary-nav-inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'primary-nav-item primary-nav-link primary-nav-link-active'
                : 'primary-nav-item primary-nav-link'
            }
          >
            {lang === 'zh' ? '首页' : 'Home'}
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              isActive
                ? 'primary-nav-item primary-nav-link primary-nav-link-active'
                : 'primary-nav-item primary-nav-link'
            }
          >
            {lang === 'zh' ? '分类' : 'Categories'}
          </NavLink>
          <NavLink
            to="/products"
            end
            className={({ isActive }) =>
              isActive
                ? 'primary-nav-item primary-nav-link primary-nav-link-active'
                : 'primary-nav-item primary-nav-link'
            }
          >
            {lang === 'zh' ? '商品' : 'Products'}
          </NavLink>
          <NavLink
            to="/merchant/apply"
            className={({ isActive }) =>
              isActive
                ? 'primary-nav-item primary-nav-link primary-nav-link-active'
                : 'primary-nav-item primary-nav-link'
            }
          >
            {lang === 'zh' ? '商家入驻' : 'Merchant join'}
          </NavLink>
          <NavLink
            to="/credit-service"
            className={({ isActive }) =>
              isActive
                ? 'primary-nav-item primary-nav-link primary-nav-link-active'
                : 'primary-nav-item primary-nav-link'
            }
          >
            {lang === 'zh' ? '信贷服务' : 'Credit service'}
          </NavLink>
        </div>
      </nav>
      </div>

      <main className={`app-main${isProductsPage ? ' app-main--products' : ''}${isHomePage ? ' app-main--home' : ''}`}>
        <Outlet />
      </main>

      {/* 移动端底部导航（首页 / 商品 / 店铺入驻 / 购物车 / 个人中心） */}
      <nav
        className="mobile-bottom-nav"
        aria-label={lang === 'zh' ? '主导航' : 'Main navigation'}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'mobile-bottom-nav-item mobile-bottom-nav-item--active' : 'mobile-bottom-nav-item'
          }
        >
          <span className="mobile-bottom-nav-icon" aria-hidden="true">
            <img src={homeNavIcon} alt="" className="mobile-bottom-nav-home-icon" />
          </span>
          <span className="mobile-bottom-nav-label">{lang === 'zh' ? '首页' : 'Home'}</span>
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            isActive
              ? 'mobile-bottom-nav-item mobile-bottom-nav-item--products mobile-bottom-nav-item--active'
              : 'mobile-bottom-nav-item mobile-bottom-nav-item--products'
          }
        >
          <span className="mobile-bottom-nav-icon" aria-hidden="true">
            <img src={productsNavIcon} alt="" className="mobile-bottom-nav-products-icon" />
          </span>
          <span className="mobile-bottom-nav-label">{lang === 'zh' ? '商品' : 'Products'}</span>
        </NavLink>
        <NavLink
          to="/merchant/apply"
          className={({ isActive }) =>
            isActive ? 'mobile-bottom-nav-item mobile-bottom-nav-item--active' : 'mobile-bottom-nav-item'
          }
        >
          <span className="mobile-bottom-nav-icon" aria-hidden="true">
            <img src={shopNavIcon} alt="" className="mobile-bottom-nav-shop-icon" />
          </span>
          <span className="mobile-bottom-nav-label">{lang === 'zh' ? '店铺' : 'Shops'}</span>
        </NavLink>
        <button
          type="button"
          className={`mobile-bottom-nav-item mobile-bottom-nav-item--cart${cartOpen && isAuthed ? ' mobile-bottom-nav-item--active' : ''}`}
          onClick={handleBottomCartClick}
        >
          <span className="mobile-bottom-nav-icon" aria-hidden="true">
            <img src={cartNavIcon} alt="" className="mobile-bottom-nav-cart-icon" />
          </span>
          <span className="mobile-bottom-nav-label">{lang === 'zh' ? '购物车' : 'Cart'}</span>
        </button>
        {isAuthed ? (
          <NavLink
            to="/account"
            className={({ isActive }) =>
              isActive
                ? 'mobile-bottom-nav-item mobile-bottom-nav-item--account mobile-bottom-nav-item--active'
                : 'mobile-bottom-nav-item mobile-bottom-nav-item--account'
            }
          >
            <span className="mobile-bottom-nav-icon" aria-hidden="true">
              <img src={accountNavIcon} alt="" className="mobile-bottom-nav-account-icon" />
            </span>
            <span className="mobile-bottom-nav-label">{lang === 'zh' ? '个人中心' : 'Account'}</span>
          </NavLink>
        ) : (
          <button
            type="button"
            className="mobile-bottom-nav-item mobile-bottom-nav-item--account"
            onClick={() => navigate('/login')}
          >
            <span className="mobile-bottom-nav-icon" aria-hidden="true">
              <img src={accountNavIcon} alt="" className="mobile-bottom-nav-account-icon" />
            </span>
            <span className="mobile-bottom-nav-label">{lang === 'zh' ? '个人中心' : 'Account'}</span>
          </button>
        )}
      </nav>

      {langDropdownOpen && (
        <div
          className="lang-overlay"
          onClick={() => {
            setLangDropdownOpen(false)
          }}
        >
          <div
            className="lang-dropdown"
            role="listbox"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {LANGUAGES.map((opt) => (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={currentLang.code === opt.code}
                className="lang-dropdown-item"
                onClick={() => {
                  setLang(opt.code as 'zh' | 'en')
                  setLangDropdownOpen(false)
                }}
              >
                <span className="lang-flag-circle">
                  {opt.code === 'zh' ? (
                    <img src={zhFlagIcon} alt="简体中文" className="lang-flag-image" />
                  ) : (
                    <img src={enFlagIcon} alt="English" className="lang-flag-image" />
                  )}
                </span>
                <span className="lang-name">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-left">
              <div className="footer-logo-row">
                <img src={footerLogo} alt="TikTok Mall" className="footer-logo" />
              </div>
              <div className="footer-subscribe">
                <div className="footer-subscribe-title">
                  {lang === 'zh'
                    ? '我想要更多您的服务'
                    : 'I want to know more about your services'}
                </div>
                <div className="footer-subscribe-form">
                  <input
                    className={`footer-subscribe-input${
                      subscribeError ? ' footer-subscribe-input--error' : ''
                    }`}
                    placeholder={
                      subscribeError
                        ? lang === 'zh'
                          ? '请输入邮箱'
                          : 'Please enter your email'
                        : lang === 'zh'
                          ? '您的电子邮箱'
                          : 'Your email'
                    }
                    aria-label={lang === 'zh' ? '订阅邮箱' : 'Subscribe email'}
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    onFocus={() => setSubscribeError(false)}
                  />
                  <button type="button" className="footer-subscribe-button" onClick={handleSubscribe}>
                    {lang === 'zh' ? '订阅' : 'Subscribe'}
                  </button>
                </div>
              </div>
            </div>

            <div className="footer-nav-columns">
              <div className="footer-nav-column">
                <div className="footer-nav-title">
                  {lang === 'zh' ? '客户服务' : 'Customer service'}
                </div>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => openCrispChat()}
                >
                  {lang === 'zh' ? '在线客服' : 'Online support'}
                </button>
                <button type="button" className="footer-nav-link">
                  {lang === 'zh' ? '联系我们' : 'Contact us'}
                </button>
              </div>
              <div className="footer-nav-column">
                <div className="footer-nav-title">
                  {lang === 'zh' ? '退款和换货' : 'Refund & exchange'}
                </div>
                <Link to="/privacy" className="footer-nav-link">
                  {lang === 'zh' ? '隐私政策' : 'Privacy policy'}
                </Link>
                <Link to="/return-policy" className="footer-nav-link">
                  {lang === 'zh' ? '退货政策' : 'Return policy'}
                </Link>
                <Link to="/delivery" className="footer-nav-link">
                  {lang === 'zh' ? '送货及取货' : 'Delivery & pickup'}
                </Link>
                <Link to="/seller-policy" className="footer-nav-link">
                  {lang === 'zh' ? '卖家政策' : 'Seller policy'}
                </Link>
              </div>
              <div className="footer-nav-column">
                <div className="footer-nav-title">
                  {lang === 'zh' ? '用户中心' : 'User center'}
                </div>
                {authUser ? (
                  <span className="footer-nav-link">
                    {lang === 'zh' ? '用户注册' : 'Sign up'}
                  </span>
                ) : (
                  <Link to="/register" className="footer-nav-link">
                    {lang === 'zh' ? '用户注册' : 'Sign up'}
                  </Link>
                )}
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => {
                    if (!authUser) {
                      navigate('/login')
                      return
                    }
                    navigate('/account?tab=orders')
                  }}
                >
                  {lang === 'zh' ? '订单查询' : 'My orders'}
                </button>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => {
                    if (!authUser) {
                      navigate('/login')
                      return
                    }
                    navigate('/account?tab=productFavorites')
                  }}
                >
                  {lang === 'zh' ? '商品收藏' : 'Favorites'}
                </button>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => {
                    if (!authUser) {
                      navigate('/login')
                      return
                    }
                    navigate('/account?tab=wallet')
                  }}
                >
                  {lang === 'zh' ? '我的钱包' : 'My wallet'}
                </button>
              </div>
              <div className="footer-nav-column">
                <div className="footer-nav-title">
                  {lang === 'zh' ? '关于我们' : 'About us'}
                </div>
                <a
                  href="https://corporate.sainsburys.co.uk/contact-us/"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-nav-link"
                >
                  {lang === 'zh' ? '关于我们' : 'About us'}
                </a>
                <a
                  href="https://sainsburys.jobs/"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-nav-link"
                >
                  {lang === 'zh' ? '招贤纳士' : 'Careers'}
                </a>
              </div>
            </div>
          </div>

          <div className="footer-middle">
            <div className="footer-payments">
              <div className="footer-payments-title">
                {lang === 'zh' ? '支付方式' : 'Payment methods'}
              </div>
              <div
                className="footer-payments-logos"
                aria-label={lang === 'zh' ? '支付方式列表' : 'Payment methods list'}
              >
                <a
                  href="https://www.binance.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="Binance"
                >
                  <img src={payBinance} alt="Binance" className="footer-payment-logo" />
                  <span className="footer-payment-name">Binance</span>
                </a>
                <a
                  href="https://www.huobi.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="Huobi"
                >
                  <img src={payHuobi} alt="Huobi" className="footer-payment-logo" />
                  <span className="footer-payment-name">Huobi</span>
                </a>
                <a
                  href="https://www.okx.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="OKX"
                >
                  <img src={payOkx} alt="OKX" className="footer-payment-logo" />
                  <span className="footer-payment-name">OKX</span>
                </a>
                <a
                  href="https://www.kraken.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="KraKen"
                >
                  <img src={payKraken} alt="KraKen" className="footer-payment-logo" />
                  <span className="footer-payment-name">KraKen</span>
                </a>
                <a
                  href="https://www.coinbase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="Coinbase"
                >
                  <img src={payCoinbase} alt="Coinbase" className="footer-payment-logo" />
                  <span className="footer-payment-name">Coinbase</span>
                </a>
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="MetaMask"
                >
                  <img src={payMetamask} alt="MetaMask" className="footer-payment-logo" />
                  <span className="footer-payment-name">MetaMask</span>
                </a>
                <a
                  href="https://www.kucoin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="KuCoin"
                >
                  <img src={payKucoin} alt="KuCoin" className="footer-payment-logo" />
                  <span className="footer-payment-name">KuCoin</span>
                </a>
                <a
                  href="https://www.bitfinex.com"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-payment-badge"
                  aria-label="Bitfinex"
                >
                  <img src={payBitfinex} alt="Bitfinex" className="footer-payment-logo" />
                  <span className="footer-payment-name">Bitfinex</span>
                </a>
              </div>
            </div>
            <div className="footer-about">
              <div className="footer-about-title">TikTok</div>
              <p className="footer-about-text">
                {lang === 'zh'
                  ? 'TikTok Mall 是全球短视频购物体验平台，与多家优质供应商合作，面向全球的电子商务平台。我们致力于为用户提供丰富多样的商品选择、安全便捷的支付体验以及贴心的售后服务。'
                  : 'TikTok Mall is a global short-video shopping platform, working with high‑quality suppliers to serve customers worldwide. We focus on rich product selection, secure and easy payments, and reliable after‑sales service.'}
              </p>
              <p className="footer-about-text">
                {lang === 'zh'
                  ? '平台覆盖东南亚、欧洲等地区，服务超过 10,000 家商家与用户，并持续拓展中。'
                  : 'Our platform covers Southeast Asia, Europe and more, already serving over 10,000 merchants and users, and continues to expand.'}
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-main">
              {lang === 'zh'
                ? 'TikTok Mall © 2024 版权所有'
                : 'TikTok Mall © 2024 All rights reserved'}
            </div>
            <div className="footer-bottom-sub">
              Gotushop is headquartered in Ottawa, 151 O&apos;Connor Street, Ground Floor, Canada, and has 6
              office locations.
            </div>
          </div>

          <button
            type="button"
            className="footer-backtop"
            aria-label={lang === 'zh' ? '返回顶部' : 'Back to top'}
            onClick={handleBackToTop}
          >
            ↑
          </button>
        </div>
      </footer>

      {isAuthed && (
        <>
          <FloatingCart onClick={() => setCartOpen(true)} />
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
      )}

      {subscribeSuccessOpen && (
        <div
          className="subscribe-success-overlay"
          role="dialog"
          aria-label={lang === 'zh' ? '订阅成功' : 'Subscribed successfully'}
          onClick={() => setSubscribeSuccessOpen(false)}
        >
          <div className="subscribe-success-box" onClick={(e) => e.stopPropagation()}>
            <div className="subscribe-success-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 6L9 17l-5-5"
                />
              </svg>
            </div>
            <p className="subscribe-success-text">
              {lang === 'zh'
                ? '订阅成功！我们将尽快与您取得联系'
                : 'Subscription successful! We will contact you as soon as possible.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout

