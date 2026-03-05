import React, { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'

const AUTH_USER_KEY = 'authUser'

function getAuth(): { id: string; shopId: string } | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_USER_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string; shopId?: string }
    const id = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    if (!id || !shopId) return null
    return { id, shopId }
  } catch {
    return null
  }
}

interface ShopBasic {
  logo: string | null
  banner: string | null
}

const MerchantSettings: React.FC = () => {
  const { lang } = useLang()
  const auth = getAuth()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [loadOk, setLoadOk] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [loadingLogo, setLoadingLogo] = useState(false)
  const [loadingBanner, setLoadingBanner] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!auth?.shopId) {
      setLoadOk(true)
      return
    }
    let cancelled = false
    const cacheKey = `merchantSettings:${auth.shopId}`

    // 优先使用上一次成功加载的店铺基础信息，加快首屏展示
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw) as ShopBasic
          setLogoUrl(cached.logo ?? null)
          setBannerUrl(cached.banner ?? null)
          setLoadOk(true)
        }
      }
    } catch {
      // ignore cache error
    }

    const fetchShop = () => {
      api
        .get<ShopBasic>(`/api/shops/${encodeURIComponent(auth.shopId)}`)
        .then((res) => {
          if (cancelled) return
          const nextLogo = (res as ShopBasic).logo ?? null
          const nextBanner = (res as ShopBasic).banner ?? null
          setLogoUrl(nextLogo)
          setBannerUrl(nextBanner)
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                cacheKey,
                JSON.stringify({ logo: nextLogo, banner: nextBanner }),
              )
            }
          } catch {
            // ignore cache write error
          }
        })
        .catch(() => {
          if (!cancelled) setLoadOk(true)
        })
        .finally(() => {
          if (!cancelled) setLoadOk(true)
        })
    }

    fetchShop()

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchShop()
    }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(fetchShop, 5000)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [auth?.shopId])

  const showMsg = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(null), 3000)
  }

  const patchLogo = (url: string | null) => {
    if (!auth?.shopId || !auth?.id) {
      return Promise.reject(
        new Error(lang === 'zh' ? '未登录' : 'Not logged in'),
      )
    }
    return api.patch<{ success?: boolean }>(`/api/shops/${encodeURIComponent(auth.shopId)}`, {
      userId: auth.id,
      logo: url,
    })
  }

  const patchBanner = (url: string | null) => {
    if (!auth?.shopId || !auth?.id) {
      return Promise.reject(
        new Error(lang === 'zh' ? '未登录' : 'Not logged in'),
      )
    }
    return api.patch<{ success?: boolean }>(`/api/shops/${encodeURIComponent(auth.shopId)}`, {
      userId: auth.id,
      banner: url,
    })
  }

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setLoadingLogo(true)
    api
      .uploadImage(file)
      .then(({ url }) => patchLogo(url).then(() => url))
      .then((url) => {
        if (url) setLogoUrl(url)
        showMsg(
          lang === 'zh' ? 'Logo 已更新' : 'Logo has been updated',
        )
      })
      .catch((err: Error) =>
        showMsg(
          err?.message ??
            (lang === 'zh' ? '上传失败' : 'Upload failed'),
        ),
      )
      .finally(() => setLoadingLogo(false))
  }

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setLoadingBanner(true)
    api
      .uploadImage(file)
      .then(({ url }) => patchBanner(url).then(() => url))
      .then((url) => {
        if (url) setBannerUrl(url)
        showMsg(
          lang === 'zh' ? '横幅已更新' : 'Banner has been updated',
        )
      })
      .catch((err: Error) =>
        showMsg(
          err?.message ??
            (lang === 'zh' ? '上传失败' : 'Upload failed'),
        ),
      )
      .finally(() => setLoadingBanner(false))
  }

  const removeLogo = () => {
    if (!auth?.shopId || !auth?.id) return
    setLoadingLogo(true)
    patchLogo(null)
      .then(() => {
        setLogoUrl(null)
        showMsg(
          lang === 'zh' ? '已移除 Logo' : 'Logo removed',
        )
      })
      .catch((err: Error) =>
        showMsg(
          err?.message ??
            (lang === 'zh' ? '移除失败' : 'Failed to remove'),
        ),
      )
      .finally(() => setLoadingLogo(false))
  }

  const removeBanner = () => {
    if (!auth?.shopId || !auth?.id) return
    setLoadingBanner(true)
    patchBanner(null)
      .then(() => {
        setBannerUrl(null)
        showMsg(
          lang === 'zh' ? '已移除横幅' : 'Banner removed',
        )
      })
      .catch((err: Error) =>
        showMsg(
          err?.message ??
            (lang === 'zh' ? '移除失败' : 'Failed to remove'),
        ),
      )
      .finally(() => setLoadingBanner(false))
  }

  return (
    <div className="merchant-settings-page">
      <header className="merchant-settings-header">
        <div className="merchant-settings-header-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <div className="merchant-settings-header-text">
          <h1 className="merchant-settings-title">
            {lang === 'zh' ? '店铺设置' : 'Shop settings'}
          </h1>
          <p className="merchant-settings-subtitle">
            {lang === 'zh'
              ? '上传或更换 Logo / 横幅后会自动更新并删除旧图，无需保存。'
              : 'Upload or replace your shop Logo / banner and it will update automatically (no extra save needed).'}
          </p>
        </div>
      </header>

      {msg && <p className="merchant-settings-msg">{msg}</p>}

      {!auth?.shopId && loadOk && (
        <p className="merchant-settings-error">
          {lang === 'zh'
            ? '未获取到店铺信息，请重新登录商家后台。'
            : 'Shop information not found, please log in to the merchant backend again.'}
        </p>
      )}

      <section className="merchant-settings-section">
        <div className="merchant-settings-section-head">
          <h2 className="merchant-settings-card-title">
            {lang === 'zh' ? '店铺 Logo（店铺头像）' : 'Shop logo (avatar)'}
          </h2>
          <p className="merchant-settings-card-desc">
            {lang === 'zh'
              ? '建议 200×200 像素，支持 JPG、PNG、WebP。下方为当前预览。'
              : 'Recommended 200×200 pixels, supports JPG, PNG, WebP. Preview is shown below.'}
          </p>
        </div>
        <div className="merchant-settings-block">
          <div
            className="merchant-settings-preview merchant-settings-preview--logo"
            onClick={() => (logoUrl || loadingLogo) ? undefined : logoInputRef.current?.click()}
            role={(logoUrl || loadingLogo) ? undefined : 'button'}
            tabIndex={(logoUrl || loadingLogo) ? undefined : 0}
            onKeyDown={e => { if (!logoUrl && !loadingLogo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); logoInputRef.current?.click() } }}
          >
            {!loadOk ? (
              <span className="merchant-settings-preview-placeholder">
                {lang === 'zh' ? '加载中…' : 'Loading…'}
              </span>
            ) : loadingLogo ? (
              <span className="merchant-settings-preview-placeholder">
                {lang === 'zh' ? '上传中…' : 'Uploading…'}
              </span>
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt={lang === 'zh' ? '店铺 Logo' : 'Shop logo'}
                className="merchant-settings-preview-img"
              />
            ) : (
              <span className="merchant-settings-preview-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                {lang === 'zh' ? '点击上传' : 'Click to upload'}
              </span>
            )}
          </div>
          <div className="merchant-settings-actions">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="merchant-settings-file-input"
              aria-label={lang === 'zh' ? '上传 Logo' : 'Upload logo'}
              onChange={onLogoChange}
            />
            <button
              type="button"
              className="merchant-settings-btn merchant-settings-btn--primary"
              onClick={() => logoInputRef.current?.click()}
              disabled={!loadOk || loadingLogo}
            >
              {lang === 'zh' ? '上传 Logo' : 'Upload logo'}
            </button>
            {logoUrl && (
              <button type="button" className="merchant-settings-btn merchant-settings-btn--ghost" onClick={removeLogo} disabled={loadingLogo}>
                {lang === 'zh' ? '移除' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="merchant-settings-section">
        <div className="merchant-settings-section-head">
          <h2 className="merchant-settings-card-title">
            {lang === 'zh' ? '店铺横幅' : 'Shop banner'}
          </h2>
          <p className="merchant-settings-card-desc">
            {lang === 'zh'
              ? '建议 1200×300 像素或同比例，展示在店铺首页顶部。下方为当前预览。'
              : 'Recommended 1200×300 pixels (or same ratio), shown at the top of your shop homepage. Preview is shown below.'}
          </p>
        </div>
        <div className="merchant-settings-block merchant-settings-block--banner">
          <div
            className="merchant-settings-preview merchant-settings-preview--banner"
            onClick={() => (bannerUrl || loadingBanner) ? undefined : bannerInputRef.current?.click()}
            role={(bannerUrl || loadingBanner) ? undefined : 'button'}
            tabIndex={(bannerUrl || loadingBanner) ? undefined : 0}
            onKeyDown={e => { if (!bannerUrl && !loadingBanner && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); bannerInputRef.current?.click() } }}
          >
            {!loadOk ? (
              <span className="merchant-settings-preview-placeholder">
                {lang === 'zh' ? '加载中…' : 'Loading…'}
              </span>
            ) : loadingBanner ? (
              <span className="merchant-settings-preview-placeholder">
                {lang === 'zh' ? '上传中…' : 'Uploading…'}
              </span>
            ) : bannerUrl ? (
              <img
                src={bannerUrl}
                alt={lang === 'zh' ? '店铺横幅' : 'Shop banner'}
                className="merchant-settings-preview-img"
              />
            ) : (
              <span className="merchant-settings-preview-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                {lang === 'zh' ? '点击上传横幅' : 'Click to upload banner'}
              </span>
            )}
          </div>
          <div className="merchant-settings-actions">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="merchant-settings-file-input"
              aria-label={lang === 'zh' ? '上传横幅' : 'Upload banner'}
              onChange={onBannerChange}
            />
            <button
              type="button"
              className="merchant-settings-btn merchant-settings-btn--primary"
              onClick={() => bannerInputRef.current?.click()}
              disabled={!loadOk || loadingBanner}
            >
              {lang === 'zh' ? '上传横幅' : 'Upload banner'}
            </button>
            {bannerUrl && (
              <button type="button" className="merchant-settings-btn merchant-settings-btn--ghost" onClick={removeBanner} disabled={loadingBanner}>
                {lang === 'zh' ? '移除' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default MerchantSettings
