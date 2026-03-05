import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import dashboardIcon from '../assets/yibiaopan2.png'
import ordersIcon from '../assets/dianpudingdan.png'
import financeIcon from '../assets/caiwubaobiao.png'
import warehouseIcon from '../assets/cangku.png'
import planIcon from '../assets/yunying.png'
import settingsIcon from '../assets/shezhi2.png'
import walletIcon from '../assets/qianbao.png'
import { api } from '../api/client'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useLang } from '../context/LangContext'

export const MERCHANT_NAV_ITEMS = [
  { path: '/merchant/dashboard', labelZh: '仪表盘', labelEn: 'Dashboard', icon: dashboardIcon },
  { path: '/merchant/orders', labelZh: '店铺订单', labelEn: 'Orders', icon: ordersIcon },
  { path: '/merchant/warehouse', labelZh: '商品仓库', labelEn: 'Warehouse', icon: warehouseIcon },
  { path: '/merchant/plan', labelZh: '运营计划', labelEn: 'Growth plan', icon: planIcon },
  { path: '/merchant/finance', labelZh: '财务报表', labelEn: 'Finance', icon: financeIcon },
  { path: '/merchant/wallet', labelZh: '我的钱包', labelEn: 'Wallet', icon: walletIcon },
  { path: '/merchant/settings', labelZh: '设置', labelEn: 'Settings', icon: settingsIcon },
] as const

export interface MerchantBackendSidebarProps {
  collapsed?: boolean
}

const MerchantBackendSidebar: React.FC<MerchantBackendSidebarProps> = ({ collapsed = false }) => {
  const location = useLocation()
  const { shop } = useMerchantShop()
  const { lang } = useLang()

  return (
    <aside
      className={`merchant-backend-sidebar${collapsed ? ' merchant-backend-sidebar--collapsed' : ''}`}
    >
      <div className="merchant-backend-user">
        <div className="merchant-backend-avatar-wrap">
          {shop?.logo ? (
            <img
              src={shop.logo}
              alt="店铺头像"
              className="merchant-backend-avatar"
              loading="lazy"
            />
          ) : (
            <div className="merchant-backend-avatar" aria-hidden="true">
              <span>{shop?.name ? shop.name.slice(0, 1) : '店'}</span>
            </div>
          )}
        </div>
        <div className="merchant-backend-user-id" title={shop?.name || '我的店铺'}>
          {shop?.name || '我的店铺'}
        </div>
        {shop?.id && (
          <div className="merchant-backend-user-phone">店铺ID：{shop.id}</div>
        )}
        {shop?.id && (
          <Link to={`/shops/${shop.id}`} className="merchant-backend-view-shop-btn">
            查看我的店铺
          </Link>
        )}
      </div>
      <nav className="merchant-backend-nav">
        {MERCHANT_NAV_ITEMS.map((item) => {
          const isActive = item.path === '/merchant/wallet'
            ? location.pathname === '/merchant/wallet' || location.pathname.startsWith('/merchant/wallet/')
            : location.pathname === item.path
          const handleHoverPrefetch: React.MouseEventHandler<HTMLAnchorElement> = (_e) => {
            if (!shop?.id) return
            const path = item.path
            // 预取关键页面数据：订单、财务报表、运营计划
            if (path === '/merchant/orders') {
              api.get(`/api/orders?shop=${encodeURIComponent(shop.id)}`).catch(() => {})
            } else if (path === '/merchant/finance') {
              api.get(`/api/shops/${encodeURIComponent(shop.id)}/finance?days=30`).catch(() => {})
            } else if (path === '/merchant/plan') {
              api.get(`/api/shops/${encodeURIComponent(shop.id)}`).catch(() => {})
            }
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`merchant-backend-nav-item${isActive ? ' merchant-backend-nav-item--active' : ''}`}
              onMouseEnter={handleHoverPrefetch}
            >
              {'icon' in item && item.icon && (
                <img src={item.icon} alt="" className="merchant-backend-nav-icon" aria-hidden />
              )}
              <span className="merchant-backend-nav-label">
                {lang === 'zh' ? item.labelZh : item.labelEn}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default MerchantBackendSidebar
