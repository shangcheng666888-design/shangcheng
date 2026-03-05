import type React from 'react'
import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { api, apiBase } from '../api/client'
import { getCategoryNameZh } from '../constants/categoryNameZh'
import { useLang } from '../context/LangContext'
import { translateSubcategoryName } from './Categories'
import categoryTitleIcon from '../assets/category-icon.png'

/** 后端返回的商城商品项（上架记录） */
interface ApiProductItem {
  id: string
  listingId?: string
  shopId?: string
  productId?: string
  title: string
  image: string
  price: number
  category: string
  subCategory: string
  sales?: number
}

/** 分类（来自数据库） */
interface CategoryItem {
  id: string
  parent_id: string | null
  level: number
  name: string
}

/** 搜索匹配的店铺（列表接口返回） */
interface SearchShopItem {
  id: string
  name: string
  logo: string | null
  listedCount?: number
}

function resolveShopLogoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const s = url.trim()
  if (!s || s.startsWith('http://') || s.startsWith('https://')) return s
  return apiBase ? `${apiBase.replace(/\/$/, '')}${s.startsWith('/') ? '' : '/'}${s}` : s
}

const ROWS_PER_PAGE = 4
const COLS = 5
const PAGE_SIZE = ROWS_PER_PAGE * COLS

type SortKey = 'default' | 'sales' | 'price' | 'new'
type SortDir = 'asc' | 'desc'

const SortArrowIcon: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => {
  const topFill = active && dir === 'desc' ? '#111827' : '#9ca3af'
  const bottomFill = active && dir === 'asc' ? '#111827' : '#9ca3af'
  return (
    <svg viewBox="0 0 12 14" width="12" height="14">
      <path d="M6 1 L10 5 L2 5 Z" fill={topFill} />
      <line x1="2" y1="7" x2="10" y2="7" stroke="#9ca3af" strokeWidth="1" />
      <path d="M6 13 L2 9 L10 9 Z" fill={bottomFill} />
    </svg>
  )
}

const Products: React.FC = () => {
  const { lang } = useLang()

  const getCategoryLabel = (rawName: string) => {
    if (lang === 'zh') return getCategoryNameZh(rawName) || rawName
    return rawName
  }

  const getSubCategoryLabel = (rawName: string) => {
    if (lang === 'zh') return getCategoryNameZh(rawName) || rawName
    // 英文模式：如果是中文名，则用细分类翻译；否则直接使用原始英文名
    const hasChinese = /[\u4e00-\u9fa5]/.test(rawName)
    if (hasChinese) return translateSubcategoryName('en', rawName)
    return rawName
  }
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const categoryIdFromUrl = searchParams.get('categoryId') ?? ''
  const subCategoryIdFromUrl = searchParams.get('subCategoryId') ?? ''
  const keywordFromUrl = searchParams.get('keyword')?.trim() ?? ''

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  /** 大分类（parent_id 为空或 level 1） */
  const topCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id || c.level === 1)
  }, [categories])

  /** 大分类 -> 细分类映射 */
  const subCategoriesByParent = useMemo(() => {
    const map = new Map<string, CategoryItem[]>()
    categories.forEach((c) => {
      if (c.parent_id) {
        const list = map.get(c.parent_id) ?? []
        list.push(c)
        map.set(c.parent_id, list)
      }
    })
    return map
  }, [categories])

  /** 当前选中的大分类 ID（用于展开与高亮） */
  const currentParentId = useMemo(() => {
    if (subCategoryIdFromUrl) {
      const sub = categories.find((c) => c.id === subCategoryIdFromUrl)
      return sub?.parent_id ?? ''
    }
    return categoryIdFromUrl
  }, [categoryIdFromUrl, subCategoryIdFromUrl, categories])

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  /** 手机版：分类面板展开/收起 */
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)

  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [apiProducts, setApiProducts] = useState<ApiProductItem[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsTotal, setProductsTotal] = useState(0)
  const [searchShops, setSearchShops] = useState<SearchShopItem[]>([])

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    api
      .get<{ list: CategoryItem[] }>('/api/categories')
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray((res as { list?: CategoryItem[] }).list) ? (res as { list: CategoryItem[] }).list : []
        setCategories(list)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (subCategoryIdFromUrl || categoryIdFromUrl) {
      setExpandedCategoryId(currentParentId || categoryIdFromUrl)
    } else {
      setExpandedCategoryId(null)
    }
  }, [categoryIdFromUrl, subCategoryIdFromUrl, currentParentId])

  useEffect(() => {
    let cancelled = false
    setProductsLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '500')
    params.set('offset', '0')
    if (keywordFromUrl) params.set('search', keywordFromUrl)
    if (subCategoryIdFromUrl) {
      params.set('subCategoryId', subCategoryIdFromUrl)
    } else if (categoryIdFromUrl) {
      params.set('categoryId', categoryIdFromUrl)
    }
    api
      .get<{ list: ApiProductItem[]; total: number }>(`/api/products?${params.toString()}`)
      .then((res) => {
        if (cancelled) return
        const data = res as { list?: ApiProductItem[]; total?: number }
        const list = Array.isArray(data.list) ? data.list : []
        setApiProducts(list)
        setProductsTotal(Number(data.total) ?? list.length)
      })
      .catch(() => {
        if (!cancelled) {
          setApiProducts([])
          setProductsTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })
    return () => { cancelled = true }
  }, [categoryIdFromUrl, subCategoryIdFromUrl, keywordFromUrl])

  useEffect(() => {
    if (!keywordFromUrl) {
      setSearchShops([])
      return
    }
    let cancelled = false
    api
      .get<{ list: SearchShopItem[] }>(`/api/shops?search=${encodeURIComponent(keywordFromUrl)}`)
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray((res as { list?: SearchShopItem[] }).list) ? (res as { list: SearchShopItem[] }).list : []
        setSearchShops(list)
      })
      .catch(() => {
        if (!cancelled) setSearchShops([])
      })
    return () => { cancelled = true }
  }, [keywordFromUrl])

  const handleMainCategoryClick = (id: string) => {
    if (expandedCategoryId === id) {
      setExpandedCategoryId(null)
      navigate('/products')
    } else {
      setExpandedCategoryId(id)
      navigate(`/products?categoryId=${encodeURIComponent(id)}`)
    }
  }

  const handleSort = (key: 'sales' | 'price' | 'new') => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('desc')
    } else {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    }
  }

  const products = useMemo(() => {
    const list = [...apiProducts]
    if (sortKey === 'price') {
      list.sort((a, b) => {
        const pa = a.price ?? 0
        const pb = b.price ?? 0
        return sortDir === 'desc' ? pb - pa : pa - pb
      })
    }
    if (sortKey === 'sales') {
      list.sort((a, b) => {
        const sa = a.sales ?? 0
        const sb = b.sales ?? 0
        return sortDir === 'desc' ? sb - sa : sa - sb
      })
    }
    return list
  }, [apiProducts, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage(1)
  }, [categoryIdFromUrl, subCategoryIdFromUrl, keywordFromUrl, sortKey, sortDir])

  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [products, currentPage])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const paginationNumbers = useMemo(() => {
    const list: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i)
    } else {
      list.push(1)
      const show = 5
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      if (end - start + 1 < show) {
        if (currentPage <= 3) end = Math.min(totalPages - 1, start + show - 1)
        else if (currentPage >= totalPages - 2) start = Math.max(2, end - show + 1)
      }
      if (start > 2) list.push('ellipsis')
      for (let i = start; i <= end; i++) list.push(i)
      if (end < totalPages - 1) list.push('ellipsis')
      if (totalPages > 1) list.push(totalPages)
    }
    return list
  }, [totalPages, currentPage])

  return (
    <div className="page products-page">
      <div className="products-page-full">
        <div className="products-layout">
          <aside className={`products-sidebar${mobileCategoriesOpen ? ' products-sidebar--open' : ''}`}>
            <div
              className="products-sidebar-panel"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a')) setMobileCategoriesOpen(false)
              }}
            >
              <h2 className="products-sidebar-title">
                {lang === 'zh' ? '分类' : 'Categories'}
              </h2>
              <Link
                to="/products"
                className={`products-sidebar-item${!categoryIdFromUrl && !subCategoryIdFromUrl ? ' products-sidebar-item--active' : ''}`}
                onClick={() => setMobileCategoriesOpen(false)}
              >
                {lang === 'zh' ? '全部' : 'All'}
              </Link>
              <nav className="products-sidebar-nav">
              {categoriesLoading ? (
                <p className="products-sidebar-loading">
                  {lang === 'zh' ? '加载分类…' : 'Loading categories…'}
                </p>
              ) : (
                topCategories.map((cat) => {
                  const subItems = subCategoriesByParent.get(cat.id) ?? []
                  const isExpanded = expandedCategoryId === cat.id
                  const catLabel = getCategoryLabel(cat.name)
                  const isParentActive = categoryIdFromUrl === cat.id && !subCategoryIdFromUrl
                  if (subItems.length > 0) {
                    return (
                      <div key={cat.id} className={`products-sidebar-category-wrap${isExpanded ? ' products-sidebar-category-wrap--expanded' : ''}`}>
                        <button
                          type="button"
                          className={`products-sidebar-item products-sidebar-item--expandable${isParentActive ? ' products-sidebar-item--active' : ''}`}
                          onClick={() => handleMainCategoryClick(cat.id)}
                        >
                          <span className="products-sidebar-item-text">
                            <span>{catLabel}</span>
                            <span className={`products-sidebar-caret${isExpanded ? ' products-sidebar-caret--down' : ''}`} aria-hidden>
                              <svg viewBox="0 0 12 8" width="12" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 2 L6 6 L10 2" />
                              </svg>
                            </span>
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="products-sidebar-subs">
                            {subItems.map((sub) => {
                              const subLabel = getSubCategoryLabel(sub.name)
                              const isSubActive = subCategoryIdFromUrl === sub.id
                              return (
                                <Link
                                  key={sub.id}
                                  to={`/products?categoryId=${encodeURIComponent(cat.id)}&subCategoryId=${encodeURIComponent(sub.id)}`}
                                  className={`products-sidebar-sub-item${isSubActive ? ' products-sidebar-sub-item--active' : ''}`}
                                >
                                  {subLabel}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?categoryId=${encodeURIComponent(cat.id)}`}
                      className={`products-sidebar-item${categoryIdFromUrl === cat.id ? ' products-sidebar-item--active' : ''}`}
                    >
                      <span>{catLabel}</span>
                      <span className="products-sidebar-arrow">&gt;</span>
                    </Link>
                  )
                })
              )}
              </nav>
            </div>
          </aside>

          <main className="products-main">
            {keywordFromUrl && (
              <p className="products-search-result-title">
                {lang === 'zh'
                  ? `搜索结果：${keywordFromUrl}（共 ${productsTotal} 件商品${searchShops.length > 0 ? `，${searchShops.length} 家店铺` : ''}）`
                  : `Search: "${keywordFromUrl}" (${productsTotal} items${searchShops.length > 0 ? `, ${searchShops.length} shops` : ''})`}
              </p>
            )}
            {keywordFromUrl && searchShops.length > 0 && (
              <section className="products-search-shops" aria-label={lang === 'zh' ? '相关店铺' : 'Related shops'}>
                <h3 className="products-search-shops-title">{lang === 'zh' ? '相关店铺' : 'Related shops'}</h3>
                <div className="products-search-shops-grid">
                  {searchShops.map((shop) => (
                    <Link key={shop.id} to={`/shops/${shop.id}`} className="products-search-shop-card">
                      <div className="products-search-shop-avatar">
                        {resolveShopLogoUrl(shop.logo) ? (
                          <img src={resolveShopLogoUrl(shop.logo)} alt="" className="products-search-shop-avatar-img" loading="lazy" />
                        ) : (
                          <span className="products-search-shop-avatar-fallback">{shop.name.charAt(0) || '店'}</span>
                        )}
                      </div>
                      <div className="products-search-shop-name">{shop.name}</div>
                      {shop.listedCount != null && (
                        <div className="products-search-shop-meta">
                          {lang === 'zh' ? `${shop.listedCount} 件在售` : `${shop.listedCount} listed`}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <div className="products-sort">
              <button
                type="button"
                className="products-sidebar-toggle"
                onClick={() => setMobileCategoriesOpen((o) => !o)}
                aria-expanded={mobileCategoriesOpen}
                aria-label={
                  mobileCategoriesOpen
                    ? (lang === 'zh' ? '收起分类' : 'Collapse categories')
                    : (lang === 'zh' ? '展开分类' : 'Expand categories')
                }
              >
                <span className="products-sidebar-toggle-text">
                  <span className="products-sidebar-toggle-text-inner">
                    <img
                      src={categoryTitleIcon}
                      alt=""
                      aria-hidden="true"
                      className="products-sidebar-toggle-icon-img"
                    />
                    <span>{lang === 'zh' ? '分类' : 'Categories'}</span>
                  </span>
                </span>
                <span className="products-sidebar-toggle-icon" aria-hidden>
                  {mobileCategoriesOpen ? (
                    <svg
                      viewBox="0 0 12 8"
                      width="12"
                      height="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 6 L6 2 L2 6" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 12 8"
                      width="12"
                      height="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 2 L6 6 L10 2" />
                    </svg>
                  )}
                </span>
              </button>
              <button
                type="button"
                className="products-sort-btn products-sort-btn--default"
                onClick={() => setSortKey('default')}
              >
                {lang === 'zh' ? '综合' : 'Default'}
              </button>
              <button
                type="button"
                className={`products-sort-btn${
                  sortKey === 'sales' ? ' products-sort-btn--active' : ''
                }`}
                onClick={() => handleSort('sales')}
              >
                {lang === 'zh' ? '销量' : 'Sales'}{' '}
                <span className="products-sort-icon" aria-hidden>
                  <SortArrowIcon active={sortKey === 'sales'} dir={sortDir} />
                </span>
              </button>
              <button
                type="button"
                className={`products-sort-btn${
                  sortKey === 'price' ? ' products-sort-btn--active' : ''
                }`}
                onClick={() => handleSort('price')}
              >
                {lang === 'zh' ? '价格' : 'Price'}{' '}
                <span className="products-sort-icon" aria-hidden>
                  <SortArrowIcon active={sortKey === 'price'} dir={sortDir} />
                </span>
              </button>
              <button
                type="button"
                className={`products-sort-btn${
                  sortKey === 'new' ? ' products-sort-btn--active' : ''
                }`}
                onClick={() => handleSort('new')}
              >
                {lang === 'zh' ? '上新' : 'Newest'}{' '}
                <span className="products-sort-icon" aria-hidden>
                  <SortArrowIcon active={sortKey === 'new'} dir={sortDir} />
                </span>
              </button>
            </div>

            <div className="mall-product-grid products-main-grid">
              {productsLoading ? (
                <p className="products-empty">
                  {lang === 'zh' ? '加载中...' : 'Loading...'}
                </p>
              ) : pageProducts.length === 0 ? (
                <p className="products-empty">
                  {keywordFromUrl
                    ? (lang === 'zh' ? `未找到与「${keywordFromUrl}」相关的商品` : `No products found for "${keywordFromUrl}"`)
                    : (lang === 'zh' ? '暂无商品' : 'No products found')}
                </p>
              ) : (
                pageProducts.map((item) => {
                  const id = item.listingId ?? item.id
                  const priceStr = `$${item.price.toFixed(2)}`
                  const subtitle =
                    lang === 'zh'
                      ? getCategoryNameZh(item.subCategory) ||
                        getCategoryNameZh(item.category) ||
                        item.subCategory ||
                        item.category
                      : (() => {
                          const first = item.subCategory || item.category
                          if (!first) return ''
                          const hasChinese = /[\u4e00-\u9fa5]/.test(first)
                          return hasChinese ? translateSubcategoryName('en', first) : first
                        })()
                  return (
                    <Link key={String(id)} to={`/products/${id}`} className="product-card-link">
                      <ProductCard
                        id={id}
                        image={item.image}
                        price={priceStr}
                        title={item.title}
                        subtitle={subtitle}
                        shopId={item.shopId}
                        productId={item.productId}
                      />
                    </Link>
                  )
                })
              )}
            </div>

            {totalPages > 1 && (
              <nav
                className="products-pagination"
                aria-label={lang === 'zh' ? '分页' : 'Pagination'}
              >
                <button
                  type="button"
                  className="products-pagination-btn products-pagination-arrow"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label={lang === 'zh' ? '上一页' : 'Previous page'}
                >
                  &lt;
                </button>
                {paginationNumbers.map((n, i) =>
                  n === 'ellipsis' ? (
                    <span key={`ellipsis-${i}`} className="products-pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={`products-pagination-btn${currentPage === n ? ' products-pagination-btn--active' : ''}`}
                      onClick={() => goToPage(n)}
                      aria-current={currentPage === n ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="products-pagination-btn products-pagination-arrow"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label={lang === 'zh' ? '下一页' : 'Next page'}
                >
                  &gt;
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Products
