import React, { useState, useCallback } from 'react'
import walletIcon from '../assets/qianbao.png'
import orderIcon from '../assets/dingdan.png'
import favoriteIcon from '../assets/shngpinshoucang.png'
import shopFavIcon from '../assets/dianpu.png'
import settingsIcon from '../assets/shezhi.png'
import { useToast } from './ToastProvider'
import { AVATAR_STORAGE_KEY, AVATAR_OPTIONS } from '../utils/avatarOptions'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'

type AccountNavKey =
  | 'wallet'
  | 'orders'
  | 'productFavorites'
  | 'shopFavorites'
  | 'settings'

interface AccountSidebarProps {
  activeKey?: AccountNavKey
  onSelect?: (key: AccountNavKey) => void
}

const getStoredAvatar = (): string | null => {
  if (typeof window === 'undefined') return null
  const url = window.localStorage.getItem(AVATAR_STORAGE_KEY)
  return url && AVATAR_OPTIONS.includes(url) ? url : null
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({ activeKey = 'wallet', onSelect }) => {
  const { showToast } = useToast()
  const { lang } = useLang()
  const authUser = (() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem('authUser')
      if (!raw) return null
      return JSON.parse(raw) as { id?: string; account?: string; avatar?: string | null; type?: 'email' | 'phone'; value?: string }
    } catch {
      return null
    }
  })()
  const initialAvatar = (authUser?.avatar && AVATAR_OPTIONS.includes(authUser.avatar)) ? authUser.avatar : getStoredAvatar()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  const handleSelectAvatar = useCallback((url: string) => {
    const uid = authUser?.id
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.patch(`/api/users/${uid}`, { avatar: url })
      .then(() => {
        const next = { ...authUser, avatar: url }
        window.localStorage.setItem('authUser', JSON.stringify(next))
        window.localStorage.setItem(AVATAR_STORAGE_KEY, url)
        setAvatarUrl(url)
        setAvatarPickerOpen(false)
        showToast(lang === 'zh' ? '头像已更换' : 'Avatar updated')
      })
      .catch(() => showToast(lang === 'zh' ? '头像保存失败' : 'Failed to save avatar', 'error'))
  }, [showToast, authUser, lang])

  const displayAuthValue = (v: string | undefined) => (v && typeof v === 'string' ? v : '')

  // 商城登录存 value，商家登录存 account
  const userLabel = authUser
    ? displayAuthValue(authUser.value ?? authUser.account)
    : (lang === 'zh' ? '未登录用户' : 'Guest user')

  const userId = authUser?.id ?? ''
  const displayId = userId || (authUser?.account ?? authUser?.value) || '—'
  const handleCopyId = () => {
    const toCopy = userId || authUser?.account || authUser?.value
    if (!toCopy) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(toCopy)
        .then(() => {
          showToast(lang === 'zh' ? '复制成功' : 'Copied')
        })
        .catch(() => {
          showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
        })
    } else {
      showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
    }
  }

  const handleSelect = (key: AccountNavKey) => {
    if (onSelect) {
      onSelect(key)
    }
  }

  const navItemClass = (key: AccountNavKey) =>
    `account-nav-item${activeKey === key ? ' account-nav-item--active' : ''}`

  return (
    <aside className="account-sidebar">
      <div className="account-profile">
        <button
          type="button"
          className="account-avatar account-avatar-btn"
          onClick={() => setAvatarPickerOpen(true)}
          aria-label={lang === 'zh' ? '更换头像' : 'Change avatar'}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="account-avatar-img" />
          ) : (
            <span className="account-avatar-text">
              {userLabel && /[0-9]/.test(userLabel[0]) ? 'U' : userLabel[0] || 'U'}
            </span>
          )}
        </button>
        <div className="account-profile-main">
          <div className="account-profile-name">
            {userLabel || (lang === 'zh' ? '账户' : 'Account')}
          </div>
          <div className="account-profile-id">
            <span className="account-profile-id-label">
              {lang === 'zh' ? '账户ID：' : 'Account ID: '}
            </span>
            <span className="account-profile-id-value">{displayId}</span>
            <button
              type="button"
              className="account-id-copy"
              aria-label={lang === 'zh' ? '复制账户ID' : 'Copy account ID'}
              onClick={handleCopyId}
              disabled={!displayId || displayId === '—'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <rect
                  x="7"
                  y="7"
                  width="11"
                  height="13"
                  rx="2"
                  ry="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <rect
                  x="5"
                  y="4"
                  width="11"
                  height="13"
                  rx="2"
                  ry="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  opacity="0.6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <nav className="account-nav">
        <button
          type="button"
          className={navItemClass('wallet')}
          onClick={() => handleSelect('wallet')}
        >
          <span className="account-nav-icon account-nav-icon--wallet">
            <img
              src={walletIcon}
              alt={lang === 'zh' ? '我的钱包' : 'My wallet'}
              className="account-nav-wallet-img"
            />
          </span>
          <span className="account-nav-label">
            {lang === 'zh' ? '我的钱包' : 'My wallet'}
          </span>
        </button>
        <button
          type="button"
          className={navItemClass('orders')}
          onClick={() => handleSelect('orders')}
        >
          <span className="account-nav-icon account-nav-icon--order">
            <img
              src={orderIcon}
              alt={lang === 'zh' ? '我的订单' : 'My orders'}
              className="account-nav-order-img"
            />
          </span>
          <span className="account-nav-label">
            {lang === 'zh' ? '我的订单' : 'My orders'}
          </span>
        </button>
        <button
          type="button"
          className={navItemClass('productFavorites')}
          onClick={() => handleSelect('productFavorites')}
        >
          <span className="account-nav-icon account-nav-icon--favorite">
            <img
              src={favoriteIcon}
              alt={lang === 'zh' ? '商品收藏' : 'Product favorites'}
              className="account-nav-favorite-img"
            />
          </span>
          <span className="account-nav-label">
            {lang === 'zh' ? '商品收藏' : 'Product favorites'}
          </span>
        </button>
        <button
          type="button"
          className={navItemClass('shopFavorites')}
          onClick={() => handleSelect('shopFavorites')}
        >
          <span className="account-nav-icon account-nav-icon--shop-fav">
            <img
              src={shopFavIcon}
              alt={lang === 'zh' ? '关注店铺' : 'Followed shops'}
              className="account-nav-shop-fav-img"
            />
          </span>
          <span className="account-nav-label">
            {lang === 'zh' ? '关注店铺' : 'Followed shops'}
          </span>
        </button>
        <button
          type="button"
          className={navItemClass('settings')}
          onClick={() => handleSelect('settings')}
        >
          <span className="account-nav-icon account-nav-icon--settings">
            <img
              src={settingsIcon}
              alt={lang === 'zh' ? '设置' : 'Settings'}
              className="account-nav-settings-img"
            />
          </span>
          <span className="account-nav-label">
            {lang === 'zh' ? '设置' : 'Settings'}
          </span>
        </button>
      </nav>

      {avatarPickerOpen && (
        <>
          <div
            className="account-avatar-picker-overlay"
            onClick={() => setAvatarPickerOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
          <div
            className="account-avatar-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-avatar-picker-title"
          >
            <div className="account-avatar-picker-head">
              <h2 id="account-avatar-picker-title" className="account-avatar-picker-title">
                {lang === 'zh' ? '选择头像' : 'Choose avatar'}
              </h2>
              <button
                type="button"
                className="account-avatar-picker-close"
                onClick={() => setAvatarPickerOpen(false)}
                aria-label={lang === 'zh' ? '关闭' : 'Close'}
              >
                ×
              </button>
            </div>
            <div className="account-avatar-picker-grid">
              {AVATAR_OPTIONS.map((url) => (
                <button
                  key={url}
                  type="button"
                  className={`account-avatar-option${avatarUrl === url ? ' account-avatar-option--selected' : ''}`}
                  onClick={() => handleSelectAvatar(url)}
                  aria-label={lang === 'zh' ? '选择头像' : 'Choose avatar'}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

export type { AccountNavKey, AccountSidebarProps }
export default AccountSidebar

