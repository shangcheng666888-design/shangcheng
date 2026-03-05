import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/admin/dashboard', label: '仪表盘' },
  { path: '/admin/users', label: '商城用户' },
  { path: '/admin/shops', label: '店铺管理' },
  { path: '/admin/warehouse', label: '商品仓' },
  { path: '/admin/system', label: '系统管理' },
]

export interface AdminSidebarProps {
  collapsed?: boolean
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed = false }) => {
  const location = useLocation()

  return (
    <aside className={`admin-sidebar${collapsed ? ' admin-sidebar--collapsed' : ''}`}>
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-text">全站管理</span>
      </div>
      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar-nav-item${isActive ? ' admin-sidebar-nav-item--active' : ''}`}
            >
              <span className="admin-sidebar-nav-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default AdminSidebar
