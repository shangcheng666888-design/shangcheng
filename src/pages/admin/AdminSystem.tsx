import React, { useState, useEffect, useRef, useCallback } from 'react'
import { api, apiBase } from '../../api/client'
import { useToast } from '../../components/ToastProvider'

/** 解析商品图片地址：相对路径时补全为后端完整 URL */
function resolveImageSrc(url: string | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const s = url.trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  return apiBase ? `${apiBase.replace(/\/$/, '')}${s.startsWith('/') ? '' : '/'}${s}` : s
}

interface Config {
  receiveAddress: string
  receiveQrUrl: string
}

interface FeaturedProductRow {
  id: number
  shopId: string
  listingId: string
  sortOrder: number
  shopName: string
  productTitle: string
  image?: string
  price?: string
}

interface FeaturedShopRow {
  id: number
  shopId: string
  sortOrder: number
  shopName: string
  logo?: string | null
}

interface ShopOption {
  id: string
  name: string
}

interface ShopProductOption {
  listingId: string
  productId: string
  title: string
  image: string
  price: number
}

const FEATURED_PRODUCTS_MAX = 24
const FEATURED_SHOPS_MAX = 9
const HOT_PRODUCTS_MAX = 24

const CROP_SIZE = 280
const CROP_VIEW_SIZE = 360
const FRAME_MAX = CROP_VIEW_SIZE - CROP_SIZE

const AdminSystem: React.FC = () => {
  const [config, setConfig] = useState<Config>({ receiveAddress: '', receiveQrUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [receiveAddressInput, setReceiveAddressInput] = useState('')
  const [receiveQrUrlInput, setReceiveQrUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProductRow[]>([])
  const [featuredShops, setFeaturedShops] = useState<FeaturedShopRow[]>([])
  const [hotProducts, setHotProducts] = useState<FeaturedProductRow[]>([])
  const [shopsList, setShopsList] = useState<ShopOption[]>([])
  const [shopProductsMap, setShopProductsMap] = useState<Record<string, ShopProductOption[]>>({})
  const [homeFeatLoading, setHomeFeatLoading] = useState(false)
  const [homeFeatSaving, setHomeFeatSaving] = useState<string | null>(null)

  const [searchShopIdInput, setSearchShopIdInput] = useState('')
  const [searchShopResult, setSearchShopResult] = useState<{ shopId: string; shopName: string; products: ShopProductOption[] } | null>(null)
  const [searchShopLoading, setSearchShopLoading] = useState(false)

  const [searchFeaturedShopInput, setSearchFeaturedShopInput] = useState('')
  const [searchFeaturedShopResult, setSearchFeaturedShopResult] = useState<{ shopId: string; shopName: string } | null>(null)
  const [searchFeaturedShopLoading, setSearchFeaturedShopLoading] = useState(false)

  const [searchHotShopIdInput, setSearchHotShopIdInput] = useState('')
  const [searchHotShopResult, setSearchHotShopResult] = useState<{ shopId: string; shopName: string; products: ShopProductOption[] } | null>(null)
  const [searchHotShopLoading, setSearchHotShopLoading] = useState(false)

  // 裁剪弹窗：缩放只放大图片（图片固定居中），裁剪框可拖动对准区域
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [cropImageSize, setCropImageSize] = useState({ w: 0, h: 0 })
  const [cropBaseScale, setCropBaseScale] = useState(1)
  const [cropZoom, setCropZoom] = useState(1)
  const [framePos, setFramePos] = useState({ x: FRAME_MAX / 2, y: FRAME_MAX / 2 })
  const [cropImageReady, setCropImageReady] = useState(false)
  const frameDragStart = useRef({ x: 0, y: 0, frameX: 0, frameY: 0 })
  const cropUploading = useRef(false)
  const cropImageRef = useRef<HTMLImageElement | null>(null)
  const cropStateRef = useRef({ baseScale: 1, zoom: 1, frameX: 0, frameY: 0, w: 0, h: 0 })
  const effectiveScale = cropBaseScale * cropZoom
  cropStateRef.current = { baseScale: cropBaseScale, zoom: cropZoom, frameX: framePos.x, frameY: framePos.y, w: cropImageSize.w, h: cropImageSize.h }

  useEffect(() => {
    let cancelled = false
    api
      .get<Config>('/api/admin/platform-payment-config')
      .then((data) => {
        if (cancelled) return
        setConfig({ receiveAddress: data.receiveAddress ?? '', receiveQrUrl: data.receiveQrUrl ?? '' })
        setReceiveAddressInput(data.receiveAddress ?? '')
        setReceiveQrUrlInput(data.receiveQrUrl ?? '')
      })
      .catch(() => {
        if (!cancelled) showToast('加载配置失败', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [showToast])

  useEffect(() => {
    let cancelled = false
    setHomeFeatLoading(true)
    Promise.all([
      api.get<FeaturedProductRow[]>('/api/admin/home-featured/featured-products').then((d) => (Array.isArray(d) ? d : [])),
      api.get<FeaturedShopRow[]>('/api/admin/home-featured/featured-shops').then((d) => (Array.isArray(d) ? d : [])),
      api.get<FeaturedProductRow[]>('/api/admin/home-featured/hot-products').then((d) => (Array.isArray(d) ? d : [])),
      api.get<{ list: ShopOption[] }>('/api/shops').then((d) => d.list ?? []),
    ])
      .then(([fp, fs, hp, shops]) => {
        if (cancelled) return
        setFeaturedProducts(fp)
        setFeaturedShops(fs)
        setHotProducts(hp)
        setShopsList(shops)
      })
      .catch(() => {
        if (!cancelled) showToast('加载首页推荐数据失败', 'error')
      })
      .finally(() => {
        if (!cancelled) setHomeFeatLoading(false)
      })
    return () => { cancelled = true }
  }, [showToast])

  const loadShopProducts = useCallback((shopId: string) => {
    if (!shopId) return
    api
      .get<{ list: ShopProductOption[] }>(`/api/shops/${encodeURIComponent(shopId)}/products`)
      .then((d) => setShopProductsMap((m) => ({ ...m, [shopId]: d.list ?? [] })))
      .catch(() => setShopProductsMap((m) => ({ ...m, [shopId]: [] })))
  }, [])

  const searchShopById = useCallback(() => {
    const shopId = searchShopIdInput.trim()
    if (!shopId) {
      showToast('请输入店铺 ID', 'error')
      return
    }
    setSearchShopLoading(true)
    setSearchShopResult(null)
    Promise.all([
      api.get<{ list: ShopOption[] }>(`/api/shops?shop=${encodeURIComponent(shopId)}`),
      api.get<{ list: ShopProductOption[] }>(`/api/shops/${encodeURIComponent(shopId)}/products`),
    ])
      .then(([shopRes, productsRes]) => {
        const shopList = shopRes.list ?? []
        const shopName = shopList.length > 0 ? shopList[0].name : shopId
        const products = productsRes.list ?? []
        setSearchShopResult({ shopId, shopName, products })
        if (products.length === 0) showToast('该店铺暂无上架商品', 'info')
      })
      .catch((e) => {
        showToast(e instanceof Error ? e.message : '查询失败，请确认店铺 ID 正确', 'error')
      })
      .finally(() => setSearchShopLoading(false))
  }, [searchShopIdInput, showToast])

  const handleSave = () => {
    const addr = receiveAddressInput.trim()
    const qr = receiveQrUrlInput.trim()
    if (!addr || !qr) {
      showToast('请同时填写收款地址与收款二维码', 'error')
      return
    }
    setSaving(true)
    api
      .put('/api/admin/platform-payment-config', { receiveAddress: addr, receiveQrUrl: qr })
      .then(() => {
        setConfig({ receiveAddress: addr, receiveQrUrl: qr })
        showToast('保存成功')
      })
      .catch((e) => {
        showToast(e instanceof Error ? e.message : '保存失败', 'error')
      })
      .finally(() => setSaving(false))
  }

  const canSave = receiveAddressInput.trim() !== '' && receiveQrUrlInput.trim() !== ''

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      showToast('请选择图片文件（JPEG/PNG/GIF/WebP）', 'error')
      e.target.value = ''
      return
    }
    const url = URL.createObjectURL(file)
    setCropImageUrl(url)
    setCropImageSize({ w: 0, h: 0 })
    setCropBaseScale(1)
    setCropZoom(1)
    setFramePos({ x: FRAME_MAX / 2, y: FRAME_MAX / 2 })
    setCropImageReady(false)
    setCropOpen(true)
    e.target.value = ''
  }

  const onCropImageLoad = useCallback(() => {
    const img = cropImageRef.current
    if (!img || !cropImageUrl) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (nw === 0 || nh === 0) return
    setCropImageSize({ w: nw, h: nh })
    const baseScale = Math.min(CROP_VIEW_SIZE / nw, CROP_VIEW_SIZE / nh, 1)
    setCropBaseScale(baseScale)
    setCropZoom(1)
    setCropImageReady(true)
  }, [cropImageUrl])

  const [frameDragging, setFrameDragging] = useState(false)
  useEffect(() => {
    if (!frameDragging) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - frameDragStart.current.x
      const dy = e.clientY - frameDragStart.current.y
      const clamp = (v: number) => Math.max(0, Math.min(FRAME_MAX, v))
      setFramePos({
        x: clamp(frameDragStart.current.frameX + dx),
        y: clamp(frameDragStart.current.frameY + dy),
      })
    }
    const onUp = () => setFrameDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [frameDragging])

  const handleFrameMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    frameDragStart.current = { x: e.clientX, y: e.clientY, frameX: framePos.x, frameY: framePos.y }
    setFrameDragging(true)
  }

  const handleCropConfirm = useCallback(async () => {
    const img = cropImageRef.current
    if (!img || !cropImageUrl || cropUploading.current) return
    const { baseScale, zoom, frameX, frameY, w: nw, h: nh } = cropStateRef.current
    if (nw === 0 || nh === 0) {
      showToast('请等待图片加载完成', 'error')
      return
    }
    const scale = baseScale * zoom
    const center = CROP_VIEW_SIZE / 2
    const imageLeft = center - (nw * scale) / 2
    const imageTop = center - (nh * scale) / 2
    const cropLeft = frameX
    const cropTop = frameY
    const srcX = (cropLeft - imageLeft) / scale
    const srcY = (cropTop - imageTop) / scale
    const srcSize = CROP_SIZE / scale
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
    let sx = clamp(srcX, 0, nw - 0.01)
    let sy = clamp(srcY, 0, nh - 0.01)
    let sw = clamp(srcSize, 0.01, nw - sx)
    let sh = clamp(srcSize, 0.01, nh - sy)
    const size = Math.min(sw, sh)
    const cx = sx + sw / 2
    const cy = sy + sh / 2
    sx = clamp(cx - size / 2, 0, nw - size)
    sy = clamp(cy - size / 2, 0, nh - size)
    sw = size
    sh = size
    const canvas = document.createElement('canvas')
    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setCropOpen(false)
      URL.revokeObjectURL(cropImageUrl)
      return
    }
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE)
    cropUploading.current = true
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png', 0.95))
      if (!blob) throw new Error('生成图片失败')
      const file = new File([blob], 'qr.png', { type: 'image/png' })
      const { url } = await api.uploadImage(file)
      setReceiveQrUrlInput(url)
      showToast('二维码已裁剪并上传，请点击保存')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '上传失败', 'error')
    } finally {
      cropUploading.current = false
      setCropOpen(false)
      setCropImageUrl(null)
      setCropImageReady(false)
      URL.revokeObjectURL(cropImageUrl)
    }
  }, [cropImageUrl, showToast])

  const handleCropCancel = () => {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl)
    setCropOpen(false)
    setCropImageUrl(null)
  }

  const addFeaturedProduct = (shopId: string, listingId: string) => {
    setHomeFeatSaving('featured-product')
    api
      .post('/api/admin/home-featured/featured-products', { shopId, listingId })
      .then(() => api.get<FeaturedProductRow[]>('/api/admin/home-featured/featured-products'))
      .then((d) => {
        setFeaturedProducts(Array.isArray(d) ? d : [])
        showToast('已添加为推荐产品')
      })
      .catch((e) => showToast(e instanceof Error ? e.message : '添加失败', 'error'))
      .finally(() => setHomeFeatSaving(null))
  }

  const removeFeaturedProduct = (id: number) => {
    setHomeFeatSaving('featured-product')
    api
      .delete(`/api/admin/home-featured/featured-products/${id}`)
      .then(() => api.get<FeaturedProductRow[]>('/api/admin/home-featured/featured-products'))
      .then((d) => setFeaturedProducts(Array.isArray(d) ? d : []))
      .catch((e) => showToast(e instanceof Error ? e.message : '删除失败', 'error'))
      .finally(() => setHomeFeatSaving(null))
  }

  const addFeaturedShop = (shopId: string) => {
    setHomeFeatSaving('featured-shop')
    api
      .post('/api/admin/home-featured/featured-shops', { shopId })
      .then(() => api.get<FeaturedShopRow[]>('/api/admin/home-featured/featured-shops'))
      .then((d) => {
        setFeaturedShops(Array.isArray(d) ? d : [])
        showToast('已添加为推荐店铺')
      })
      .catch((e) => showToast(e instanceof Error ? e.message : '添加失败', 'error'))
      .finally(() => setHomeFeatSaving(null))
  }

  const searchFeaturedShopById = useCallback(() => {
    const shopId = searchFeaturedShopInput.trim()
    if (!shopId) {
      showToast('请输入店铺 ID', 'error')
      return
    }
    setSearchFeaturedShopLoading(true)
    setSearchFeaturedShopResult(null)
    api
      .get<{ list: ShopOption[] }>(`/api/shops?shop=${encodeURIComponent(shopId)}`)
      .then((res) => {
        const list = res.list ?? []
        if (list.length === 0) {
          showToast('未找到该店铺', 'error')
          return
        }
        setSearchFeaturedShopResult({ shopId, shopName: list[0].name })
      })
      .catch((e) => showToast(e instanceof Error ? e.message : '查询失败', 'error'))
      .finally(() => setSearchFeaturedShopLoading(false))
  }, [searchFeaturedShopInput, showToast])

  const searchHotShopById = useCallback(() => {
    const shopId = searchHotShopIdInput.trim()
    if (!shopId) {
      showToast('请输入店铺 ID', 'error')
      return
    }
    setSearchHotShopLoading(true)
    setSearchHotShopResult(null)
    Promise.all([
      api.get<{ list: ShopOption[] }>(`/api/shops?shop=${encodeURIComponent(shopId)}`),
      api.get<{ list: ShopProductOption[] }>(`/api/shops/${encodeURIComponent(shopId)}/products`),
    ])
      .then(([shopRes, productsRes]) => {
        const shopList = shopRes.list ?? []
        const shopName = shopList.length > 0 ? shopList[0].name : shopId
        const products = productsRes.list ?? []
        setSearchHotShopResult({ shopId, shopName, products })
        if (products.length === 0) showToast('该店铺暂无上架商品', 'info')
      })
      .catch((e) => showToast(e instanceof Error ? e.message : '查询失败，请确认店铺 ID 正确', 'error'))
      .finally(() => setSearchHotShopLoading(false))
  }, [searchHotShopIdInput, showToast])

  const removeFeaturedShop = (id: number) => {
    setHomeFeatSaving('featured-shop')
    api
      .delete(`/api/admin/home-featured/featured-shops/${id}`)
      .then(() => api.get<FeaturedShopRow[]>('/api/admin/home-featured/featured-shops'))
      .then((d) => setFeaturedShops(Array.isArray(d) ? d : []))
      .catch((e) => showToast(e instanceof Error ? e.message : '删除失败', 'error'))
      .finally(() => setHomeFeatSaving(null))
  }

  const addHotProduct = (shopId: string, listingId: string) => {
    setHomeFeatSaving('hot-product')
    api
      .post('/api/admin/home-featured/hot-products', { shopId, listingId })
      .then(() => api.get<FeaturedProductRow[]>('/api/admin/home-featured/hot-products'))
      .then((d) => {
        setHotProducts(Array.isArray(d) ? d : [])
        showToast('已添加为热销推荐')
      })
      .catch((e) => showToast(e instanceof Error ? e.message : '添加失败', 'error'))
      .finally(() => setHomeFeatSaving(null))
  }

  const removeHotProduct = (id: number) => {
    setHomeFeatSaving('hot-product')
    api
      .delete(`/api/admin/home-featured/hot-products/${id}`)
      .then(() => api.get<FeaturedProductRow[]>('/api/admin/home-featured/hot-products'))
      .then((d) => setHotProducts(Array.isArray(d) ? d : []))
      .catch((e) => showToast(e instanceof Error ? e.message : '删除失败', 'error'))
      .finally(() => setHomeFeatSaving(null))
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h2 className="admin-page-title">系统管理</h2>
        <p className="admin-page-desc">加载中…</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">系统管理</h2>
      <p className="admin-page-desc">平台统一收款配置：收款地址与收款二维码将展示在商城充值与店铺充值页面。修改时须同时填写收款地址与收款二维码。</p>

      <section className="admin-system-section admin-system-single-box">
        <h3 className="admin-system-section-title">平台统一收款配置</h3>
        <p className="admin-system-hint">收款地址与二维码将展示在商城充值与店铺充值页。保存时须同时填写收款地址与收款二维码。</p>

        <div className="admin-system-form">
          <div className="admin-system-field">
            <label className="admin-system-label">收款地址</label>
            <input
              type="text"
              className="admin-system-input admin-system-input--address"
              value={receiveAddressInput}
              onChange={(e) => setReceiveAddressInput(e.target.value)}
              placeholder="请输入收款地址（如 USDT-TRC20 地址）"
            />
          </div>
          <div className="admin-system-field">
            <label className="admin-system-label">收款二维码</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="admin-system-file-input"
              onChange={handleFileSelect}
              aria-label="上传二维码图片"
            />
            <div className="admin-system-upload-area admin-system-upload-area--square" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()} aria-label="上传二维码图片">
              {receiveQrUrlInput ? (
                <>
                  <img src={receiveQrUrlInput} alt="二维码预览" className="admin-system-upload-preview" />
                  <span className="admin-system-upload-label">点击可重新上传</span>
                </>
              ) : (
                <>
                  <svg className="admin-system-upload-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="admin-system-upload-text">点击上传</span>
                </>
              )}
            </div>
          </div>
          <div className="admin-system-actions">
            <button
              type="button"
              className="admin-system-save-btn"
              onClick={handleSave}
              disabled={saving || !canSave}
            >
              {saving ? '保存中…' : (config.receiveAddress && config.receiveQrUrl ? '修改' : '上传')}
            </button>
            {!canSave && (
              <span className="admin-system-save-hint">请同时填写收款地址并上传收款二维码后再保存</span>
            )}
          </div>
        </div>
      </section>

      <section className="admin-system-section admin-system-single-box">
        <h3 className="admin-system-section-title">推荐产品</h3>
        <p className="admin-system-hint">按店铺 ID 搜索，展示该店铺所有已上架商品，可将商品添加为首页推荐产品。下方为当前正在推荐的产品列表。</p>
        {homeFeatLoading ? (
          <p className="admin-system-hint">加载中…</p>
        ) : (
          <>
            <div className="admin-system-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', marginBottom: 16 }}>
              <div className="admin-system-field" style={{ minWidth: 200 }}>
                <label className="admin-system-label">搜索店铺 ID</label>
                <input
                  type="text"
                  className="admin-system-input"
                  value={searchShopIdInput}
                  onChange={(e) => setSearchShopIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchShopById()}
                  placeholder="输入店铺 ID 后点击搜索"
                />
              </div>
              <button
                type="button"
                className="admin-system-save-btn"
                onClick={searchShopById}
                disabled={searchShopLoading || !searchShopIdInput.trim()}
              >
                {searchShopLoading ? '搜索中…' : '搜索'}
              </button>
            </div>

            {searchShopResult && (
              <div className="admin-system-search-result" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <p className="admin-system-hint" style={{ margin: 0 }}>
                    店铺 ID：<strong>{searchShopResult.shopId}</strong>
                    {searchShopResult.shopName !== searchShopResult.shopId && (
                      <> · 店铺名称：<strong>{searchShopResult.shopName}</strong></>
                    )}
                  </p>
                  <button
                    type="button"
                    className="admin-system-list-remove"
                    onClick={() => setSearchShopResult(null)}
                  >
                    退出搜索结果
                  </button>
                </div>
                <p className="admin-system-hint" style={{ marginBottom: 8 }}>该店铺已上架商品（点击「添加为推荐」可加入首页推荐）：</p>
                <ul className="admin-system-list admin-system-product-list">
                  {searchShopResult.products.length === 0 ? (
                    <li className="admin-system-list-item">暂无上架商品</li>
                  ) : (
                        searchShopResult.products.map((p) => (
                      <li key={p.listingId} className="admin-system-list-item admin-system-list-item--product">
                        <span className="admin-system-product-title">{p.title}</span>
                        <span className="admin-system-product-meta">¥{p.price}</span>
                        <button
                          type="button"
                          className="admin-system-list-add"
                          onClick={() => addFeaturedProduct(searchShopResult.shopId, p.listingId)}
                          disabled={homeFeatSaving === 'featured-product' || featuredProducts.length >= FEATURED_PRODUCTS_MAX}
                        >
                          {homeFeatSaving === 'featured-product' ? '添加中…' : '添加为推荐'}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            <h4 className="admin-system-subtitle">当前正在推荐的产品（最多 {FEATURED_PRODUCTS_MAX} 个）</h4>
            {featuredProducts.length >= FEATURED_PRODUCTS_MAX && (
              <p className="admin-system-hint">已达上限，请先删除再添加。</p>
            )}
            <div className="admin-featured-cards">
              {featuredProducts.map((row) => (
                <div key={row.id} className="admin-featured-card admin-featured-card--product">
                  <div className="admin-featured-card-image-wrap">
                    {resolveImageSrc(row.image) ? (
                      <img src={resolveImageSrc(row.image)} alt="" className="admin-featured-card-image" />
                    ) : (
                      <div className="admin-featured-card-image-placeholder">暂无图片</div>
                    )}
                  </div>
                  <div className="admin-featured-card-body">
                    <div className="admin-featured-card-title">{row.productTitle}</div>
                    <div className="admin-featured-card-meta">{row.shopName}</div>
                    <div className="admin-featured-card-shop-id">店铺 ID：{row.shopId}</div>
                    {row.price != null && <div className="admin-featured-card-price">¥{row.price}</div>}
                  </div>
                  <button
                    type="button"
                    className="admin-featured-card-delete"
                    onClick={() => removeFeaturedProduct(row.id)}
                    disabled={homeFeatSaving !== null}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            {featuredProducts.length === 0 && <p className="admin-system-hint">暂无推荐产品</p>}
          </>
        )}
      </section>

      <section className="admin-system-section admin-system-single-box">
        <h3 className="admin-system-section-title">推荐店铺</h3>
        <p className="admin-system-hint">按店铺 ID 搜索，可将该店铺添加为首页推荐店铺。最多 {FEATURED_SHOPS_MAX} 个。</p>
        {homeFeatLoading ? (
          <p className="admin-system-hint">加载中…</p>
        ) : (
          <>
            <div className="admin-system-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', marginBottom: 16 }}>
              <div className="admin-system-field" style={{ minWidth: 200 }}>
                <label className="admin-system-label">搜索店铺 ID</label>
                <input
                  type="text"
                  className="admin-system-input"
                  value={searchFeaturedShopInput}
                  onChange={(e) => setSearchFeaturedShopInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchFeaturedShopById()}
                  placeholder="输入店铺 ID 后点击搜索"
                />
              </div>
              <button
                type="button"
                className="admin-system-save-btn"
                onClick={searchFeaturedShopById}
                disabled={searchFeaturedShopLoading || !searchFeaturedShopInput.trim()}
              >
                {searchFeaturedShopLoading ? '搜索中…' : '搜索'}
              </button>
            </div>

            {searchFeaturedShopResult && (
              <div className="admin-system-search-result" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <p className="admin-system-hint" style={{ margin: 0 }}>
                    店铺 ID：<strong>{searchFeaturedShopResult.shopId}</strong>
                    {searchFeaturedShopResult.shopName !== searchFeaturedShopResult.shopId && (
                      <> · 店铺名称：<strong>{searchFeaturedShopResult.shopName}</strong></>
                    )}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="admin-system-list-add"
                      onClick={() => addFeaturedShop(searchFeaturedShopResult.shopId)}
                      disabled={homeFeatSaving === 'featured-shop' || featuredShops.length >= FEATURED_SHOPS_MAX}
                    >
                      {homeFeatSaving === 'featured-shop' ? '添加中…' : '添加为推荐店铺'}
                    </button>
                    <button type="button" className="admin-system-list-remove" onClick={() => setSearchFeaturedShopResult(null)}>
                      退出搜索结果
                    </button>
                  </div>
                </div>
              </div>
            )}

            {featuredShops.length >= FEATURED_SHOPS_MAX && (
              <p className="admin-system-hint">已达上限，请先删除再添加。</p>
            )}
            <h4 className="admin-system-subtitle">当前正在推荐的店铺（最多 {FEATURED_SHOPS_MAX} 个）</h4>
            <div className="admin-featured-cards admin-featured-cards--shops">
              {featuredShops.map((row) => (
                <div key={row.id} className="admin-featured-card admin-featured-card--shop">
                  <div className="admin-featured-shop-avatar">
                    {resolveImageSrc(row.logo ?? '') ? (
                      <img src={resolveImageSrc(row.logo ?? '')} alt="" className="admin-featured-shop-avatar-img" />
                    ) : (
                      row.shopName.charAt(0)
                    )}
                  </div>
                  <div className="admin-featured-card-body">
                    <div className="admin-featured-card-title admin-featured-card-title--full">{row.shopName}</div>
                    <div className="admin-featured-card-shop-id admin-featured-card-shop-id--full">ID：{row.shopId}</div>
                  </div>
                  <button
                    type="button"
                    className="admin-featured-card-delete"
                    onClick={() => removeFeaturedShop(row.id)}
                    disabled={homeFeatSaving !== null}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            {featuredShops.length === 0 && <p className="admin-system-hint">暂无推荐店铺</p>}
          </>
        )}
      </section>

      <section className="admin-system-section admin-system-single-box">
        <h3 className="admin-system-section-title">热销推荐</h3>
        <p className="admin-system-hint">按店铺 ID 搜索，展示该店铺所有已上架商品，可将商品添加为首页热销推荐。最多 {HOT_PRODUCTS_MAX} 个。</p>
        {homeFeatLoading ? (
          <p className="admin-system-hint">加载中…</p>
        ) : (
          <>
            <div className="admin-system-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', marginBottom: 16 }}>
              <div className="admin-system-field" style={{ minWidth: 200 }}>
                <label className="admin-system-label">搜索店铺 ID</label>
                <input
                  type="text"
                  className="admin-system-input"
                  value={searchHotShopIdInput}
                  onChange={(e) => setSearchHotShopIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchHotShopById()}
                  placeholder="输入店铺 ID 后点击搜索"
                />
              </div>
              <button
                type="button"
                className="admin-system-save-btn"
                onClick={searchHotShopById}
                disabled={searchHotShopLoading || !searchHotShopIdInput.trim()}
              >
                {searchHotShopLoading ? '搜索中…' : '搜索'}
              </button>
            </div>

            {searchHotShopResult && (
              <div className="admin-system-search-result" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <p className="admin-system-hint" style={{ margin: 0 }}>
                    店铺 ID：<strong>{searchHotShopResult.shopId}</strong>
                    {searchHotShopResult.shopName !== searchHotShopResult.shopId && (
                      <> · 店铺名称：<strong>{searchHotShopResult.shopName}</strong></>
                    )}
                  </p>
                  <button type="button" className="admin-system-list-remove" onClick={() => setSearchHotShopResult(null)}>
                    退出搜索结果
                  </button>
                </div>
                <p className="admin-system-hint" style={{ marginBottom: 8 }}>该店铺已上架商品（点击「添加为热销推荐」可加入首页热销推荐）：</p>
                <ul className="admin-system-list admin-system-product-list">
                  {searchHotShopResult.products.length === 0 ? (
                    <li className="admin-system-list-item">暂无上架商品</li>
                  ) : (
                    searchHotShopResult.products.map((p) => (
                      <li key={p.listingId} className="admin-system-list-item admin-system-list-item--product">
                        <span className="admin-system-product-title">{p.title}</span>
                        <span className="admin-system-product-meta">¥{p.price}</span>
                        <button
                          type="button"
                          className="admin-system-list-add"
                          onClick={() => addHotProduct(searchHotShopResult.shopId, p.listingId)}
                          disabled={homeFeatSaving === 'hot-product' || hotProducts.length >= HOT_PRODUCTS_MAX}
                        >
                          {homeFeatSaving === 'hot-product' ? '添加中…' : '添加为热销推荐'}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {hotProducts.length >= HOT_PRODUCTS_MAX && (
              <p className="admin-system-hint">已达上限，请先删除再添加。</p>
            )}
            <h4 className="admin-system-subtitle">当前正在推荐的热销商品（最多 {HOT_PRODUCTS_MAX} 个）</h4>
            <div className="admin-featured-cards">
              {hotProducts.map((row) => (
                <div key={row.id} className="admin-featured-card admin-featured-card--product">
                  <div className="admin-featured-card-image-wrap">
                    {resolveImageSrc(row.image) ? (
                      <img src={resolveImageSrc(row.image)} alt="" className="admin-featured-card-image" />
                    ) : (
                      <div className="admin-featured-card-image-placeholder">暂无图片</div>
                    )}
                  </div>
                  <div className="admin-featured-card-body">
                    <div className="admin-featured-card-title">{row.productTitle}</div>
                    <div className="admin-featured-card-meta">{row.shopName}</div>
                    <div className="admin-featured-card-shop-id">店铺 ID：{row.shopId}</div>
                    {row.price != null && <div className="admin-featured-card-price">¥{row.price}</div>}
                  </div>
                  <button
                    type="button"
                    className="admin-featured-card-delete"
                    onClick={() => removeHotProduct(row.id)}
                    disabled={homeFeatSaving !== null}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            {hotProducts.length === 0 && <p className="admin-system-hint">暂无热销推荐</p>}
          </>
        )}
      </section>

      {/* 裁剪弹窗 */}
      {cropOpen && cropImageUrl && (
        <div
          className="admin-system-crop-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-crop-title"
        >
          <div className="admin-system-crop-modal">
            <h2 id="admin-crop-title" className="admin-system-crop-title">裁剪二维码</h2>
            <p className="admin-system-crop-desc">缩放可放大图片，拖动裁剪框对准要裁的正方形区域</p>
            <div className="admin-system-crop-view">
              <div className="admin-system-crop-stage" style={{ width: CROP_VIEW_SIZE, height: CROP_VIEW_SIZE }}>
                <img
                  ref={cropImageRef}
                  src={cropImageUrl}
                  alt=""
                  className="admin-system-crop-image"
                  style={
                    cropImageSize.w > 0 && cropImageSize.h > 0
                      ? {
                          width: cropImageSize.w * cropBaseScale,
                          height: cropImageSize.h * cropBaseScale,
                          left: CROP_VIEW_SIZE / 2 - (cropImageSize.w * cropBaseScale) / 2,
                          top: CROP_VIEW_SIZE / 2 - (cropImageSize.h * cropBaseScale) / 2,
                          transform: `scale(${cropZoom})`,
                          transformOrigin: 'center center',
                        }
                      : {}
                  }
                  onLoad={onCropImageLoad}
                  draggable={false}
                />
                <div
                  className="admin-system-crop-frame admin-system-crop-frame--draggable"
                  style={{
                    width: CROP_SIZE,
                    height: CROP_SIZE,
                    left: framePos.x,
                    top: framePos.y,
                  }}
                  onMouseDown={handleFrameMouseDown}
                  role="button"
                  tabIndex={0}
                  aria-label="拖动裁剪框"
                />
              </div>
            </div>
            <div className="admin-system-crop-zoom">
              <label className="admin-system-crop-zoom-label">缩放（以图片中心放大）</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="admin-system-crop-zoom-range"
              />
            </div>
            <div className="admin-system-crop-actions">
              <button type="button" className="admin-system-crop-btn admin-system-crop-btn--cancel" onClick={handleCropCancel}>
                取消
              </button>
              <button
                type="button"
                className="admin-system-crop-btn admin-system-crop-btn--ok"
                onClick={handleCropConfirm}
                disabled={!cropImageReady}
              >
                {cropImageReady ? '确认并上传' : '加载中…'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSystem
