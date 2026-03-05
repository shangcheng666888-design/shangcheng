import type React from 'react'
import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { CartProvider } from './cart/CartContext.tsx'
import { ToastProvider } from './components/ToastProvider'
import { ProductFavoritesProvider } from './context/ProductFavoritesContext'
import './App.css'

/* Layouts: lazy so /admin and /merchant don't load until first visit */
const Layout = lazy(() => import('./components/Layout'))
const MerchantBackendLayout = lazy(() => import('./components/MerchantBackendLayout'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))

/* Mall pages */
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const MerchantApply = lazy(() => import('./pages/MerchantApply'))
const Register = lazy(() => import('./pages/Register'))
const Login = lazy(() => import('./pages/Login'))
const MerchantLogin = lazy(() => import('./pages/MerchantLogin'))
const AccountCenter = lazy(() => import('./pages/AccountCenter'))
const WalletRecharge = lazy(() => import('./pages/WalletRecharge'))
const WalletWithdraw = lazy(() => import('./pages/WalletWithdraw'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'))
const DeliveryPolicy = lazy(() => import('./pages/DeliveryPolicy'))
const SellerPolicy = lazy(() => import('./pages/SellerPolicy'))
const Categories = lazy(() => import('./pages/Categories'))
const Shop = lazy(() => import('./pages/Shop'))
const CreditService = lazy(() => import('./pages/CreditService'))
const Checkout = lazy(() => import('./pages/Checkout'))

/* Merchant backend pages */
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard'))
const MerchantOrders = lazy(() => import('./pages/MerchantOrders'))
const MerchantWarehouse = lazy(() => import('./pages/MerchantWarehouse'))
const MerchantPlan = lazy(() => import('./pages/MerchantPlan'))
const MerchantFinance = lazy(() => import('./pages/MerchantFinance'))
const MerchantSettings = lazy(() => import('./pages/MerchantSettings'))
const MerchantWallet = lazy(() => import('./pages/MerchantWallet'))
const MerchantWalletRecharge = lazy(() => import('./pages/MerchantWalletRecharge'))
const MerchantWalletWithdraw = lazy(() => import('./pages/MerchantWalletWithdraw'))

/* Admin pages */
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminShops = lazy(() => import('./pages/admin/AdminShops'))
const AdminWarehouse = lazy(() => import('./pages/admin/AdminWarehouse'))
const AdminWarehouseProductDetail = lazy(() => import('./pages/admin/AdminWarehouseProductDetail'))
const AdminSystem = lazy(() => import('./pages/admin/AdminSystem'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminAuditShops = lazy(() => import('./pages/admin/AdminAuditShops'))
const AdminAuditShopFunds = lazy(() => import('./pages/admin/AdminAuditShopFunds'))
const AdminAuditMallFunds = lazy(() => import('./pages/admin/AdminAuditMallFunds'))

const getScrollRoot = () => document.getElementById('root')

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    getScrollRoot()?.scrollTo(0, 0)
  }, [pathname])
  return null
}

const PageLoadFallback: React.FC = () => (
  <div
    className="app-loading-fallback"
    role="status"
    aria-label="Loading"
  >
    <span className="app-loading-spinner" aria-hidden />
    <span className="app-loading-text">Loading…</span>
  </div>
)

const App: React.FC = () => {
  const routes = (
    <Suspense fallback={<PageLoadFallback />}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="warehouse" element={<AdminWarehouse />} />
          <Route path="warehouse/product/:productId" element={<AdminWarehouseProductDetail />} />
          <Route path="audit/shops" element={<AdminAuditShops />} />
          <Route path="audit/shop-funds" element={<AdminAuditShopFunds />} />
          <Route path="audit/mall-funds" element={<AdminAuditMallFunds />} />
          <Route path="system" element={<AdminSystem />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route path="/shop-login" element={<MerchantLogin />} />
        <Route path="/merchant" element={<MerchantBackendLayout />}>
          <Route path="dashboard" element={<MerchantDashboard />} />
          <Route path="orders" element={<MerchantOrders />} />
          <Route path="warehouse" element={<MerchantWarehouse />} />
          <Route path="plan" element={<MerchantPlan />} />
          <Route path="finance" element={<MerchantFinance />} />
          <Route path="wallet" element={<Outlet />}>
            <Route index element={<MerchantWallet />} />
            <Route path="recharge" element={<MerchantWalletRecharge />} />
            <Route path="withdraw" element={<MerchantWalletWithdraw />} />
          </Route>
          <Route path="settings" element={<MerchantSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="account" element={<AccountCenter />} />
          <Route path="merchant/apply" element={<MerchantApply />} />
          <Route path="wallet/recharge" element={<WalletRecharge />} />
          <Route path="wallet/withdraw" element={<WalletWithdraw />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="shops/:id" element={<Shop />} />
          <Route path="register" element={<Register />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="return-policy" element={<ReturnPolicy />} />
          <Route path="delivery" element={<DeliveryPolicy />} />
          <Route path="seller-policy" element={<SellerPolicy />} />
          <Route path="credit-service" element={<CreditService />} />
          <Route path="checkout" element={<Checkout />} />
        </Route>
      </Routes>
    </Suspense>
  )

  return (
    <CartProvider>
      <ToastProvider>
        <ProductFavoritesProvider>
          <ScrollToTop />
          {routes}
        </ProductFavoritesProvider>
      </ToastProvider>
    </CartProvider>
  )
}

export default App
