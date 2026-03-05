import React, { useState, useMemo, useEffect } from 'react'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import { getCategoryNameZh } from '../constants/categoryNameZh'
import { useLang } from '../context/LangContext'

interface WarehouseItem {
  /** 店铺上架记录唯一 ID（listingId） */
  id: string
  listingId: string
  /** 供货商品编号（products.product_id） */
  productId: string
  productCode: string
  productName: string
  stock: number
  price: number
  supplyPrice: number
  /** 'on' 供货中 / 'off' 已下架 */
  status: 'on' | 'off'
  image?: string
  /** 多图列表，用于卡片主图轮播（优先使用） */
  images?: string[]
  /** 是否主推（展示优先） */
  recommended?: boolean
}

function profitRatio(price: number, supplyPrice: number): string {
  if (supplyPrice <= 0) return '—'
  const pct = ((price - supplyPrice) / supplyPrice) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

interface CatalogItem {
  id: string
  name: string
  supplyPrice: number
  suggestedPrice: number
  category: string
  /** 多图列表，用于详情轮播 */
  images: string[]
  /** 商品描述 */
  description: string
  /** 款式，如颜色、尺寸等 */
  styles: string[]
  /** 后端商品详情是否已加载 */
  loaded?: boolean
  status?: 'on' | 'off'
}

interface CategoryItem {
  id: string
  parent_id: string | null
  level: number
  name: string
}

const PAGE_SIZE = 12

function getAuthShopId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    const shopId = (JSON.parse(raw) as { shopId?: string | null })?.shopId
    if (typeof shopId !== 'string') return null
    const trimmed = shopId.trim()
    return trimmed ? trimmed : null
  } catch {
    return null
  }
}

function getAuthUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    return (JSON.parse(raw) as { id?: string })?.id ?? null
  } catch {
    return null
  }
}

interface ApiShopProduct {
  listingId: string
  productId: string
  status: 'on' | 'off'
  listedAt: string | null
  title: string
  image: string
  images?: string[]
  price: number
  supplyPrice: number | null
  category: string | null
  subCategory: string | null
  recommended?: boolean
}

const MerchantWarehouse: React.FC = () => {
  const { showToast } = useToast()
  const { lang } = useLang()
  const [tab, setTab] = useState<'mine' | 'procure'>('mine')
  const [myProducts, setMyProducts] = useState<WarehouseItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'on' | 'off'>('all')
  const [procureSearchInput, setProcureSearchInput] = useState('')
  const [procureSearch, setProcureSearch] = useState('')
  const [procureCategoryId, setProcureCategoryId] = useState<string>('') // 只按大分类筛选，空为全部
  const [minePage, setMinePage] = useState(1)
  const [procurePage, setProcurePage] = useState(1)
  /** 采购详情弹层：当前选中的商品，null 表示关闭 */
  const [procureDetailItem, setProcureDetailItem] = useState<CatalogItem | null>(null)
  /** 我的商品详情弹层 */
  const [mineDetailItem, setMineDetailItem] = useState<WarehouseItem | null>(null)
  /** 我的商品详情补充数据（主图、描述，从供货详情 API 拉取） */
  const [mineDetailEnriched, setMineDetailEnriched] = useState<{ images: string[]; description: string } | null>(null)
  /** 我的商品详情内多图轮播当前下标 */
  const [mineDetailImageIndex, setMineDetailImageIndex] = useState(0)
  /** 详情内多图轮播当前下标（采购） */
  const [detailImageIndex, setDetailImageIndex] = useState(0)
  /** 定价弹层：当前要改价的商品，null 表示关闭（已不再使用，定价交由系统自动完成） */
  const [_pricingItem, _setPricingItem] = useState<WarehouseItem | null>(null)
  /** 定价弹层内输入的新售价（字符串，用于受控输入，已废弃） */
  const [_pricingInput, _setPricingInput] = useState('')
  /** 采购定价并上架弹层：当前要采购的商品，null 表示关闭（已废弃，采购时系统自动定价） */
  const [_procurePricingItem, setProcurePricingItem] = useState<CatalogItem | null>(null)
  /** 采购定价弹层内输入的售价（已废弃） */
  const [_procurePricingInput, setProcurePricingInput] = useState('')
  /** 供货商品列表（来自后端） */
  const [procureList, setProcureList] = useState<CatalogItem[]>([])
  const [procureTotal, setProcureTotal] = useState(0)
  const [procureLoading, setProcureLoading] = useState(false)
  const [procureCategories, setProcureCategories] = useState<Array<{ id: string; label: string }>>([])
  const [procureCategoriesLoaded, setProcureCategoriesLoaded] = useState(false)
  const [procureCategoriesExpanded, setProcureCategoriesExpanded] = useState(false)
  /** 采购列表每个商品的当前轮播图下标 */
  const [catalogImageIndex, setCatalogImageIndex] = useState<Record<string, number>>({})
  /** 我的商品卡片主图轮播下标 */
  const [mineImageIndex, setMineImageIndex] = useState<Record<string, number>>({})
  /** 删除确认弹窗：当前要永久删除的商品，null 表示关闭 */
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<WarehouseItem | null>(null)

  const shopId = useMemo(() => getAuthShopId(), [])

  const loadMineProducts = () => {
    if (!shopId) {
      setMyProducts([])
      showToast(
        lang === 'zh'
          ? '未登录商家或未绑定店铺，无法加载店铺商品'
          : 'Not logged in or shop not bound, cannot load shop products',
        'error',
      )
      return
    }
    api
      .get<{ list: ApiShopProduct[] }>(`/api/shop-products/by-shop/${shopId}`)
      .then((res) => {
        const list = Array.isArray(res.list) ? res.list : []
        const mapped: WarehouseItem[] = list.map((row) => ({
          id: String(row.listingId),
          listingId: String(row.listingId),
          productId: String(row.productId),
          productCode: String(row.productId),
          productName: row.title,
          stock: 0,
          price: row.price,
          supplyPrice: row.supplyPrice ?? 0,
          status: row.status === 'off' ? 'off' : 'on',
          image: row.image || undefined,
          images: row.images && row.images.length > 0 ? row.images : undefined,
          recommended: Boolean(row.recommended),
        }))
        setMyProducts(mapped)
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              `merchantWarehouse:mine:${shopId}`,
              JSON.stringify(mapped),
            )
          }
        } catch {
          // ignore cache write error
        }
      })
      .catch(() => {
        setMyProducts([])
      })
  }

  const filtered = useMemo(() => {
    let list = myProducts
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.productCode.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q)
      )
    }
    return list
  }, [myProducts, search, statusFilter])

  const totalMinePages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedMine = useMemo(
    () => filtered.slice((minePage - 1) * PAGE_SIZE, minePage * PAGE_SIZE),
    [filtered, minePage]
  )

  const totalProcurePages = Math.max(1, Math.ceil(procureTotal / PAGE_SIZE))

  React.useEffect(() => {
    setMinePage(1)
  }, [search, statusFilter])

  React.useEffect(() => {
    setProcurePage(1)
  }, [procureSearch, procureCategoryId])

  // 初次与切换到「我的商品」时：先尝试使用缓存，随后再从后端静默刷新
  useEffect(() => {
    if (tab !== 'mine') return
    if (shopId) {
      try {
        const raw =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(`merchantWarehouse:mine:${shopId}`)
            : null
        if (raw) {
          const cached = JSON.parse(raw) as WarehouseItem[]
          if (Array.isArray(cached)) {
            setMyProducts(cached)
          }
        }
      } catch {
        // ignore cache error
      }
    }
    loadMineProducts()
  }, [tab, shopId])

  // 「我的商品」：切回页面时刷新 + 短间隔轮询，保证数据实时
  useEffect(() => {
    if (tab !== 'mine' || !shopId) return
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') loadMineProducts()
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
    const timer = window.setInterval(loadMineProducts, 5000)
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [tab, shopId])

  // 记住最近一次采购筛选（分类 + 搜索），避免来回切页重选
  React.useEffect(() => {
    try {
      const payload = {
        procureCategoryId,
        procureSearch,
        procureSearchInput,
      }
      window.localStorage.setItem(
        'merchantProcureFilter',
        JSON.stringify(payload),
      )
    } catch {
      // ignore
    }
  }, [procureCategoryId, procureSearch, procureSearchInput])

  React.useEffect(() => {
    // 初次加载时尝试恢复上一次的筛选条件
    try {
      const raw = window.localStorage.getItem('merchantProcureFilter')
      if (!raw) return
      const data = JSON.parse(raw) as {
        procureCategoryId?: string
        procureSearch?: string
        procureSearchInput?: string
      }
      if (data.procureCategoryId != null) {
        setProcureCategoryId(data.procureCategoryId)
      }
      if (data.procureSearch != null) {
        setProcureSearch(data.procureSearch)
      }
      if (data.procureSearchInput != null) {
        setProcureSearchInput(data.procureSearchInput)
      }
    } catch {
      // ignore
    }
  }, [])

  // 加载大分类（一级分类）供筛选使用
  React.useEffect(() => {
    if (procureCategoriesLoaded) return
    let cancelled = false
    const loadCategories = async () => {
      try {
        const res = await api.get<{ list: CategoryItem[] }>('/api/categories')
        if (cancelled) return
        const list = Array.isArray(res.list) ? res.list : []
        const top = list.filter((c) => !c.parent_id || c.level === 1)
        const mapped = top.map((c) => ({
          id: c.id,
          label:
            lang === 'zh'
              ? getCategoryNameZh(c.name) || c.name || ''
              : c.name || '',
        }))
        const nonEmpty = mapped.filter((c) => c.label.trim() !== '')
        const empty = mapped.filter((c) => c.label.trim() === '')
        const finalList = [
          { id: '', label: lang === 'zh' ? '全部' : 'All' },
          ...nonEmpty,
          ...empty.map((c) => ({
            ...c,
            label: c.id || (lang === 'zh' ? '未命名分类' : 'Untitled category'),
          })),
        ]
        setProcureCategories(finalList)
      } catch {
        if (!cancelled) {
          setProcureCategories([{ id: '', label: lang === 'zh' ? '全部' : 'All' }])
        }
      } finally {
        if (!cancelled) setProcureCategoriesLoaded(true)
      }
    }
    loadCategories()
    return () => {
      cancelled = true
    }
  }, [procureCategoriesLoaded, lang])

  // 语言切换时重新加载分类，保证标签语言同步
  React.useEffect(() => {
    setProcureCategoriesLoaded(false)
  }, [lang])

  // 加载供货商品（来自后端），并做静默轮询，确保上下架状态实时同步
  React.useEffect(() => {
    if (tab !== 'procure') return
    let cancelled = false

    const fetchSupply = async (silent = false) => {
      if (!silent) setProcureLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(PAGE_SIZE))
        params.set('offset', String((procurePage - 1) * PAGE_SIZE))
        if (procureCategoryId) params.set('categoryId', procureCategoryId)
        if (procureSearch.trim()) params.set('search', procureSearch.trim())
        const res = await api.get<{
          list: Array<{
            id: string
            title: string
            image: string
            images?: string[]
            purchasePrice: number | null
            price: number
            category: string
            subCategory: string
            status?: 'on' | 'off'
          }>
          total: number
        }>(`/api/products/supply?${params.toString()}`)
        if (cancelled) return
        const list = Array.isArray(res.list) ? res.list : []
        const mapped: CatalogItem[] = list.map((row) => {
          const imgs = Array.isArray(row.images)
            ? row.images.filter((src) => typeof src === 'string' && src)
            : row.image
            ? [row.image]
            : []
          return {
            id: row.id,
            name: row.title,
            supplyPrice: row.purchasePrice ?? 0,
            suggestedPrice: row.price,
            category:
              lang === 'zh'
                ? getCategoryNameZh(row.category) || row.category || ''
                : row.category || '',
            images: imgs,
            description: '',
            styles: [],
            status: row.status === 'off' ? 'off' : 'on',
          }
        })
        setProcureList(mapped)
        setProcureTotal(Number(res.total) || mapped.length)
      } catch {
        if (!cancelled) {
          setProcureList([])
          setProcureTotal(0)
        }
      } finally {
        if (!cancelled && !silent) setProcureLoading(false)
      }
    }

    // 首次进入或筛选变化时请求一次
    fetchSupply(false)
    // 切回页面时立即刷新
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchSupply(true)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
    // 后台静默轮询，实时感知管理员上下架
    const timer = window.setInterval(() => fetchSupply(true), 5000)

    return () => {
      cancelled = true
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [tab, procurePage, procureCategoryId, procureSearch, lang])

  const getCatalogImageIndex = (item: CatalogItem) => {
    const total = item.images.length
    if (total <= 1) return 0
    const idx = catalogImageIndex[item.id] ?? 0
    if (idx < 0 || idx >= total) return 0
    return idx
  }

  const getMineImageIndex = (item: WarehouseItem) => {
    const total = item.images?.length ?? 0
    if (total <= 1) return 0
    const idx = mineImageIndex[item.id] ?? 0
    if (idx < 0 || idx >= total) return 0
    return idx
  }

  // 采购卡片主图自动轮播
  useEffect(() => {
    if (tab !== 'procure') return
    if (!procureList.some((item) => item.images.length > 1)) return
    const timer = window.setInterval(() => {
      setCatalogImageIndex((prev) => {
        const next: Record<string, number> = { ...prev }
        procureList.forEach((item) => {
          const total = item.images.length
          if (total > 1) {
            const current = prev[item.id] ?? 0
            next[item.id] = (current + 1) % total
          }
        })
        return next
      })
    }, 3000)
    return () => {
      window.clearInterval(timer)
    }
  }, [tab, procureList])

  // 我的商品卡片主图自动轮播（不改变卡片样式，只轮换主图）
  useEffect(() => {
    if (tab !== 'mine') return
    if (!myProducts.some((item) => item.images && item.images.length > 1)) return
    const timer = window.setInterval(() => {
      setMineImageIndex((prev) => {
        const next: Record<string, number> = { ...prev }
        myProducts.forEach((item) => {
          const total = item.images?.length ?? 0
          if (total > 1) {
            const current = prev[item.id] ?? 0
            next[item.id] = (current + 1) % total
          }
        })
        return next
      })
    }, 3000)
    return () => {
      window.clearInterval(timer)
    }
  }, [tab, myProducts])

  const toggleStatus = (id: string) => {
    const target = myProducts.find((p) => p.id === id)
    if (!target) return
    if (!target.productId) {
      showToast(lang === 'zh' ? '商品数据异常' : 'Product data error', 'error')
      return
    }
    if (!shopId) {
      showToast(
        lang === 'zh' ? '未登录商家或未绑定店铺' : 'Not logged in or shop not bound',
        'error',
      )
      return
    }
    if (target.status === 'on') {
      api
        .delete(`/api/shop-products/${shopId}/${target.productId}`)
        .then(() => {
          showToast(lang === 'zh' ? '已下架' : 'Unlisted from shop')
          loadMineProducts()
        })
        .catch(() => {
          showToast(lang === 'zh' ? '下架失败' : 'Failed to unlist', 'error')
        })
    } else {
      api
        .post('/api/shop-products', {
          shopId,
          productId: target.productId,
          price: target.price,
        })
        .then(() => {
          showToast(lang === 'zh' ? '已上架' : 'Listed to shop')
          loadMineProducts()
        })
        .catch(() => {
          showToast(lang === 'zh' ? '上架失败' : 'Failed to list', 'error')
        })
    }
  }

  /** 永久删除店铺内该商品（从店铺商品表删除，不再显示） */
  const handleDeleteFromShop = () => {
    if (!deleteConfirmItem || !shopId) return
    const { productId } = deleteConfirmItem
    api
      .delete(`/api/shop-products/${shopId}/${encodeURIComponent(productId)}?permanent=1`)
      .then(() => {
        showToast(lang === 'zh' ? '已删除' : 'Deleted from shop')
        setDeleteConfirmItem(null)
        loadMineProducts()
      })
      .catch(() => {
        showToast(lang === 'zh' ? '删除失败' : 'Failed to delete', 'error')
      })
  }

  const toggleRecommended = (item: WarehouseItem) => {
    if (!shopId) {
      showToast(
        lang === 'zh' ? '未登录商家或未绑定店铺' : 'Not logged in or shop not bound',
        'error',
      )
      return
    }
    const userId = getAuthUserId()
    if (!userId) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    if (item.recommended) {
      api
        .delete(`/api/shops/${shopId}/recommendations/${encodeURIComponent(item.id)}?userId=${encodeURIComponent(userId)}`)
        .then(() => {
          setMyProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, recommended: false } : p))
          )
          showToast(lang === 'zh' ? '已取消主推' : 'Removed from featured',)
        })
        .catch(() => showToast(lang === 'zh' ? '取消失败' : 'Failed to remove featured', 'error'))
    } else {
      api
        .post(`/api/shops/${shopId}/recommendations`, { userId, listingId: item.id })
        .then(() => {
          setMyProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, recommended: true } : p))
          )
          showToast(lang === 'zh' ? '已设为主推' : 'Set as featured')
        })
        .catch(() => showToast(lang === 'zh' ? '设置失败' : 'Failed to set featured', 'error'))
    }
  }

  /** 将采购商品加入「我的商品」并上架（售价由系统按店铺等级自动计算） */
  const addProcureAndList = (item: CatalogItem) => {
    if (!shopId) {
      showToast(
        lang === 'zh' ? '未登录商家或未绑定店铺' : 'Not logged in or shop not bound',
        'error',
      )
      return
    }
    api
      .post('/api/shop-products', {
        shopId,
        productId: item.id,
      })
      .then(() => {
        showToast(
          lang === 'zh' ? '已采购并上架到店铺' : 'Purchased and listed to your shop',
        )
        setProcureDetailItem(null)
        setProcurePricingItem(null)
        setProcurePricingInput('')
        setTab('mine')
        loadMineProducts()
      })
      .catch(() => {
        showToast(
          lang === 'zh' ? '采购上架失败' : 'Failed to purchase and list',
          'error',
        )
      })
  }

  const openProcurePricingModal = (item: CatalogItem) => {
    // 直接按系统规则定价并上架，不再弹出手动定价弹窗
    addProcureAndList(item)
  }

  /** 打开「我的商品」详情：拉取商品主图与描述，与采购详情一致展示 */
  const openMineDetail = (item: WarehouseItem) => {
    setMineDetailItem(item)
    setMineDetailImageIndex(0)
    setMineDetailEnriched(null)
    api
      .get<{ images?: string[]; image?: string; descriptionHtml?: string; detailHtml?: string }>(
        `/api/products/supply/${encodeURIComponent(item.productId)}`
      )
      .then((res) => {
        const imgs: string[] = Array.isArray(res.images)
          ? res.images.filter((src: unknown) => typeof src === 'string' && src)
          : res.image
            ? [res.image]
            : item.images?.length
              ? item.images
              : item.image
                ? [item.image]
                : []
        const desc =
          (typeof res.descriptionHtml === 'string' && res.descriptionHtml.trim()) ||
          (typeof res.detailHtml === 'string' && res.detailHtml.trim()) ||
          ''
        setMineDetailEnriched({ images: imgs, description: desc })
      })
      .catch(() => {
        const fallback = item.images?.length ? item.images : item.image ? [item.image] : []
        setMineDetailEnriched({ images: fallback, description: '' })
      })
  }

  const openProcureDetail = (item: CatalogItem) => {
    // 如果还没有加载过详情，从后端补充主图与描述
    if (!item.loaded) {
      api
        .get<{
          id: string
          title: string
          images?: string[]
          image?: string
          purchasePrice?: number | null
          price?: number | null
          descriptionHtml?: string
          detailHtml?: string
        }>(`/api/products/supply/${encodeURIComponent(item.id)}`)
        .then((res) => {
          const images: string[] = []
          if (Array.isArray(res.images)) {
            images.push(...res.images.filter((src) => typeof src === 'string' && src))
          } else if (res.image) {
            images.push(res.image)
          }
          const desc =
            (res.descriptionHtml && res.descriptionHtml.trim()) ||
            (res.detailHtml && res.detailHtml.trim()) ||
            ''
          setProcureList((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    images: images.length > 0 ? images : p.images,
                    description: desc || p.description,
                    loaded: true,
                  }
                : p
            )
          )
          const merged: CatalogItem = {
            ...item,
            images: images.length > 0 ? images : item.images,
            description: desc || item.description,
            loaded: true,
          }
          setProcureDetailItem(merged)
          setDetailImageIndex(0)
        })
        .catch(() => {
          setProcureDetailItem(item)
          setDetailImageIndex(0)
        })
    } else {
      setProcureDetailItem(item)
      setDetailImageIndex(0)
    }
  }

  const detailImages = procureDetailItem?.images ?? []
  const detailTotalImages = detailImages.length
  const canPrevImage = detailTotalImages > 1 && detailImageIndex > 0
  const canNextImage = detailTotalImages > 1 && detailImageIndex < detailTotalImages - 1

  return (
    <div className="merchant-warehouse-page">
      <div className="merchant-warehouse-header">
        <h1 className="merchant-warehouse-title">
          {lang === 'zh' ? '商品仓库' : 'Product warehouse'}
        </h1>
        <div className="merchant-warehouse-header-actions">
          <button
            type="button"
            className={`merchant-warehouse-tab-btn${
              tab === 'mine' ? ' merchant-warehouse-tab-btn--active' : ''
            }`}
            onClick={() => setTab('mine')}
          >
            {lang === 'zh' ? '我的商品' : 'My products'}
          </button>
          <button
            type="button"
            className={`merchant-warehouse-tab-btn${
              tab === 'procure' ? ' merchant-warehouse-tab-btn--active' : ''
            }`}
            onClick={() => setTab('procure')}
          >
            {lang === 'zh' ? '采购上架' : 'Procure & list'}
          </button>
        </div>
      </div>

      {tab === 'mine' && (
        <>
          <div className="merchant-warehouse-toolbar">
            <div className="merchant-warehouse-search-wrap">
              <span className="merchant-warehouse-search-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input
                type="text"
                className="merchant-warehouse-search"
                placeholder={
                  lang === 'zh' ? '搜索商品编号 / 商品名称' : 'Search by product code / name'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="merchant-warehouse-filters">
              <button
                type="button"
                className={`merchant-warehouse-filter-btn${
                  statusFilter === 'all' ? ' merchant-warehouse-filter-btn--active' : ''
                }`}
                onClick={() => setStatusFilter('all')}
              >
                {lang === 'zh' ? '全部' : 'All'}
              </button>
              <button
                type="button"
                className={`merchant-warehouse-filter-btn${
                  statusFilter === 'on' ? ' merchant-warehouse-filter-btn--active' : ''
                }`}
                onClick={() => setStatusFilter('on')}
              >
                {lang === 'zh' ? '在售' : 'On sale'}
              </button>
              <button
                type="button"
                className={`merchant-warehouse-filter-btn${
                  statusFilter === 'off' ? ' merchant-warehouse-filter-btn--active' : ''
                }`}
                onClick={() => setStatusFilter('off')}
              >
                {lang === 'zh' ? '已下架' : 'Unlisted'}
              </button>
            </div>
          </div>

          <div className="merchant-warehouse-mine-wrap">
            {filtered.length === 0 ? (
              myProducts.length === 0 ? (
                <div className="merchant-warehouse-empty merchant-warehouse-empty--mine">
                  <div className="merchant-warehouse-empty-icon" aria-hidden>
                    <svg viewBox="0 0 64 64" width="72" height="72">
                      <defs>
                        <linearGradient id="warehouseEmptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e0f2fe" />
                          <stop offset="100%" stopColor="#e5e7eb" />
                        </linearGradient>
                      </defs>
                      <rect x="8" y="20" width="48" height="32" rx="8" fill="url(#warehouseEmptyGradient)" />
                      <rect x="14" y="26" width="12" height="8" rx="2" fill="#bfdbfe" />
                      <rect x="26" y="26" width="12" height="8" rx="2" fill="#bfdbfe" />
                      <rect x="38" y="26" width="12" height="8" rx="2" fill="#bfdbfe" />
                      <rect x="18" y="38" width="12" height="4" rx="2" fill="#93c5fd" />
                      <rect x="34" y="38" width="12" height="4" rx="2" fill="#93c5fd" />
                    </svg>
                  </div>
                  <div className="merchant-warehouse-empty-title">
                    {lang === 'zh'
                      ? '你的店铺还没有任何商品'
                      : 'Your shop does not have any products yet'}
                  </div>
                  <div className="merchant-warehouse-empty-desc">
                    {lang === 'zh'
                      ? '请前往「采购上架」选择商品加入店铺，开始赚取利润'
                      : 'Go to "Procure & list" to add products and start earning profit.'}
                  </div>
                  <button
                    type="button"
                    className="merchant-warehouse-empty-cta"
                    onClick={() => setTab('procure')}
                  >
                    {lang === 'zh' ? '去采购上架' : 'Go to procure & list'}
                  </button>
                </div>
              ) : (
                <div className="merchant-warehouse-empty">
                  {lang === 'zh'
                    ? '没有符合当前筛选条件的商品'
                    : 'No products match the current filters'}
                </div>
              )
            ) : (
              <>
                <ul className="merchant-warehouse-cards">
                  {paginatedMine.map((item) => (
                    <li
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="merchant-warehouse-card"
                      onClick={() => openMineDetail(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMineDetail(item) } }}
                    >
                      <div className="merchant-warehouse-card-img-wrap">
                        {(() => {
                          const imgs =
                            item.images && item.images.length > 0
                              ? item.images
                              : item.image
                              ? [item.image]
                              : []
                          if (imgs.length === 0) {
                            return (
                              <div className="merchant-warehouse-card-img-placeholder">
                                {lang === 'zh' ? '商品图' : 'Product image'}
                              </div>
                            )
                          }
                          const idx = getMineImageIndex(item)
                          const src = imgs[idx] ?? imgs[0]
                          return <img src={src} alt="" className="merchant-warehouse-card-img" loading="lazy" />
                        })()}
                        <button
                          type="button"
                          className={`merchant-warehouse-card-recommend ${item.recommended ? 'merchant-warehouse-card-recommend--on' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleRecommended(item) }}
                          title={
                            item.recommended
                              ? lang === 'zh'
                                ? '取消主推'
                                : 'Remove from featured'
                              : lang === 'zh'
                                ? '设为主推'
                                : 'Set as featured'
                          }
                          aria-label={
                            item.recommended
                              ? lang === 'zh'
                                ? '取消主推'
                                : 'Remove from featured'
                              : lang === 'zh'
                                ? '设为主推'
                                : 'Set as featured'
                          }
                        >
                          <span className="merchant-warehouse-card-recommend-emoji" aria-hidden>👍</span>
                        </button>
                        <span
                          className={`merchant-warehouse-card-status merchant-warehouse-card-status--${item.status}`}
                        >
                          {item.status === 'off'
                            ? lang === 'zh'
                              ? '已下架'
                              : 'Unlisted'
                            : lang === 'zh'
                              ? '在售'
                              : 'On sale'}
                        </span>
                      </div>
                      <div className="merchant-warehouse-card-body">
                        <div className="merchant-warehouse-card-name">{item.productName}</div>
                        <div className="merchant-warehouse-card-pricing">
                          <span className="merchant-warehouse-card-price-row">
                            <span className="merchant-warehouse-card-price-label">
                              {lang === 'zh' ? '采购价' : 'Purchase price'}
                            </span>
                            <span className="merchant-warehouse-card-price-value">${item.supplyPrice.toFixed(2)}</span>
                          </span>
                          <span className="merchant-warehouse-card-price-row">
                            <span className="merchant-warehouse-card-price-label">
                              {lang === 'zh' ? '定价' : 'Selling price'}
                            </span>
                            <span className="merchant-warehouse-card-price-value merchant-warehouse-card-price-value--sell">${item.price.toFixed(2)}</span>
                          </span>
                          <span className="merchant-warehouse-card-price-row">
                            <span className="merchant-warehouse-card-price-label">
                              {lang === 'zh' ? '利润比' : 'Profit ratio'}
                            </span>
                            <span className={`merchant-warehouse-card-profit ${item.price >= item.supplyPrice ? 'merchant-warehouse-card-profit--up' : 'merchant-warehouse-card-profit--down'}`}>
                              {profitRatio(item.price, item.supplyPrice)}
                            </span>
                          </span>
                        </div>
                        <div className="merchant-warehouse-card-actions" onClick={(e) => e.stopPropagation()}>
                          {item.status === 'on' ? (
                            <button
                              type="button"
                              className="merchant-warehouse-action-btn"
                              onClick={(e) => { e.stopPropagation(); toggleStatus(item.id) }}
                            >
                              {lang === 'zh' ? '下架' : 'Unlist'}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="merchant-warehouse-action-btn"
                                onClick={(e) => { e.stopPropagation(); toggleStatus(item.id) }}
                              >
                                {lang === 'zh' ? '上架' : 'List'}
                              </button>
                              <button
                                type="button"
                                className="merchant-warehouse-action-btn merchant-warehouse-action-btn--danger"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmItem(item) }}
                              >
                                {lang === 'zh' ? '删除' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {totalMinePages > 1 && (
                  <div className="merchant-warehouse-pagination">
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={minePage <= 1}
                      onClick={() => setMinePage((p) => Math.max(1, p - 1))}
                    >
                      {lang === 'zh' ? '上一页' : 'Previous'}
                    </button>
                    <span className="merchant-warehouse-page-info">
                      {minePage} / {totalMinePages}
                    </span>
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={minePage >= totalMinePages}
                      onClick={() => setMinePage((p) => Math.min(totalMinePages, p + 1))}
                    >
                      {lang === 'zh' ? '下一页' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {tab === 'procure' && (
        <>
          <div className="merchant-warehouse-procure-toolbar">
            <div className="merchant-warehouse-procure-search-row">
              <div className="merchant-warehouse-search-wrap">
                <span className="merchant-warehouse-search-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input
                  type="text"
                  className="merchant-warehouse-search"
                  placeholder={
                    lang === 'zh'
                      ? '搜索商品名称 / 商品编号'
                      : 'Search by product name / code'
                  }
                  value={procureSearchInput}
                  onChange={(e) => setProcureSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setProcureSearch(procureSearchInput.trim())
                    }
                  }}
                />
                {procureSearch && (
                  <button
                    type="button"
                    className="merchant-warehouse-search-clear"
                    onClick={() => {
                      setProcureSearchInput('')
                      setProcureSearch('')
                    }}
                  >
                    {lang === 'zh' ? '清空' : 'Clear'}
                  </button>
                )}
                <button
                  type="button"
                  className="merchant-warehouse-search-btn"
                  onClick={() => setProcureSearch(procureSearchInput.trim())}
                  disabled={procureLoading}
                >
                  {lang === 'zh' ? '搜索' : 'Search'}
                </button>
              </div>
            </div>
            <div className="merchant-warehouse-procure-categories">
              <span className="merchant-warehouse-procure-categories-label">
                {lang === 'zh' ? '分类' : 'Category'}
              </span>
              <div className="merchant-warehouse-procure-categories-list">
                {(procureCategoriesExpanded
                  ? procureCategories
                  : procureCategories.slice(0, 8)
                ).map((cat) => (
                  <button
                    key={cat.id || 'all'}
                    type="button"
                    className={`merchant-warehouse-filter-btn merchant-warehouse-procure-cat-btn${procureCategoryId === cat.id ? ' merchant-warehouse-filter-btn--active' : ''}`}
                    onClick={() => setProcureCategoryId(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
                {procureCategories.length > 8 && (
                  <button
                    type="button"
                    className="merchant-warehouse-procure-toggle"
                    onClick={() => setProcureCategoriesExpanded((v) => !v)}
                  >
                    {procureCategoriesExpanded
                      ? lang === 'zh'
                        ? '收起'
                        : 'Collapse'
                      : lang === 'zh'
                        ? '展开更多'
                        : 'Show more'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="merchant-warehouse-catalog-wrap">
            {procureLoading && procureList.length === 0 ? (
              <div className="merchant-warehouse-catalog merchant-warehouse-catalog--skeleton">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="merchant-warehouse-catalog-card merchant-warehouse-catalog-card--skeleton">
                    <div className="merchant-warehouse-catalog-card-img merchant-warehouse-catalog-card-img--skeleton" />
                    <div className="merchant-warehouse-catalog-card-body">
                      <div className="merchant-warehouse-catalog-line merchant-warehouse-catalog-line--sm" />
                      <div className="merchant-warehouse-catalog-line" />
                      <div className="merchant-warehouse-catalog-line merchant-warehouse-catalog-line--lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : procureList.length === 0 ? (
              <div className="merchant-warehouse-empty">
                {procureSearch
                  ? lang === 'zh'
                    ? `当前分类下没有找到与「${procureSearch}」相关的商品`
                    : `No products found for "${procureSearch}" in this category`
                  : lang === 'zh'
                    ? '该分类下暂无采购商品'
                    : 'No purchasable products in this category'}
              </div>
            ) : (
              <>
                <div className="merchant-warehouse-catalog">
                  {procureList.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className={`merchant-warehouse-catalog-card${
                        item.status === 'off' ? ' merchant-warehouse-catalog-card--disabled' : ''
                      }`}
                      onClick={() => item.status !== 'off' && openProcureDetail(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProcureDetail(item) } }}
                    >
                      <div className="merchant-warehouse-catalog-card-img">
                        {item.images[0] ? (
                          <img
                            src={item.images[getCatalogImageIndex(item)]}
                            alt=""
                          />
                        ) : (
                          <div className="merchant-warehouse-catalog-card-img-placeholder">
                            {lang === 'zh' ? '商品图' : 'Product image'}
                          </div>
                        )}
                      </div>
                      <div className="merchant-warehouse-catalog-card-body">
                        <span className="merchant-warehouse-catalog-category">{item.category}</span>
                        <div className="merchant-warehouse-catalog-name">{item.name}</div>
                        <div className="merchant-warehouse-catalog-prices-row">
                          <span>
                            {lang === 'zh' ? '采购价' : 'Purchase price'} $
                            {item.supplyPrice.toFixed(2)}
                          </span>
                          <span>
                            {lang === 'zh' ? '建议售价' : 'Suggested price'} $
                            {item.suggestedPrice.toFixed(2)}
                          </span>
                        </div>
                          {item.status === 'off' ? (
                            <div className="merchant-warehouse-procure-disabled-badge">
                              {lang === 'zh' ? '暂无库存' : 'Out of stock'}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="merchant-warehouse-procure-btn"
                              onClick={(e) => { e.stopPropagation(); openProcurePricingModal(item) }}
                            >
                              {lang === 'zh' ? '采购并上架' : 'Purchase & list'}
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                  {procureList.length < PAGE_SIZE &&
                    Array.from({ length: PAGE_SIZE - procureList.length }).map((_, idx) => (
                      <div
                        key={`placeholder-${idx}`}
                        className="merchant-warehouse-catalog-card merchant-warehouse-catalog-card--placeholder"
                        aria-hidden="true"
                      />
                    ))}
                </div>
                {totalProcurePages > 1 && (
                  <div className="merchant-warehouse-pagination">
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={procurePage <= 1}
                      onClick={() => setProcurePage((p) => Math.max(1, p - 1))}
                    >
                      {lang === 'zh' ? '上一页' : 'Previous'}
                    </button>
                    <span className="merchant-warehouse-page-info">
                      {procurePage} / {totalProcurePages}
                    </span>
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={procurePage >= totalProcurePages}
                      onClick={() => setProcurePage((p) => Math.min(totalProcurePages, p + 1))}
                    >
                      {lang === 'zh' ? '下一页' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {mineDetailItem && (() => {
        const mineDetailImages = mineDetailEnriched?.images?.length
          ? mineDetailEnriched.images
          : mineDetailItem.images?.length
            ? mineDetailItem.images
            : mineDetailItem.image
              ? [mineDetailItem.image]
              : []
        const mineDetailTotalImages = mineDetailImages.length
        const mineCanPrevImage = mineDetailTotalImages > 1 && mineDetailImageIndex > 0
        const mineCanNextImage = mineDetailTotalImages > 1 && mineDetailImageIndex < mineDetailTotalImages - 1
        const mineDetailDesc = mineDetailEnriched?.description ?? ''
        return (
          <div
            className="merchant-warehouse-detail-overlay"
            onClick={() => { setMineDetailItem(null); setMineDetailEnriched(null) }}
            role="presentation"
          >
            <div
              className="merchant-warehouse-detail-panel merchant-warehouse-mine-detail-panel"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mine-detail-title"
            >
              <div className="merchant-warehouse-detail-header">
                <h2 id="mine-detail-title" className="merchant-warehouse-detail-title">{mineDetailItem.productName}</h2>
                <button
                  type="button"
                  className="merchant-warehouse-detail-close"
                  onClick={() => { setMineDetailItem(null); setMineDetailEnriched(null) }}
                  aria-label={lang === 'zh' ? '关闭' : 'Close'}
                >
                  ×
                </button>
              </div>
              <div className="merchant-warehouse-detail-carousel">
                <div className="merchant-warehouse-detail-carousel-inner">
                  {mineDetailTotalImages > 0 ? (
                    <img
                      src={mineDetailImages[mineDetailImageIndex] ?? mineDetailImages[0]}
                      alt={
                        lang === 'zh'
                          ? `${mineDetailItem.productName} 图 ${mineDetailImageIndex + 1}`
                          : `${mineDetailItem.productName} image ${mineDetailImageIndex + 1}`
                      }
                      className="merchant-warehouse-detail-carousel-img"
                    />
                  ) : (
                    <div className="merchant-warehouse-detail-carousel-placeholder">
                      {lang === 'zh' ? '商品图' : 'Product image'}
                    </div>
                  )}
                </div>
                {mineDetailTotalImages > 1 && (
                  <>
                    <button
                      type="button"
                      className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--prev"
                      disabled={!mineCanPrevImage}
                      onClick={(e) => { e.stopPropagation(); setMineDetailImageIndex((i) => Math.max(0, i - 1)) }}
                      aria-label={lang === 'zh' ? '上一张' : 'Previous image'}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--next"
                      disabled={!mineCanNextImage}
                      onClick={(e) => { e.stopPropagation(); setMineDetailImageIndex((i) => Math.min(mineDetailTotalImages - 1, i + 1)) }}
                      aria-label={lang === 'zh' ? '下一张' : 'Next image'}
                    >
                      ›
                    </button>
                    <span className="merchant-warehouse-detail-carousel-dots">
                      {mineDetailImageIndex + 1} / {mineDetailTotalImages}
                    </span>
                  </>
                )}
              </div>
              <div className="merchant-warehouse-detail-body">
                <div className="merchant-warehouse-detail-price">
                  {lang === 'zh' ? '采购价' : 'Purchase price'}{' '}
                  <strong>${mineDetailItem.supplyPrice.toFixed(2)}</strong>
                </div>
                <div className="merchant-warehouse-detail-price">
                  {lang === 'zh' ? '定价' : 'Selling price'}{' '}
                  <strong className="merchant-warehouse-detail-price--sell">
                    ${mineDetailItem.price.toFixed(2)}
                  </strong>
                </div>
                <div className="merchant-warehouse-detail-price">
                  {lang === 'zh' ? '利润比' : 'Profit ratio'}{' '}
                  <strong
                    className={`merchant-warehouse-detail-profit ${
                      mineDetailItem.price >= mineDetailItem.supplyPrice
                        ? 'merchant-warehouse-detail-profit--up'
                        : 'merchant-warehouse-detail-profit--down'
                    }`}
                  >
                    {profitRatio(mineDetailItem.price, mineDetailItem.supplyPrice)}
                  </strong>
                </div>
                {mineDetailDesc && (
                  <div className="merchant-warehouse-detail-desc">
                    <span className="merchant-warehouse-detail-label">
                      {lang === 'zh' ? '商品描述' : 'Product description'}
                    </span>
                    <p>{mineDetailDesc}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {procureDetailItem && (
        <div
          className="merchant-warehouse-detail-overlay"
          onClick={() => setProcureDetailItem(null)}
          role="presentation"
        >
          <div
            className="merchant-warehouse-detail-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="procure-detail-title"
          >
            <div className="merchant-warehouse-detail-header">
              <h2 id="procure-detail-title" className="merchant-warehouse-detail-title">{procureDetailItem.name}</h2>
              <button
                type="button"
                className="merchant-warehouse-detail-close"
                onClick={() => setProcureDetailItem(null)}
                aria-label={lang === 'zh' ? '关闭' : 'Close'}
              >
                ×
              </button>
            </div>
            <div className="merchant-warehouse-detail-carousel">
              <div className="merchant-warehouse-detail-carousel-inner">
                  {detailTotalImages > 0 ? (
                  <img
                    src={detailImages[detailImageIndex]}
                    alt={
                      lang === 'zh'
                        ? `${procureDetailItem.name} 图 ${detailImageIndex + 1}`
                        : `${procureDetailItem.name} image ${detailImageIndex + 1}`
                    }
                    className="merchant-warehouse-detail-carousel-img"
                  />
                ) : (
                  <div className="merchant-warehouse-detail-carousel-placeholder">
                    {lang === 'zh' ? '商品图' : 'Product image'}
                  </div>
                )}
              </div>
              {detailTotalImages > 1 && (
                <>
                  <button
                    type="button"
                    className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--prev"
                    disabled={!canPrevImage}
                    onClick={(e) => { e.stopPropagation(); setDetailImageIndex((i) => Math.max(0, i - 1)) }}
                    aria-label={lang === 'zh' ? '上一张' : 'Previous image'}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--next"
                    disabled={!canNextImage}
                    onClick={(e) => { e.stopPropagation(); setDetailImageIndex((i) => Math.min(detailTotalImages - 1, i + 1)) }}
                    aria-label={lang === 'zh' ? '下一张' : 'Next image'}
                  >
                    ›
                  </button>
                  <span className="merchant-warehouse-detail-carousel-dots">
                    {detailImageIndex + 1} / {detailTotalImages}
                  </span>
                </>
              )}
            </div>
              <div className="merchant-warehouse-detail-body">
              <div className="merchant-warehouse-detail-price">
                {lang === 'zh' ? '采购价' : 'Purchase price'}{' '}
                <strong>${procureDetailItem.supplyPrice.toFixed(2)}</strong>
              </div>
              {procureDetailItem.description && (
                <div className="merchant-warehouse-detail-desc">
                  <span className="merchant-warehouse-detail-label">
                    {lang === 'zh' ? '商品描述' : 'Product description'}
                  </span>
                  <p>{procureDetailItem.description}</p>
                </div>
              )}
              {procureDetailItem.styles.length > 0 && (
                <div className="merchant-warehouse-detail-styles">
                  <span className="merchant-warehouse-detail-label">
                    {lang === 'zh' ? '款式' : 'Styles'}
                  </span>
                  <ul>
                    {procureDetailItem.styles.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                className="merchant-warehouse-detail-procure-btn"
                onClick={() => openProcurePricingModal(procureDetailItem)}
              >
                {lang === 'zh' ? '采购并上架' : 'Purchase & list'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 定价弹层已废弃：定价由系统自动按店铺等级计算 */}

      {/* 采购定价并上架弹层已废弃：采购时由系统根据店铺等级和采购价自动定价 */}

      {deleteConfirmItem && (
        <>
          <div
            className="merchant-warehouse-pricing-overlay"
            onClick={() => setDeleteConfirmItem(null)}
            role="presentation"
            aria-hidden="true"
          />
          <div
            className="merchant-warehouse-delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-warehouse-delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="merchant-warehouse-delete-confirm-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2
              id="merchant-warehouse-delete-confirm-title"
              className="merchant-warehouse-delete-confirm-title"
            >
              {lang === 'zh'
                ? '你确定删除店铺内该商品？'
                : 'Are you sure you want to delete this product from your shop?'}
            </h2>
            <div className="merchant-warehouse-delete-confirm-actions">
              <button
                type="button"
                className="merchant-warehouse-pricing-btn merchant-warehouse-pricing-btn--secondary"
                onClick={() => setDeleteConfirmItem(null)}
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                className="merchant-warehouse-pricing-btn merchant-warehouse-pricing-btn--primary"
                onClick={handleDeleteFromShop}
              >
                {lang === 'zh' ? '确认' : 'Confirm'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MerchantWarehouse
