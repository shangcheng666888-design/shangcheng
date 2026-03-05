import type React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { api, apiBase } from '../api/client'
import ProductCard from '../components/ProductCard'
import lunbo1 from '../assets/lunbo1.png'
import lunbo2 from '../assets/lunbo2.png'
import lunbo3 from '../assets/lunbo3.png'
import lunbo4 from '../assets/lunbo4.png'
import squareOlevs1 from '../assets/square-olevs-1.png'
import squareOlevs2 from '../assets/square-olevs-2.png'
import squareCarleen1 from '../assets/square-carleen-1.png'
import squareCarleen2 from '../assets/square-carleen-2.png'
import squareDiorama1 from '../assets/square-diorama-1.png'
import squareDiorama2 from '../assets/square-diorama-2.png'
import squareBreylee1 from '../assets/square-breylee-1.png'
import squareBreylee2 from '../assets/square-breylee-2.png'
import categoryShoujipeijian from '../assets/category-shoujipeijian.png'
import categoryHuwaiyundong from '../assets/category-huwaiyundong.png'
import categoryBangongwenju from '../assets/category-bangongwenju.png'
import categoryXiuxianyuju from '../assets/category-xiuxianyuju.png'
import categoryShumachanpin from '../assets/category-shumachanpin.png'
import categoryLingshitandian from '../assets/category-lingshitandian.png'
import categoryNvshifuzhuang from '../assets/category-nvshifuzhuang.png'
import categoryDiannaopeijian from '../assets/category-diannaopeijian.png'
import categoryZhubaoshoubiao from '../assets/category-zhubaoshoubiao.png'
import categoryErtongwanju from '../assets/category-ertongwanju.png'
import categoryNanshifuzhuang from '../assets/category-nanshifuzhuang.png'
import categoryMeizhuanghufu from '../assets/category-meizhuanghufu.png'
import categoryJujiachugui from '../assets/category-jujiachugui.png'
import categoryYinpijiushui from '../assets/category-yinpijiushui.png'
import categoryLipinka from '../assets/category-lipinka.png'
import categoryFangyiwupin from '../assets/category-fangyiwupin.png'
import iconZhengpin from '../assets/zhifu.png'
import iconTuihuo from '../assets/tuihuo.png'
import iconYunshu from '../assets/yunshu.png'
import iconZhifu from '../assets/zhengping.png'

const CAROUSEL_IMAGES = [lunbo4, lunbo3, lunbo2, lunbo1]

const SQUARE_ITEMS = [
  {
    brand: 'CARLEEN',
    desc: '饰品珠宝',
    theme: 'carleen',
    images: [squareCarleen1, squareCarleen2],
  },
  {
    brand: 'OLEVS',
    desc: 'Utopia Towels',
    price: '$24.47',
    theme: 'olevs',
    images: [squareOlevs1, squareOlevs2],
  },
  {
    brand: 'DIORAMA CLUB',
    price: '$153.60 /unit',
    theme: 'diorama',
    images: [squareDiorama1, squareDiorama2],
  },
  {
    brand: 'BREYLEE',
    desc: 'Eyelash Extension Shampoo',
    price: '$17.70',
    theme: 'breylee',
    images: [squareBreylee1, squareBreylee2],
  },
]

const recommendCategories: { name: string; image?: string }[] = [
  { name: '手机配件', image: categoryShoujipeijian },
  { name: '防疫物品', image: categoryFangyiwupin },
  { name: '办公文具', image: categoryBangongwenju },
  { name: '数码产品', image: categoryShumachanpin },
  { name: '男士服装', image: categoryNanshifuzhuang },
  { name: '女士服装', image: categoryNvshifuzhuang },
  { name: '休闲鱼具', image: categoryXiuxianyuju },
  { name: '零食甜点', image: categoryLingshitandian },
  { name: '饮品酒水', image: categoryYinpijiushui },
  { name: '户外运动', image: categoryHuwaiyundong },
  { name: '居家橱柜', image: categoryJujiachugui },
  { name: '美妆护肤', image: categoryMeizhuanghufu },
  { name: '珠宝手表', image: categoryZhubaoshoubiao },
  { name: '儿童玩具', image: categoryErtongwanju },
  { name: '电脑配件', image: categoryDiannaopeijian },
  { name: '礼品卡', image: categoryLipinka },
]

type ProductItem = { id: number | string; image: string; price: string; title: string; subtitle: string; shopId?: string; productId?: string }
type ShopItem = { id: number | string; name: string; logo?: string | null; products: number; sales: number; goodRate: number }

function resolveShopLogoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const s = url.trim()
  if (!s || s.startsWith('http://') || s.startsWith('https://')) return s
  return apiBase ? `${apiBase.replace(/\/$/, '')}${s.startsWith('/') ? '' : '/'}${s}` : s
}

/** 首页商品区块：桌面 6 列×4 行，手机 2 列×4 行 */
const HOME_PRODUCTS_MAX = 24
/** 首页推荐店铺最多 9 个 */
const HOME_SHOPS_MAX = 9

const Home: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [_isCategoryPaused, setIsCategoryPaused] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState(() => recommendCategories.slice(0, 10))
  const [squareSlideIndex, setSquareSlideIndex] = useState(0)
  const [newArrivals, setNewArrivals] = useState<ProductItem[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<ProductItem[]>([])
  const [hotSales, setHotSales] = useState<ProductItem[]>([])
  const [recommendedShops, setRecommendedShops] = useState<ShopItem[]>([])
  const [homeLoading, setHomeLoading] = useState(true)
  const [homeLoadFailed, setHomeLoadFailed] = useState(false)
  const categoryPauseRef = useRef(false)

  const fetchHomeData = () => {
    setHomeLoadFailed(false)
    setHomeLoading(true)
    Promise.all([
      api.get<ProductItem[]>('/api/home/new-arrivals').then((data) => setNewArrivals(Array.isArray(data) ? data : [])),
      api.get<ProductItem[]>('/api/home/featured-products').then((data) => setRecommendedProducts(Array.isArray(data) ? data : [])),
      api.get<ProductItem[]>('/api/home/hot-products').then((data) => setHotSales(Array.isArray(data) ? data : [])),
      api.get<ShopItem[]>('/api/home/featured-shops').then((data) => setRecommendedShops(Array.isArray(data) ? data : [])),
    ])
      .then(() => {
        setHomeLoading(false)
        setHomeLoadFailed(false)
      })
      .catch(() => {
        setHomeLoading(false)
        setHomeLoadFailed(true)
      })
  }

  useEffect(() => {
    fetchHomeData()
  }, [])

  const homeShops = useMemo(() => recommendedShops.slice(0, HOME_SHOPS_MAX), [recommendedShops])

  // 顶部大轮播
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % CAROUSEL_IMAGES.length)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const shuffle = useMemo(() => {
    return (arr: typeof recommendCategories) => {
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    }
  }, [])

  // 右侧 4 个小卡片轮播：每个卡片两张图片，统一节奏
  useEffect(() => {
    const timer = setInterval(() => {
      setSquareSlideIndex((i) => i + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // 推荐分类轮播：每次固定展示 9 个、每 5 秒轮播一次；hover 暂停
  useEffect(() => {
    const pageSize = 9
    const deckRef: { current: typeof recommendCategories } = { current: shuffle(recommendCategories) }

    // 初始展示也打乱，避免总是从同一批开始
    setVisibleCategories(deckRef.current.slice(0, pageSize))
    deckRef.current = deckRef.current.slice(pageSize)

    const timer = setInterval(() => {
      if (categoryPauseRef.current) return

      const next: typeof recommendCategories = []
      const used = new Set<string>()

      while (next.length < pageSize) {
        if (deckRef.current.length === 0) {
          deckRef.current = shuffle(recommendCategories)
        }
        const item = deckRef.current.shift()
        if (!item) break
        if (used.has(item.name)) continue
        used.add(item.name)
        next.push(item)
      }

      // 兜底：理论上不会触发（分类数>=10），但保证永远显示 9 个且不重复
      if (next.length < pageSize) {
        for (const item of recommendCategories) {
          if (next.length >= pageSize) break
          if (used.has(item.name)) continue
          used.add(item.name)
          next.push(item)
        }
      }

      setVisibleCategories(next)
    }, 5000)

    return () => clearInterval(timer)
  }, [shuffle])

  const handleSearchSubmit = () => {
    const q = searchKeyword.trim()
    if (!q) {
      navigate('/products')
      return
    }
    navigate(`/products?keyword=${encodeURIComponent(q)}`)
  }

  return (
    <div className="page">
      <div className="home-mobile-search">
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
              lang === 'zh'
                ? '找货源/商品/供应商/求购'
                : 'Search products / suppliers / suppliers requests'
            }
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          <button
            type="button"
            className="search-button"
            onClick={handleSearchSubmit}
          >
            {lang === 'zh' ? '搜索' : 'Search'}
          </button>
        </div>
      </div>

      <section className="hero carousel-section">
        <div className="home-banner-grid">
          <div className="carousel-rect-wrap">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {CAROUSEL_IMAGES.map((img, i) => (
                <div key={i} className="carousel-slide carousel-card">
                  <a href="/products" className="carousel-slide-link">
                    <img src={img} alt={`轮播 ${i + 1}`} className="carousel-slide-img" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-squares">
            {SQUARE_ITEMS.map((item, i) => (
              <div key={i} className={`carousel-square carousel-square--${item.theme}`}>
                <div className="carousel-square-visual">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[(squareSlideIndex + i) % item.images.length]}
                      alt={item.brand}
                      className="carousel-square-img"
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-categories">
        <div className="section-header">
          <h2 className="section-title">
            {lang === 'zh' ? '推荐分类' : 'Recommended categories'}
          </h2>
          <Link to="/categories" className="link-btn category-all">
            {lang === 'zh' ? '全部 >' : 'All >'}
          </Link>
        </div>
        <div
          className="category-strip"
          onMouseEnter={() => {
            categoryPauseRef.current = true
            setIsCategoryPaused(true)
          }}
          onMouseLeave={() => {
            categoryPauseRef.current = false
            setIsCategoryPaused(false)
          }}
        >
          {visibleCategories.map((item) => (
            <Link
              key={item.name}
              to={`/products?category=${encodeURIComponent(item.name)}`}
              className={`category-item${item.name === '礼品卡' ? ' category-item--lipinka' : ''}`}
            >
              <div className="category-icon">
                {item.image ? (
                  <img src={item.image} alt="" className="category-icon-img" />
                ) : null}
              </div>
              <span className="category-name">
                {lang === 'zh'
                  ? item.name
                  : (() => {
                      switch (item.name) {
                        case '手机配件':
                          return 'Phone accessories'
                        case '防疫物品':
                          return 'Epidemic supplies'
                        case '办公文具':
                          return 'Office supplies'
                        case '数码产品':
                          return 'Digital products'
                        case '男士服装':
                          return "Men's clothing"
                        case '女士服装':
                          return "Women's clothing"
                        case '休闲鱼具':
                          return 'Leisure fishing'
                        case '零食甜点':
                          return 'Snacks & desserts'
                        case '饮品酒水':
                          return 'Beverages & alcohol'
                        case '户外运动':
                          return 'Outdoor sports'
                        case '居家橱柜':
                          return 'Home & cabinets'
                        case '美妆护肤':
                          return 'Beauty & skincare'
                        case '珠宝手表':
                          return 'Jewelry & watches'
                        case '儿童玩具':
                          return "Kids' toys"
                        case '电脑配件':
                          return 'Computer accessories'
                        case '礼品卡':
                          return 'Gift cards'
                        default:
                          return item.name
                      }
                    })()}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {homeLoading && (
        <section className="section home-loading-section">
          <div className="home-loading-block">
            <span className="home-loading-spinner" aria-hidden />
            <p className="home-loading-text">{lang === 'zh' ? '加载中…' : 'Loading…'}</p>
          </div>
        </section>
      )}

      {homeLoadFailed && (
        <section className="section home-error-section">
          <div className="home-error-block">
            <p className="home-error-text">{lang === 'zh' ? '加载失败，请刷新或重试' : 'Failed to load. Please refresh or try again.'}</p>
            <button type="button" className="home-error-retry" onClick={() => fetchHomeData()}>
              {lang === 'zh' ? '重试' : 'Retry'}
            </button>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            {lang === 'zh' ? '每日新品上架' : 'New arrivals today'}
          </h2>
          <Link to="/products" className="link-btn">
            {lang === 'zh' ? '更多 >' : 'More >'}
          </Link>
        </div>
        <div className="home-products-grid mall-product-grid card-grid">
          {newArrivals.length === 0 ? (
            <p className="home-section-empty">
              {lang === 'zh' ? '暂无数据' : 'No data yet'}
            </p>
          ) : (
            newArrivals.slice(0, HOME_PRODUCTS_MAX).map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="product-card-link">
                <ProductCard
                  id={item.id}
                  image={item.image}
                  price={item.price}
                  title={item.title}
                  subtitle={item.subtitle}
                  shopId={item.shopId}
                  productId={item.productId}
                />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="section merchant-banner">
        <div className="merchant-banner-inner">
          <div className="merchant-banner-visual" aria-hidden="true">
            <div className="merchant-banner-visual-inner">
              <div className="merchant-banner-store">
                <div className="merchant-banner-store-window" />
                <div className="merchant-banner-store-sign" />
              </div>
              <div className="merchant-banner-box" />
              <div className="merchant-banner-receipt" />
              <div className="merchant-banner-coin merchant-banner-coin-1" />
              <div className="merchant-banner-coin merchant-banner-coin-2" />
              <div className="merchant-banner-coin merchant-banner-coin-3" />
              <div className="merchant-banner-bag" />
            </div>
          </div>
          <div className="merchant-banner-content">
            <div className="merchant-banner-line">
              {lang === 'zh' ? '成为商家' : 'Become a merchant'}
            </div>
            <div className="merchant-banner-line">
              {lang === 'zh' ? '共享佣金' : 'Share commissions'}
            </div>
            <div className="merchant-banner-line merchant-banner-line-highlight">
              {lang === 'zh' ? '最高 ' : 'Up to '}
              <span className="merchant-banner-amount">$10,000</span>
              {lang === 'zh' ? ' 美金' : ' USD'}
            </div>
            <Link to="/merchant/apply" className="merchant-banner-btn">
              {lang === 'zh' ? '立即加入' : 'Join now'}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            {lang === 'zh' ? '推荐产品' : 'Recommended products'}
          </h2>
        </div>
        <div className="home-products-grid mall-product-grid card-grid">
          {recommendedProducts.length === 0 ? (
            <p className="home-section-empty">
              {lang === 'zh' ? '暂无数据' : 'No data yet'}
            </p>
          ) : (
            recommendedProducts.slice(0, HOME_PRODUCTS_MAX).map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="product-card-link">
                <ProductCard
                  id={item.id}
                  image={item.image}
                  price={item.price}
                  title={item.title}
                  subtitle={item.subtitle}
                  shopId={item.shopId}
                  productId={item.productId}
                />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            {lang === 'zh' ? '推荐店铺' : 'Recommended shops'}
          </h2>
        </div>
        <div className="home-shops-grid">
          {recommendedShops.length === 0 ? (
            <p className="home-section-empty">
              {lang === 'zh' ? '暂无数据' : 'No data yet'}
            </p>
          ) : (
            homeShops.map((shop) => (
              <div key={shop.id} className="shop-card">
                <div className="shop-card-avatar" aria-hidden>
                  {resolveShopLogoUrl(shop.logo) ? (
                    <img src={resolveShopLogoUrl(shop.logo)} alt="" className="shop-card-avatar-img" />
                  ) : (
                    shop.name.charAt(0)
                  )}
                </div>
                <div className="shop-card-info">
                  <div className="shop-card-name">{shop.name}</div>
                  <div className="shop-card-stats">
                    <span>
                      {lang === 'zh' ? '商品：' : 'Products: '}
                      {shop.products}
                    </span>
                    <span>
                      {lang === 'zh' ? '销量：' : 'Sales: '}
                      {shop.sales.toLocaleString()}
                    </span>
                    <span>
                      {lang === 'zh' ? '好评率：' : 'Good rate: '}
                      {shop.goodRate}%
                    </span>
                  </div>
                </div>
                <Link to={`/shops/${shop.id}`} className="shop-card-btn">
                  {lang === 'zh' ? '访问商店 >' : 'Visit shop >'}
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            {lang === 'zh' ? '热销推荐' : 'Hot sales'}
          </h2>
        </div>
        <div className="home-products-grid mall-product-grid card-grid">
          {hotSales.length === 0 ? (
            <p className="home-section-empty">
              {lang === 'zh' ? '暂无数据' : 'No data yet'}
            </p>
          ) : (
            hotSales.slice(0, HOME_PRODUCTS_MAX).map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="product-card-link">
                <ProductCard
                  id={item.id}
                  image={item.image}
                  price={item.price}
                  title={item.title}
                  subtitle={item.subtitle}
                  shopId={item.shopId}
                  productId={item.productId}
                />
              </Link>
            ))
          )}
        </div>
      </section>

      <section
        className="section service-features"
        aria-label={lang === 'zh' ? '服务保障' : 'Service guarantees'}
      >
        <div className="service-features-inner">
          <div className="service-feature-item">
            <img src={iconZhengpin} alt="" className="service-feature-icon" />
            <span className="service-feature-label">
              {lang === 'zh' ? '100% 正品' : '100% authentic'}
            </span>
          </div>
          <div className="service-feature-item">
            <img src={iconTuihuo} alt="" className="service-feature-icon" />
            <span className="service-feature-label">
              {lang === 'zh' ? '7 天退货' : '7‑day returns'}
            </span>
          </div>
          <div className="service-feature-item">
            <img src={iconYunshu} alt="" className="service-feature-icon" />
            <span className="service-feature-label">
              {lang === 'zh' ? '运费折扣' : 'Shipping discounts'}
            </span>
          </div>
          <div className="service-feature-item">
            <img src={iconZhifu} alt="" className="service-feature-icon" />
            <span className="service-feature-label">
              {lang === 'zh' ? '安全支付' : 'Secure payment'}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

