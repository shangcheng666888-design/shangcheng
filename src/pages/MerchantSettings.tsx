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

  // 店铺交易密码（提现密码）管理
  const [shopHasTradePwd, setShopHasTradePwd] = useState<boolean | null>(null)
  const [shopTradeMode, setShopTradeMode] = useState<'summary' | 'set' | 'edit'>('summary')
  const [shopTradeOld, setShopTradeOld] = useState('')
  const [shopTradeNew, setShopTradeNew] = useState('')
  const [shopTradeConfirm, setShopTradeConfirm] = useState('')
  const [shopTradeShowOld, setShopTradeShowOld] = useState(false)
  const [shopTradeShowNew, setShopTradeShowNew] = useState(false)
  const [shopTradeShowConfirm, setShopTradeShowConfirm] = useState(false)
  const [shopTradeErrors, setShopTradeErrors] = useState({ old: '', new: '', confirm: '' })

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

  const restrictToSixDigits = (v: string) => v.replace(/\D/g, '').slice(0, 6)

  // 查询店铺是否已设置交易密码
  useEffect(() => {
    if (!auth?.shopId || !auth?.id) {
      setShopHasTradePwd(null)
      return
    }
    let cancelled = false
    api
      .get<{ hasTradePassword?: boolean }>(
        `/api/shops/${encodeURIComponent(auth.shopId)}/trade-password/status?userId=${encodeURIComponent(
          auth.id,
        )}`,
      )
      .then((res) => {
        if (cancelled) return
        setShopHasTradePwd(!!res.hasTradePassword)
        setShopTradeMode('summary')
      })
      .catch(() => {
        if (!cancelled) setShopHasTradePwd(null)
      })
    return () => {
      cancelled = true
    }
  }, [auth?.shopId, auth?.id])

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

  const validateShopTradeSet = (): boolean => {
    const next = { old: '', new: '', confirm: '' }
    const pinRegex = /^\d{6}$/
    if (!pinRegex.test(shopTradeNew)) {
      next.new =
        lang === 'zh'
          ? '交易密码需为 6 位数字'
          : 'Payment PIN must be 6 digits'
    }
    if (!pinRegex.test(shopTradeConfirm)) {
      next.confirm =
        lang === 'zh'
          ? '请再次输入 6 位数字密码'
          : 'Please confirm the 6‑digit PIN'
    } else if (shopTradeNew !== shopTradeConfirm) {
      next.confirm =
        lang === 'zh'
          ? '两次输入的密码不一致'
          : 'The two PINs do not match'
    }
    setShopTradeErrors(next)
    return !next.new && !next.confirm
  }

  const validateShopTradeEdit = (): boolean => {
    const next = { old: '', new: '', confirm: '' }
    const pinRegex = /^\d{6}$/
    if (!pinRegex.test(shopTradeOld)) {
      next.old =
        lang === 'zh'
          ? '请输入当前 6 位密码'
          : 'Please enter your current 6‑digit PIN'
    }
    if (!pinRegex.test(shopTradeNew)) {
      next.new =
        lang === 'zh'
          ? '新密码需为 6 位数字'
          : 'New PIN must be 6 digits'
    }
    if (!pinRegex.test(shopTradeConfirm)) {
      next.confirm =
        lang === 'zh'
          ? '请再次输入 6 位数字密码'
          : 'Please confirm the 6‑digit PIN'
    } else if (shopTradeNew !== shopTradeConfirm) {
      next.confirm =
        lang === 'zh'
          ? '两次输入的密码不一致'
          : 'The two PINs do not match'
    }
    setShopTradeErrors(next)
    return !next.old && !next.new && !next.confirm
  }

  const resetShopTradeForm = () => {
    setShopTradeOld('')
    setShopTradeNew('')
    setShopTradeConfirm('')
    setShopTradeShowOld(false)
    setShopTradeShowNew(false)
    setShopTradeShowConfirm(false)
    setShopTradeErrors({ old: '', new: '', confirm: '' })
  }

  const handleShopTradeSetSubmit = () => {
    if (!auth?.shopId || !auth?.id) {
      showMsg(lang === 'zh' ? '未登录商家账号' : 'Not logged in to merchant account')
      return
    }
    if (!validateShopTradeSet()) return
    api
      .post(`/api/shops/${encodeURIComponent(auth.shopId)}/trade-password/set`, {
        userId: auth.id,
        newTradePassword: shopTradeNew,
      })
      .then(() => {
        showMsg(lang === 'zh' ? '店铺交易密码已设置' : 'Shop payment PIN has been set')
        setShopHasTradePwd(true)
        setShopTradeMode('summary')
        resetShopTradeForm()
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '设置失败' : 'Failed to set PIN'
        showMsg(err instanceof Error ? err.message : fallback)
      })
  }

  const handleShopTradeEditSubmit = () => {
    if (!auth?.shopId || !auth?.id) {
      showMsg(lang === 'zh' ? '未登录商家账号' : 'Not logged in to merchant account')
      return
    }
    if (!validateShopTradeEdit()) return
    api
      .post(`/api/shops/${encodeURIComponent(auth.shopId)}/trade-password/change`, {
        userId: auth.id,
        oldTradePassword: shopTradeOld,
        newTradePassword: shopTradeNew,
      })
      .then(() => {
        showMsg(lang === 'zh' ? '店铺交易密码已修改' : 'Shop payment PIN has been updated')
        setShopHasTradePwd(true)
        setShopTradeMode('summary')
        resetShopTradeForm()
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '修改失败' : 'Failed to update PIN'
        showMsg(err instanceof Error ? err.message : fallback)
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
            {lang === 'zh' ? '店铺提现密码' : 'Shop payment PIN'}
          </h2>
          <p className="merchant-settings-card-desc">
            {lang === 'zh'
              ? '用于店铺钱包充值与提现校验，仅店铺本人可设置和修改。请牢记 6 位数字密码。'
              : 'Used to verify top‑ups and withdrawals for your shop wallet. Only the shop owner can set and change this 6‑digit PIN.'}
          </p>
        </div>
        <div className="merchant-settings-block">
          {!auth?.shopId || !auth?.id ? (
            <p className="merchant-settings-error">
              {lang === 'zh'
                ? '未获取到店铺信息，请重新登录商家后台后再设置提现密码。'
                : 'Shop information not found. Please log in to the merchant backend again before setting the payment PIN.'}
            </p>
          ) : shopTradeMode === 'summary' ? (
            <div className="account-settings-summary">
              <p className="account-settings-summary-text">
                {shopHasTradePwd
                  ? (lang === 'zh'
                    ? '已设置店铺提现密码，可用于店铺钱包充值与提现校验。'
                    : 'Shop payment PIN is set and will be used to verify wallet top‑ups and withdrawals.')
                  : (lang === 'zh'
                    ? '当前尚未设置店铺提现密码，为保障资金安全，请先设置。'
                    : 'Shop payment PIN is not set yet. For security, please set it before using wallet withdrawals.')}
              </p>
              <div className="account-settings-summary-actions">
                {shopHasTradePwd ? (
                  <button
                    type="button"
                    className="account-settings-submit"
                    onClick={() => {
                      resetShopTradeForm()
                      setShopTradeMode('edit')
                    }}
                  >
                    {lang === 'zh' ? '修改提现密码' : 'Change payment PIN'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="account-settings-submit"
                    onClick={() => {
                      resetShopTradeForm()
                      setShopTradeMode('set')
                    }}
                  >
                    {lang === 'zh' ? '设置提现密码' : 'Set payment PIN'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="account-settings-form">
              {shopTradeMode === 'edit' && (
                <div className="account-settings-field">
                  <label className="account-settings-label">
                    <span className="account-settings-required">*</span>
                    {lang === 'zh' ? '旧密码' : 'Current PIN'}
                  </label>
                  <div className="account-settings-input-wrap">
                    <input
                      type={shopTradeShowOld ? 'text' : 'password'}
                      className="account-settings-input"
                      placeholder={
                        lang === 'zh'
                          ? '请输入 6 位数字旧密码'
                          : 'Please enter your current 6‑digit PIN'
                      }
                      value={shopTradeOld}
                      onChange={(e) => setShopTradeOld(restrictToSixDigits(e.target.value))}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="account-settings-pwd-toggle"
                      aria-label={
                        shopTradeShowOld
                          ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                          : (lang === 'zh' ? '显示密码' : 'Show PIN')
                      }
                      onClick={() => setShopTradeShowOld((v) => !v)}
                    >
                      {shopTradeShowOld ? (
                        <svg className="account-settings-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                          <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.66 1.66c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 4.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                        </svg>
                      ) : (
                        <svg className="account-settings-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                          <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {shopTradeErrors.old && (
                    <div className="login-error-slot">
                      <p className="login-error-text">{shopTradeErrors.old}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="account-settings-field">
                <label className="account-settings-label">
                  <span className="account-settings-required">*</span>
                  {lang === 'zh' ? '新密码' : 'New PIN'}
                </label>
                <div className="account-settings-input-wrap">
                  <input
                    type={shopTradeShowNew ? 'text' : 'password'}
                    className="account-settings-input"
                    placeholder={
                      lang === 'zh'
                        ? '请输入 6 位数字密码'
                        : 'Please enter a new 6‑digit PIN'
                    }
                    value={shopTradeNew}
                    onChange={(e) => setShopTradeNew(restrictToSixDigits(e.target.value))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="account-settings-pwd-toggle"
                    aria-label={
                      shopTradeShowNew
                        ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                        : (lang === 'zh' ? '显示密码' : 'Show PIN')
                    }
                    onClick={() => setShopTradeShowNew((v) => !v)}
                  >
                    {shopTradeShowNew ? (
                      <svg className="account-settings-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.66 1.66c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 4.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    ) : (
                      <svg className="account-settings-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
                {shopTradeErrors.new && (
                  <div className="login-error-slot">
                    <p className="login-error-text">{shopTradeErrors.new}</p>
                  </div>
                )}
              </div>

              <div className="account-settings-field">
                <label className="account-settings-label">
                  <span className="account-settings-required">*</span>
                  {lang === 'zh' ? '确认密码' : 'Confirm PIN'}
                </label>
                <div className="account-settings-input-wrap">
                  <input
                    type={shopTradeShowConfirm ? 'text' : 'password'}
                    className="account-settings-input"
                    placeholder={
                      lang === 'zh'
                        ? '请再次输入 6 位数字密码'
                        : 'Please confirm the 6‑digit PIN'
                    }
                    value={shopTradeConfirm}
                    onChange={(e) => setShopTradeConfirm(restrictToSixDigits(e.target.value))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="account-settings-pwd-toggle"
                    aria-label={
                      shopTradeShowConfirm
                        ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                        : (lang === 'zh' ? '显示密码' : 'Show PIN')
                    }
                    onClick={() => setShopTradeShowConfirm((v) => !v)}
                  >
                    {shopTradeShowConfirm ? (
                      <svg className="account-settings-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.66 1.66c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 4.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    ) : (
                      <svg className="account-settings-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
                {shopTradeErrors.confirm && (
                  <div className="login-error-slot">
                    <p className="login-error-text">{shopTradeErrors.confirm}</p>
                  </div>
                )}
              </div>

              <div className="account-settings-actions">
                <button
                  type="button"
                  className="account-settings-submit"
                  onClick={shopTradeMode === 'edit' ? handleShopTradeEditSubmit : handleShopTradeSetSubmit}
                >
                  {lang === 'zh' ? '确认' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="account-settings-cancel"
                  onClick={() => {
                    resetShopTradeForm()
                    setShopTradeMode('summary')
                  }}
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
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
