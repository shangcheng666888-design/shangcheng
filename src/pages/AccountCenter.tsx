import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import kongtai from '../assets/kongtai.png'
import walletIcon from '../assets/qianbao.png'
import AccountSidebar from '../components/AccountSidebar'
import type { AccountNavKey } from '../components/AccountSidebar'
import ProductCard from '../components/ProductCard'
import { useToast } from '../components/ToastProvider'
import { useProductFavorites } from '../context/ProductFavoritesContext'
import AddressModal from '../components/AddressModal'
import { getRegions, getCities } from '../constants/countryRegions'
import { COUNTRY_OPTIONS } from '../constants/countries'
import type { AddressItem } from '../utils/addressList'

export type { AddressItem }

function normalizeAddress(a: unknown): AddressItem | null {
  if (!a || typeof a !== 'object') return null
  const o = a as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  return {
    id,
    recipient: typeof o.recipient === 'string' ? o.recipient : '',
    email: typeof o.email === 'string' ? o.email : '',
    phoneCode: typeof o.phoneCode === 'string' ? o.phoneCode : '+86',
    phone: typeof o.phone === 'string' ? o.phone : '',
    country: typeof o.country === 'string' ? o.country : '',
    province: typeof o.province === 'string' ? o.province : '',
    city: typeof o.city === 'string' ? o.city : '',
    postal: typeof o.postal === 'string' ? o.postal : '',
    detail: typeof o.detail === 'string' ? o.detail : '',
    isDefault: !!o.isDefault,
  }
}
import type { FollowedShop } from '../utils/followedShops'
import { getOrderStatusLabel, type Order, type OrderStatus } from '../utils/orderList'
import {
  formatRecordDate,
  STATUS_TEXT,
  type WalletRechargeRecord,
  type WalletWithdrawRecord,
} from '../utils/walletRecords'
import LogoutSuccessModal from '../components/LogoutSuccessModal'
import { api } from '../api/client'
import { useCart } from '../cart/CartContext'
import type { CartItem } from '../cart/CartContext'
import { useLang } from '../context/LangContext'

const VALID_TABS: AccountNavKey[] = ['wallet', 'orders', 'productFavorites', 'shopFavorites', 'settings']

const LOGIN_PWD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,22}$/

function getAuthUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    return (JSON.parse(raw) as { id?: string })?.id ?? null
  } catch { return null }
}

type SettingsView = 'list' | 'loginPwd' | 'tradePwd' | 'tradePwdEdit' | 'address'

type ApiOrderStatus = 'pending' | 'paid' | 'shipped' | 'in_transit' | 'delivered' | 'completed' | 'return_pending' | 'returned' | 'refund_pending' | 'refunded' | 'cancelled'

interface ApiOrder {
  id: string
  orderNumber: string
  shopId: string
  userId: string
  amount: number
  status: ApiOrderStatus
  trackingNo?: string
  createdAt: string
  address?: {
    recipient?: string
    phoneCode?: string
    phone?: string
    country?: string
    province?: string
    city?: string
    postal?: string
    detail?: string
  }
  items?: Array<{ id: string; productId?: string; title: string; price: number; quantity: number; image?: string; spec?: string }>
}

function mapApiStatusToLocal(status: ApiOrderStatus): OrderStatus {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'paid':
      return 'shipping'   // 客户视角：待发货
    case 'shipped':
      return 'outbound'   // 正在出库
    case 'in_transit':
      return 'transit'    // 正在配送
    case 'delivered':
      return 'signed'     // 已签收
    case 'completed':
      return 'completed'
    case 'return_pending':
      return 'return_pending'
    case 'returned':
      return 'returned'
    case 'refund_pending':
      return 'refund_pending'
    case 'refunded':
      return 'refunded'
    case 'cancelled':
    default:
      return 'cancelled'
  }
}

const AccountCenter: React.FC = () => {
  const { lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as AccountNavKey | null
  const [activeKey, setActiveKey] = useState<AccountNavKey>(() =>
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'wallet'
  )
  const [settingsView, setSettingsView] = useState<SettingsView>('list')
  const navigate = useNavigate()
  const location = useLocation()
  const [_tradePwdModalOpen] = useState(false) // 占位，已不再使用

  const [loginPwdOld, setLoginPwdOld] = useState('')
  const [loginPwdNew, setLoginPwdNew] = useState('')
  const [loginPwdConfirm, setLoginPwdConfirm] = useState('')
  const [loginPwdShowOld, setLoginPwdShowOld] = useState(false)
  const [loginPwdShowNew, setLoginPwdShowNew] = useState(false)
  const [loginPwdShowConfirm, setLoginPwdShowConfirm] = useState(false)
  const [loginPwdErrors, setLoginPwdErrors] = useState({ old: '', new: '', confirm: '' })
  const [tradePwdOld, setTradePwdOld] = useState('')
  const [tradePwdNew, setTradePwdNew] = useState('')
  const [tradePwdConfirm, setTradePwdConfirm] = useState('')
  const [tradePwdShowOld, setTradePwdShowOld] = useState(false)
  const [tradePwdShowNew, setTradePwdShowNew] = useState(false)
  const [tradePwdShowConfirm, setTradePwdShowConfirm] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressList, setAddressList] = useState<AddressItem[]>([])
  const [settingsProfile, setSettingsProfile] = useState<{ hasTradePassword: boolean; addresses: AddressItem[] } | null>(null)
  // 关注店铺只走后端持久化（不再使用 localStorage 假数据）
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([])
  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false)
  const [walletHistoryTab, setWalletHistoryTab] = useState<'recharge' | 'withdraw'>('recharge')
  const [walletBalance, setWalletBalance] = useState(0)
  const [rechargeRecords, setRechargeRecords] = useState<WalletRechargeRecord[]>([])
  const [withdrawRecords, setWithdrawRecords] = useState<WalletWithdrawRecord[]>([])
  const [productFavPage, setProductFavPage] = useState(1)
  const [shopFavPage, setShopFavPage] = useState(1)
  const [orderList, setOrderList] = useState<Order[]>([])
  /** 订单 Tab：all | 单状态 | 分组(delivered=待收货=出库+配送+签收, refund=退款/售后) */
  const [orderTab, setOrderTab] = useState<'all' | OrderStatus | 'delivered' | 'refund'>('all')
  const { showToast } = useToast()
  const { productFavorites, refetchFavorites } = useProductFavorites()
  const { replaceCart, items: cartItems, totalAmount: cartTotal, clear: clearCart } = useCart()

  const PRODUCT_FAV_PER_PAGE = 8
  const SHOP_FAV_PER_PAGE = 4
  const productFavTotalPages = Math.max(1, Math.ceil(productFavorites.length / PRODUCT_FAV_PER_PAGE))
  const shopFavTotalPages = Math.max(1, Math.ceil(followedShops.length / SHOP_FAV_PER_PAGE))
  const productFavSlice = productFavorites.slice((productFavPage - 1) * PRODUCT_FAV_PER_PAGE, productFavPage * PRODUCT_FAV_PER_PAGE)
  const shopFavSlice = followedShops.slice((shopFavPage - 1) * SHOP_FAV_PER_PAGE, shopFavPage * SHOP_FAV_PER_PAGE)

  useEffect(() => {
    if (!getAuthUserId()) {
      navigate('/login', { replace: true })
      return
    }
  }, [navigate])

  useEffect(() => {
    if (location.pathname === '/account') {
      document.getElementById('root')?.scrollTo({ top: 0, behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (activeKey !== 'orders') return
    const uid = getAuthUserId()
    if (!uid) {
      setOrderList([])
      return
    }
    let cancelled = false
    api
      .get<{ list: ApiOrder[] }>(`/api/orders?userId=${encodeURIComponent(uid)}`)
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray(res.list) ? res.list : []
        const mapped: Order[] = list.map((o) => {
          const ts = Date.parse(o.createdAt)
          const createdAt = Number.isNaN(ts) ? Date.now() : ts
          const addr = o.address ?? {}
          return {
            id: o.id,
            orderNumber: o.orderNumber || o.id,
            status: mapApiStatusToLocal(o.status),
            items: (o.items ?? []).map((it) => ({
              id: it.id,
              title: it.title,
              price: it.price,
              quantity: it.quantity,
              image: it.image,
              spec: it.spec,
            })),
            address: {
              recipient: addr.recipient ?? '',
              email: (addr as { email?: string }).email ?? '',
              phoneCode: addr.phoneCode ?? '',
              phone: addr.phone ?? '',
              country: addr.country ?? '',
              province: addr.province ?? '',
              city: addr.city ?? '',
              postal: addr.postal ?? '',
              detail: addr.detail ?? '',
            },
            total: o.amount,
            createdAt,
          }
        })
        setOrderList(mapped)
      })
      .catch(() => {
        if (!cancelled) setOrderList([])
      })
    return () => {
      cancelled = true
    }
  }, [activeKey])

  useEffect(() => {
    if (activeKey !== 'shopFavorites') return
    try {
      const raw = window.localStorage.getItem('authUser')
      const u = raw ? (JSON.parse(raw) as { id?: string }) : null
      if (u?.id) {
        api.get<{ list: Array<{ shopId: string; shopName: string | null; shopLogo?: string | null }> }>(`/api/users/${u.id}/followed-shops`)
          .then((res) => {
            const list = Array.isArray(res.list) ? res.list.map((s) => ({ id: s.shopId, name: s.shopName ?? s.shopId, logo: s.shopLogo ?? null })) : []
            setFollowedShops(list)
          })
          .catch(() => setFollowedShops([]))
      } else {
        setFollowedShops([])
      }
    } catch {
      setFollowedShops([])
    }
  }, [activeKey])

  useEffect(() => {
    if (activeKey === 'productFavorites') refetchFavorites()
  }, [activeKey, refetchFavorites])

  useEffect(() => {
    if (activeKey === 'productFavorites' && productFavPage > productFavTotalPages) setProductFavPage(1)
  }, [activeKey, productFavPage, productFavTotalPages])

  useEffect(() => {
    if (activeKey === 'shopFavorites' && shopFavPage > shopFavTotalPages) setShopFavPage(1)
  }, [activeKey, shopFavPage, shopFavTotalPages])

  useEffect(() => {
    if (activeKey !== 'settings') return
    const uid = getAuthUserId()
    if (!uid) {
      setSettingsProfile(null)
      setAddressList([])
      return
    }
    let cancelled = false
    api.get<{ hasTradePassword: boolean; addresses: unknown[] }>(`/api/users/${uid}`)
      .then((res) => {
        if (cancelled) return
        const addrs = (res.addresses ?? []).map((a) => normalizeAddress(a)).filter((a): a is AddressItem => a !== null)
        setSettingsProfile({ hasTradePassword: !!res.hasTradePassword, addresses: addrs })
        setAddressList(addrs)
      })
      .catch(() => {
        if (!cancelled) {
          setSettingsProfile(null)
          setAddressList([])
        }
      })
    return () => { cancelled = true }
  }, [activeKey])

  useEffect(() => {
    if (activeKey !== 'wallet') return
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    const authUser = raw
      ? (() => {
          try {
            return JSON.parse(raw) as { id?: string; balance?: number }
          } catch {
            return null
          }
        })()
      : null
    if (!authUser?.id) {
      setWalletBalance(0)
      setRechargeRecords([])
      setWithdrawRecords([])
      return
    }

    let cancelled = false

    const fetchWallet = () => {
      // 最新余额
      api
        .get<{ balance?: number }>(`/api/users/${authUser.id}`)
        .then((res) => {
          if (cancelled) return
          const nextBalance = Number.isFinite(Number(res.balance)) ? Number(res.balance) : 0
          setWalletBalance(nextBalance)
          try {
            const nextAuthUser = { ...authUser, balance: nextBalance }
            window.localStorage.setItem('authUser', JSON.stringify(nextAuthUser))
          } catch {
            // ignore
          }
        })
        .catch(() => {
          if (!cancelled) {
            setWalletBalance(authUser.balance ?? 0)
          }
        })

      // 资金申请记录
      api
        .get<{
          list: Array<{
            id: number
            type: string
            amount: number
            status: 'pending' | 'approved' | 'rejected'
            createdAt: string
            orderNo?: string
            rechargeTxNo?: string | null
            withdrawAddress?: string | null
          }>
        }>(`/api/users/${authUser.id}/fund-applications?pageSize=100`)
        .then((res) => {
          if (cancelled || !res.list) return
          const list = res.list
          const recharge: WalletRechargeRecord[] = list
            .filter((r) => r.type === 'recharge')
            .map((r) => ({
              id: String(r.id),
              createdAt: r.createdAt,
              orderNo: r.orderNo ?? `RCH${r.id}`,
              amount: String(r.amount),
              currency: 'USDT',
              protocol: 'USDT-TRC20',
              status:
                r.status === 'approved'
                  ? ('completed' as const)
                  : r.status === 'rejected'
                  ? ('failed' as const)
                  : ('pending' as const),
              actualAmount: r.status === 'approved' ? String(r.amount) : '—',
              address: '1231231231231',
              transactionNo: r.rechargeTxNo && r.rechargeTxNo.trim() ? r.rechargeTxNo : '—',
            }))
          const withdraw: WalletWithdrawRecord[] = list
            .filter((r) => r.type === 'withdraw')
            .map((r) => ({
              id: String(r.id),
              createdAt: r.createdAt,
              orderNo: r.orderNo ?? `WD${r.id}`,
              amount: String(Math.abs(r.amount)),
              currency: 'USDT',
              address: r.withdrawAddress || '—',
              status:
                r.status === 'approved'
                  ? ('completed' as const)
                  : r.status === 'rejected'
                  ? ('failed' as const)
                  : ('pending' as const),
            }))
          setRechargeRecords(recharge)
          setWithdrawRecords(withdraw)
        })
        .catch(() => {
          if (!cancelled) {
            setRechargeRecords([])
            setWithdrawRecords([])
          }
        })
    }

    // 立即拉一次
    fetchWallet()
    // 每 5 秒自动刷新一次，实现实时感知后台审核
    const timer = window.setInterval(fetchWallet, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [activeKey, location.pathname])

  const openAddressModalForNew = () => {
    setEditingAddressId(null)
    setAddressModalOpen(true)
  }

  const openAddressModalForEdit = (item: AddressItem) => {
    setEditingAddressId(item.id)
    setAddressModalOpen(true)
  }

  const handleAddressSuccess = (item: AddressItem) => {
    let nextList: AddressItem[]
    if (editingAddressId) {
      nextList = addressList.map((a) => (a.id === editingAddressId ? item : a))
    } else {
      nextList = [...addressList, item]
    }
    if (item.isDefault) {
      nextList = nextList.map((a) => ({ ...a, isDefault: a.id === item.id }))
    }
    const uid = getAuthUserId()
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.patch(`/api/users/${uid}`, { addresses: nextList })
      .then(() => {
        setAddressList(nextList)
        setAddressModalOpen(false)
        setEditingAddressId(null)
        showToast(
          editingAddressId
            ? (lang === 'zh' ? '修改成功' : 'Updated successfully')
            : (lang === 'zh' ? '保存成功' : 'Saved successfully'),
        )
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '保存失败' : 'Save failed'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const getCountryLabel = (code: string) => COUNTRY_OPTIONS.find((c) => c.value === code)?.label ?? code
  const getRegionLabel = (countryCode: string, regionValue: string) => {
    const regions = getRegions(countryCode)
    return regions.find((r) => r.value === regionValue)?.label ?? regionValue
  }
  const getCityLabel = (countryCode: string, regionValue: string, cityValue: string) => {
    const cities = getCities(countryCode, regionValue)
    return cities.find((c) => c.value === cityValue)?.label ?? cityValue
  }

  const handleDeleteAddress = (id: string) => {
    const nextList = addressList.filter((a) => a.id !== id)
    const uid = getAuthUserId()
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.patch(`/api/users/${uid}`, { addresses: nextList })
      .then(() => {
        setAddressList(nextList)
        showToast(lang === 'zh' ? '已删除' : 'Deleted')
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '删除失败' : 'Delete failed'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const handleSetDefaultAddress = (id: string) => {
    const nextList = addressList.map((a) => ({ ...a, isDefault: a.id === id }))
    const uid = getAuthUserId()
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.patch(`/api/users/${uid}`, { addresses: nextList })
      .then(() => {
        setAddressList(nextList)
        showToast(lang === 'zh' ? '已设为默认地址' : 'Set as default address')
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '设置失败' : 'Update failed'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const restrictToSixDigits = (v: string) => v.replace(/\D/g, '').slice(0, 6)

  const handleLoginPwdSubmit = () => {
    const next = { old: '', new: '', confirm: '' }
    if (!loginPwdOld) next.old = lang === 'zh' ? '请输入旧密码' : 'Please enter your current password'
    if (!loginPwdNew) {
      next.new = lang === 'zh' ? '请输入新密码' : 'Please enter a new password'
    } else if (!LOGIN_PWD_REGEX.test(loginPwdNew)) {
      next.new =
        lang === 'zh'
          ? '密码需为 6-22 位字母和数字组合'
          : 'Password must be 6–22 characters with letters and numbers'
    }
    if (!loginPwdConfirm) {
      next.confirm =
        lang === 'zh' ? '请再次输入新密码' : 'Please confirm your new password'
    } else if (loginPwdConfirm !== loginPwdNew) {
      next.confirm =
        lang === 'zh' ? '两次输入的密码不一致' : 'The two passwords do not match'
    }

    setLoginPwdErrors(next)
    if (next.old || next.new || next.confirm) return

    const uid = getAuthUserId()
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.post(`/api/users/${uid}/change-password`, { oldPassword: loginPwdOld, newPassword: loginPwdNew })
      .then(() => {
        showToast(lang === 'zh' ? '修改成功' : 'Password updated successfully')
        setLoginPwdOld('')
        setLoginPwdNew('')
        setLoginPwdConfirm('')
        setLoginPwdErrors({ old: '', new: '', confirm: '' })
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '修改失败' : 'Update failed'
        const msg = err instanceof Error ? err.message : fallback
        setLoginPwdErrors((e) => ({ ...e, old: msg }))
        showToast(msg, 'error')
      })
  }

  const handleTradePwdSubmit = () => {
    if (tradePwdNew.length !== 6) {
      showToast(
        lang === 'zh' ? '请输入6位数字密码' : 'Please enter a 6‑digit PIN',
        'error',
      )
      return
    }
    if (tradePwdConfirm.length !== 6) {
      showToast(
        lang === 'zh' ? '请输入6位数字密码' : 'Please enter a 6‑digit PIN',
        'error',
      )
      return
    }
    if (tradePwdNew !== tradePwdConfirm) {
      showToast(
        lang === 'zh' ? '两次密码不一致' : 'The two PIN codes do not match',
        'error',
      )
      return
    }
    const uid = getAuthUserId()
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.patch(`/api/users/${uid}`, { tradePassword: tradePwdNew })
      .then(() => {
        setSettingsProfile((p) => (p ? { ...p, hasTradePassword: true } : { hasTradePassword: true, addresses: [] }))
        showToast(lang === 'zh' ? '设置成功' : 'Set successfully')
        setTradePwdNew('')
        setTradePwdConfirm('')
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '设置失败' : 'Operation failed'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const handleTradePwdEditSubmit = () => {
    if (tradePwdOld.length !== 6) {
      showToast(
        lang === 'zh' ? '请输入6位数字旧密码' : 'Please enter your current 6‑digit PIN',
        'error',
      )
      return
    }
    if (tradePwdNew.length !== 6) {
      showToast(
        lang === 'zh' ? '请输入6位数字新密码' : 'Please enter a new 6‑digit PIN',
        'error',
      )
      return
    }
    if (tradePwdConfirm.length !== 6) {
      showToast(
        lang === 'zh' ? '请再次输入6位数字新密码' : 'Please confirm your new 6‑digit PIN',
        'error',
      )
      return
    }
    if (tradePwdNew !== tradePwdConfirm) {
      showToast(
        lang === 'zh' ? '两次密码不一致' : 'The two PIN codes do not match',
        'error',
      )
      return
    }
    const uid = getAuthUserId()
    if (!uid) {
      showToast(lang === 'zh' ? '请先登录' : 'Please log in first', 'error')
      return
    }
    api.patch(`/api/users/${uid}`, { oldTradePassword: tradePwdOld, tradePassword: tradePwdNew })
      .then(() => {
        showToast(lang === 'zh' ? '修改成功' : 'PIN updated successfully')
        setTradePwdOld('')
        setTradePwdNew('')
        setTradePwdConfirm('')
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '修改失败' : 'Update failed'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  useEffect(() => {
    const t = searchParams.get('tab') as AccountNavKey | null
    if (t && VALID_TABS.includes(t)) setActiveKey(t)
  }, [searchParams])

  const handleSelect = (key: AccountNavKey) => {
    setActiveKey(key)
    setSearchParams(key === 'wallet' ? {} : { tab: key })
    if (key === 'settings') setSettingsView('list')
  }

  return (
    <div className="account-page">
      <div className="account-inner">
        <AccountSidebar activeKey={activeKey} onSelect={handleSelect} />

        <main className="account-main">
          {activeKey === 'wallet' && (() => {
            return (
            <section className="account-wallet">
              <div className="account-wallet-summary">
                <div className="account-wallet-balance-card">
                  <div className="account-wallet-balance-left">
                    <div className="account-wallet-balance-icon" aria-hidden="true">
                      <img src={walletIcon} alt="" className="account-wallet-balance-icon-img" />
                    </div>
                    <div className="account-wallet-balance-text">
                      <div className="account-wallet-balance-label">
                        {lang === 'zh' ? '账户余额 (USDT)' : 'Account balance (USDT)'}
                      </div>
                      <div className="account-wallet-balance-value">{walletBalance.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="account-wallet-balance-actions">
                    <button
                      type="button"
                      className="account-wallet-primary-btn"
                      onClick={() => navigate('/wallet/recharge')}
                    >
                      {lang === 'zh' ? '充值' : 'Recharge'}
                    </button>
                    <button
                      type="button"
                      className="account-wallet-secondary-btn"
                      onClick={() => navigate('/wallet/withdraw')}
                    >
                      {lang === 'zh' ? '提现' : 'Withdraw'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="account-wallet-history">
                <div className="account-wallet-history-header">
                  <div className="account-wallet-history-title">
                    {lang === 'zh' ? '钱包历史' : 'Wallet history'}
                  </div>
                  <div className="account-wallet-history-tabs">
                    <button
                      type="button"
                      className={`account-wallet-history-tab${walletHistoryTab === 'recharge' ? ' account-wallet-history-tab--active' : ''}`}
                      onClick={() => setWalletHistoryTab('recharge')}
                    >
                      {lang === 'zh' ? '充值' : 'Recharge'}
                    </button>
                    <button
                      type="button"
                      className={`account-wallet-history-tab${walletHistoryTab === 'withdraw' ? ' account-wallet-history-tab--active' : ''}`}
                      onClick={() => setWalletHistoryTab('withdraw')}
                    >
                      {lang === 'zh' ? '提现' : 'Withdraw'}
                    </button>
                  </div>
                </div>

                <div className="account-wallet-table-wrap">
                  <div className="account-wallet-table">
                  {walletHistoryTab === 'recharge' ? (
                    <>
                      <div className="account-wallet-table-head">
                        <span>{lang === 'zh' ? '日期' : 'Date'}</span>
                        <span>{lang === 'zh' ? '订单号' : 'Order No.'}</span>
                        <span>{lang === 'zh' ? '充值金额' : 'Recharge amount'}</span>
                        <span>{lang === 'zh' ? '币种/协议' : 'Currency / protocol'}</span>
                        <span>{lang === 'zh' ? '订单状态' : 'Status'}</span>
                        <span>{lang === 'zh' ? '交易号' : 'Transaction No.'}</span>
                        <span>{lang === 'zh' ? '实际到账' : 'Received amount'}</span>
                        <span>{lang === 'zh' ? '充值地址' : 'Recharge address'}</span>
                      </div>
                      <div className="account-wallet-table-body">
                        {rechargeRecords.length === 0 ? (
                          <div className="account-wallet-table-body--empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                            <span className="account-empty-text">
                              {lang === 'zh' ? '暂无数据' : 'No data'}
                            </span>
                          </div>
                        ) : (
                          rechargeRecords.map((r) => (
                            <div key={r.id} className="account-wallet-table-row">
                              <span>{formatRecordDate(r.createdAt)}</span>
                              <span>{r.orderNo}</span>
                              <span>{r.amount}</span>
                              <span>{r.currency}/{r.protocol}</span>
                              <span>
                                {lang === 'zh'
                                  ? (STATUS_TEXT[r.status] ?? r.status)
                                  : ({
                                      pending: 'Pending',
                                      approved: 'Approved',
                                      rejected: 'Rejected',
                                      completed: 'Completed',
                                      failed: 'Failed',
                                    }[r.status] ?? r.status)}
                              </span>
                              <span>{r.transactionNo ?? '—'}</span>
                              <span>{r.actualAmount}</span>
                              <span>{r.address}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="account-wallet-table-head account-wallet-table-head--withdraw">
                        <span>{lang === 'zh' ? '日期' : 'Date'}</span>
                        <span>{lang === 'zh' ? '订单号' : 'Order No.'}</span>
                        <span>{lang === 'zh' ? '提现金额' : 'Withdrawal amount'}</span>
                        <span>{lang === 'zh' ? '币种' : 'Currency'}</span>
                        <span>{lang === 'zh' ? '提现地址' : 'Withdrawal address'}</span>
                        <span>{lang === 'zh' ? '订单状态' : 'Status'}</span>
                      </div>
                      <div className="account-wallet-table-body">
                        {withdrawRecords.length === 0 ? (
                          <div className="account-wallet-table-body--empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                            <span className="account-empty-text">
                              {lang === 'zh' ? '暂无数据' : 'No data'}
                            </span>
                          </div>
                        ) : (
                          withdrawRecords.map((w) => (
                            <div key={w.id} className="account-wallet-table-row account-wallet-table-row--withdraw">
                              <span>{formatRecordDate(w.createdAt)}</span>
                              <span>{w.orderNo}</span>
                              <span>{w.amount}</span>
                              <span>{w.currency}</span>
                              <span>{w.address}</span>
                              <span>
                                {lang === 'zh'
                                  ? (STATUS_TEXT[w.status] ?? w.status)
                                  : ({
                                      pending: 'Pending',
                                      approved: 'Approved',
                                      rejected: 'Rejected',
                                      completed: 'Completed',
                                      failed: 'Failed',
                                    }[w.status] ?? w.status)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </div>
            </section>
            )
          })()}

          {activeKey === 'orders' && (() => {
            const DELIVERED_STATUSES: OrderStatus[] = ['outbound', 'transit', 'signed']
            const REFUND_STATUSES: OrderStatus[] = ['return_pending', 'returned', 'refund_pending', 'refunded']
            let filteredOrders: Order[] =
              orderTab === 'all'
                ? orderList
                : orderTab === 'delivered'
                  ? orderList.filter((o) => DELIVERED_STATUSES.includes(o.status))
                  : orderTab === 'refund'
                    ? orderList.filter((o) => REFUND_STATUSES.includes(o.status))
                    : orderList.filter((o) => o.status === orderTab)
            const cartPlaceholderAddress = {
              recipient: lang === 'zh' ? '请前往结算页选择' : 'Please choose on checkout page',
              email: '',
              phoneCode: '',
              phone: '',
              country: '',
              province: '',
              city: '',
              postal: '',
              detail: lang === 'zh' ? '请前往结算页选择收件地址' : 'Please choose the address on checkout page',
            }
            const cartAsOrder: Order | null = cartItems.length > 0
              ? {
                  id: '__cart__',
                  orderNumber: lang === 'zh' ? '购物车' : 'Cart',
                  status: 'pending',
                  items: cartItems as Order['items'],
                  address: cartPlaceholderAddress,
                  total: cartTotal,
                  createdAt: Date.now(),
                }
              : null
            if (cartAsOrder && (orderTab === 'all' || orderTab === 'pending')) {
              filteredOrders = [cartAsOrder, ...filteredOrders]
            }
            const orderTabs: { key: 'all' | OrderStatus | 'delivered' | 'refund'; label: string }[] = [
              { key: 'all', label: lang === 'zh' ? '全部' : 'All' },
              { key: 'pending', label: lang === 'zh' ? '待支付' : 'To pay' },
              { key: 'shipping', label: lang === 'zh' ? '待发货' : 'To ship' },
              { key: 'delivered', label: lang === 'zh' ? '待收货' : 'To receive' },
              { key: 'completed', label: lang === 'zh' ? '订单完成' : 'Completed' },
              { key: 'refund', label: lang === 'zh' ? '退款/售后' : 'Refund / After‑sales' },
              { key: 'cancelled', label: lang === 'zh' ? '已取消' : 'Cancelled' },
            ]
            const formatOrderDate = (ts: number) => {
              const d = new Date(ts)
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            }
            const handlePayOrder = (order: Order) => {
              if (order.id === '__cart__') {
                navigate('/checkout')
                return
              }
              replaceCart(order.items as CartItem[])
              navigate(`/checkout?orderId=${order.id}`)
            }
            const handleCancelOrder = (orderId: string) => {
              if (orderId === '__cart__') {
                clearCart()
                showToast(lang === 'zh' ? '已清空购物车' : 'Cart cleared')
                return
              }
              api
                .patch(`/api/orders/${encodeURIComponent(orderId)}`, { status: 'cancelled' })
                .then(() => {
                  setOrderList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } as Order : o)))
                  showToast(lang === 'zh' ? '订单已取消' : 'Order cancelled')
                })
                .catch((e: unknown) => {
                  const fallback = lang === 'zh' ? '取消订单失败' : 'Failed to cancel the order'
                  showToast(e instanceof Error ? e.message : fallback, 'error')
                })
            }

            const handleConfirmOrder = (orderId: string) => {
              if (orderId === '__cart__') return
              api
                .patch(`/api/orders/${encodeURIComponent(orderId)}`, { status: 'completed' })
                .then(() => {
                  setOrderList((prev) =>
                    prev.map((o) =>
                      o.id === orderId ? ({ ...o, status: 'completed' } as Order) : o,
                    ),
                  )
                  showToast(lang === 'zh' ? '已确认收货' : 'Order confirmed received')
                })
                .catch((e: unknown) => {
                  const fallback = lang === 'zh' ? '确认收货失败' : 'Failed to confirm receipt'
                  showToast(e instanceof Error ? e.message : fallback, 'error')
                })
            }

            const handleRequestReturn = (orderId: string) => {
              if (orderId === '__cart__') return
              api
                .patch(`/api/orders/${encodeURIComponent(orderId)}`, { status: 'return_pending' })
                .then(() => {
                  setOrderList((prev) =>
                    prev.map((o) =>
                      o.id === orderId ? ({ ...o, status: 'return_pending' } as Order) : o,
                    ),
                  )
                  showToast(lang === 'zh' ? '已提交退货申请' : 'Return request submitted')
                })
                .catch((e: unknown) => {
                  const fallback = lang === 'zh' ? '申请退货失败' : 'Failed to submit return request'
                  showToast(e instanceof Error ? e.message : fallback, 'error')
                })
            }
            return (
              <section className="account-orders">
                <h1 className="account-orders-title">
                  {lang === 'zh' ? '我的订单' : 'My orders'}
                </h1>
                <div className="account-orders-tabs">
                  {orderTabs.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`account-orders-tab${orderTab === key ? ' account-orders-tab--active' : ''}`}
                      onClick={() => setOrderTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {filteredOrders.length === 0 ? (
                  <div className="account-orders-empty">
                    <img
                      src={kongtai}
                      alt={lang === 'zh' ? '暂无订单' : 'No orders yet'}
                      className="account-empty-img"
                    />
                    <div className="account-empty-text">
                      {orderTab === 'all'
                        ? (lang === 'zh' ? '暂无订单' : 'No orders yet')
                        : lang === 'zh'
                          ? `暂无${orderTabs.find((t) => t.key === orderTab)?.label ?? ''}订单`
                          : 'No orders under this filter'}
                    </div>
                  </div>
                ) : (
                  <ul className="account-orders-list">
                    {filteredOrders.map((order) => (
                      <li key={order.id} className="account-order-card">
                        <div className="account-order-card-header">
                          <span className="account-order-card-no">
                            {order.id === '__cart__'
                              ? (lang === 'zh' ? '购物车' : 'Cart')
                              : (lang === 'zh'
                                ? `订单号：${order.orderNumber}`
                                : `Order No: ${order.orderNumber}`)}
                          </span>
                          {order.id !== '__cart__' && (
                            <span className="account-order-card-date">{formatOrderDate(order.createdAt)}</span>
                          )}
                          <span className={`account-order-card-status account-order-card-status--${order.status}`}>
                            {getOrderStatusLabel(order.status, lang)}
                          </span>
                        </div>
                        <div className="account-order-card-body">
                          <div className="account-order-card-items">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="account-order-card-item">
                                {item.image ? (
                                  <img src={item.image} alt="" className="account-order-card-item-img" />
                                ) : (
                                  <div className="account-order-card-item-placeholder" />
                                )}
                                <span className="account-order-card-item-title">{item.title}</span>
                                <span className="account-order-card-item-qty">×{item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <span className="account-order-card-more">等{order.items.length}件</span>
                            )}
                          </div>
                          <div className="account-order-card-summary">
                            <div className="account-order-card-addr">
                              {order.id === '__cart__'
                                ? (lang === 'zh'
                                  ? '请前往结算页选择收件地址'
                                  : 'Please choose the address on checkout page')
                                : `${order.address.recipient} ${order.address.phoneCode} ${order.address.phone} ${order.address.detail}`}
                            </div>
                            <div className="account-order-card-total">
                              {lang === 'zh' ? '合计：' : 'Total: '}
                              <strong>${order.total.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="account-order-card-actions">
                          {order.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="account-order-card-btn account-order-card-btn--primary"
                                onClick={() => handlePayOrder(order)}
                              >
                                {order.id === '__cart__'
                                  ? (lang === 'zh' ? '去结算' : 'Go to checkout')
                                  : (lang === 'zh' ? '去支付' : 'Pay now')}
                              </button>
                              <button
                                type="button"
                                className="account-order-card-btn account-order-card-btn--secondary"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                {order.id === '__cart__'
                                  ? (lang === 'zh' ? '清空购物车' : 'Clear cart')
                                  : (lang === 'zh' ? '取消订单' : 'Cancel order')}
                              </button>
                            </>
                          )}
                          {(order.status === 'shipping' || order.status === 'outbound' || order.status === 'transit') && (
                            <button type="button" className="account-order-card-btn account-order-card-btn--secondary">
                              {lang === 'zh' ? '查看物流' : 'Track shipment'}
                            </button>
                          )}
                          {order.status === 'signed' && (
                            <button
                              type="button"
                              className="account-order-card-btn account-order-card-btn--primary"
                              onClick={() => handleConfirmOrder(order.id)}
                            >
                              {lang === 'zh' ? '确认收货' : 'Confirm received'}
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <button
                              type="button"
                              className="account-order-card-btn account-order-card-btn--secondary"
                              onClick={() => handleRequestReturn(order.id)}
                            >
                              {lang === 'zh' ? '申请退货' : 'Request return'}
                            </button>
                          )}
                          {(order.status === 'return_pending' || order.status === 'returned' || order.status === 'refund_pending' || order.status === 'refunded') && (
                            <button type="button" className="account-order-card-btn account-order-card-btn--secondary">
                              {lang === 'zh' ? '查看详情' : 'View details'}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })()}

          {activeKey === 'productFavorites' && (
            <section className="account-fav-products">
              <header className="account-fav-products-header">
                <span className="account-fav-products-back" aria-hidden="true">
                  &lt;
                </span>
                <h1 className="account-fav-products-title">商品收藏</h1>
              </header>
              {productFavorites.length === 0 ? (
                <div className="account-fav-products-empty">
                  <img
                    src={kongtai}
                    alt={lang === 'zh' ? '暂无商品收藏' : 'No favorite products yet'}
                    className="account-empty-img"
                  />
                  <div className="account-empty-text">
                    {lang === 'zh' ? '暂无数据' : 'No data'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mall-product-grid account-fav-products-grid card-grid">
                    {productFavSlice.map((item) => (
                      <Link
                        key={String(item.id)}
                        to={`/products/${item.id}`}
                        className="product-card-link"
                      >
                        <ProductCard
                          id={item.id}
                          image={item.image}
                          price={item.price}
                          title={item.title}
                          subtitle={item.subtitle}
                          discount={item.discount}
                          shopId={item.shopId}
                        />
                      </Link>
                    ))}
                  </div>
                  {productFavTotalPages > 1 && (
                    <div className="account-fav-pagination">
                      <button
                        type="button"
                        className="account-fav-pagination-btn"
                        disabled={productFavPage <= 1}
                        onClick={() => setProductFavPage((p) => p - 1)}
                      >
                        {lang === 'zh' ? '上一页' : 'Previous'}
                      </button>
                      <span className="account-fav-pagination-info">
                        {lang === 'zh'
                          ? `第 ${productFavPage} / ${productFavTotalPages} 页`
                          : `Page ${productFavPage} / ${productFavTotalPages}`}
                      </span>
                      <button
                        type="button"
                        className="account-fav-pagination-btn"
                        disabled={productFavPage >= productFavTotalPages}
                        onClick={() => setProductFavPage((p) => p + 1)}
                      >
                        {lang === 'zh' ? '下一页' : 'Next'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeKey === 'shopFavorites' && (
            <section className="account-fav-shops">
              <header className="account-fav-shops-header">
                <span className="account-fav-shops-back" aria-hidden="true">
                  &lt;
                </span>
                <h1 className="account-fav-shops-title">
                  {lang === 'zh' ? '关注店铺' : 'Followed shops'}
                </h1>
              </header>
              {followedShops.length === 0 ? (
                <div className="account-fav-shops-empty">
                  <img
                    src={kongtai}
                    alt={lang === 'zh' ? '暂无关注店铺' : 'No followed shops yet'}
                    className="account-empty-img"
                  />
                  <div className="account-empty-text">
                    {lang === 'zh' ? '暂无数据' : 'No data'}
                  </div>
                </div>
              ) : (
                <>
                  <ul className="account-fav-shops-list">
                    {shopFavSlice.map((shop) => (
                      <li key={shop.id} className="account-fav-shops-item">
                        <Link to={`/shops/${shop.id}`} className="account-fav-shops-item-link">
                          <span className="account-fav-shops-item-avatar" aria-hidden="true">
                            {shop.logo ? (
                              <img src={shop.logo} alt="" className="account-fav-shops-item-avatar-img" />
                            ) : (
                              shop.name.charAt(0)
                            )}
                          </span>
                          <div className="account-fav-shops-item-info">
                            <span className="account-fav-shops-item-name">{shop.name}</span>
                            <span className="account-fav-shops-item-enter">
                              {lang === 'zh' ? '进入店铺' : 'Enter shop'}
                            </span>
                          </div>
                          <span className="account-fav-shops-item-arrow" aria-hidden="true">›</span>
                        </Link>
                        <button
                          type="button"
                          className="account-fav-shops-item-unfollow"
                          onClick={(e) => {
                            e.preventDefault()
                            const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
                            const u = raw ? (() => { try { return JSON.parse(raw) as { id?: string } } catch { return null } })() : null
                            if (u?.id) {
                              api.delete(`/api/users/${u.id}/followed-shops/${encodeURIComponent(shop.id)}`)
                                .then(() => {
                                  setFollowedShops((prev) => prev.filter((s) => s.id !== shop.id))
                                  showToast(lang === 'zh' ? '已取消关注' : 'Unfollowed')
                                })
                                .catch(() =>
                                  showToast(
                                    lang === 'zh' ? '操作失败' : 'Operation failed',
                                    'error',
                                  ),
                                )
                            }
                          }}
                        >
                          {lang === 'zh' ? '取消关注' : 'Unfollow'}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {shopFavTotalPages > 1 && (
                    <div className="account-fav-pagination">
                      <button
                        type="button"
                        className="account-fav-pagination-btn"
                        disabled={shopFavPage <= 1}
                        onClick={() => setShopFavPage((p) => p - 1)}
                      >
                        {lang === 'zh' ? '上一页' : 'Previous'}
                      </button>
                      <span className="account-fav-pagination-info">
                        {lang === 'zh'
                          ? `第 ${shopFavPage} / ${shopFavTotalPages} 页`
                          : `Page ${shopFavPage} / ${shopFavTotalPages}`}
                      </span>
                      <button
                        type="button"
                        className="account-fav-pagination-btn"
                        disabled={shopFavPage >= shopFavTotalPages}
                        onClick={() => setShopFavPage((p) => p + 1)}
                      >
                        {lang === 'zh' ? '下一页' : 'Next'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeKey === 'settings' && (
            <section className="account-settings">
              {settingsView === 'list' ? (
                <>
                  <h1 className="account-settings-title">
                    {lang === 'zh' ? '设置' : 'Settings'}
                  </h1>
                  <div className="account-settings-list">
                    <button
                      type="button"
                      className="account-settings-item"
                      onClick={() => setSettingsView('loginPwd')}
                    >
                      {lang === 'zh' ? '登录密码' : 'Login password'}
                    </button>
                    <button
                      type="button"
                      className="account-settings-item"
                      onClick={() => setSettingsView(settingsProfile?.hasTradePassword ? 'tradePwdEdit' : 'tradePwd')}
                    >
                      {lang === 'zh' ? '交易密码' : 'Payment PIN'}
                    </button>
                    <button
                      type="button"
                      className="account-settings-item"
                      onClick={() => setSettingsView('address')}
                    >
                      {lang === 'zh' ? '收件地址' : 'Shipping addresses'}
                    </button>
                    <button
                      type="button"
                      className="account-settings-item account-settings-item--danger"
                      onClick={() => {
                        try {
                          window.localStorage.removeItem('authUser')
                        } catch {}
                        setLogoutSuccessOpen(true)
                      }}
                    >
                      {lang === 'zh' ? '账号注销' : 'Log out'}
                    </button>
                  </div>
                </>
              ) : settingsView === 'address' ? (
                <>
                  <header className="account-address-header">
                    <button
                      type="button"
                      className="wallet-recharge-back"
                      aria-label={lang === 'zh' ? '返回' : 'Back'}
                      onClick={() => setSettingsView('list')}
                    >
                      &lt;
                    </button>
                    <h1 className="account-address-title">
                      {lang === 'zh' ? '收件地址' : 'Shipping addresses'}
                    </h1>
                    <button
                      type="button"
                      className="account-address-add-btn"
                      onClick={openAddressModalForNew}
                    >
                      <span className="account-address-add-icon" aria-hidden>+</span>
                      {lang === 'zh' ? '新增地址' : 'Add address'}
                    </button>
                  </header>
                  {addressList.length === 0 ? (
                    <div className="account-address-empty">
                      <img src={kongtai} alt="" className="account-empty-img" />
                      <div className="account-empty-text">
                        {lang === 'zh' ? '暂无数据' : 'No data'}
                      </div>
                    </div>
                  ) : (
                    <ul className="account-address-list">
                      {addressList.map((addr) => (
                        <li key={addr.id} className="account-address-card">
                          {addr.isDefault && (
                            <span className="account-address-default-badge">
                              {lang === 'zh' ? '默认' : 'Default'}
                            </span>
                          )}
                          <div className="account-address-card-body">
                            <p className="account-address-card-name">{addr.recipient}</p>
                            <p className="account-address-card-phone">{addr.phoneCode} {addr.phone}</p>
                            <p className="account-address-card-addr">
                              {getCountryLabel(addr.country)}
                              {addr.province && addr.province !== '_' && ` ${getRegionLabel(addr.country, addr.province)}`}
                              {addr.city && addr.city !== '_' && ` ${getCityLabel(addr.country, addr.province || '_', addr.city)}`}
                              {addr.detail && ` ${addr.detail}`}
                            </p>
                          </div>
                          <div className="account-address-card-actions">
                            <button
                              type="button"
                              className="account-address-card-btn"
                              onClick={() => openAddressModalForEdit(addr)}
                            >
                              {lang === 'zh' ? '编辑' : 'Edit'}
                            </button>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                className="account-address-card-btn"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                              >
                                {lang === 'zh' ? '设为默认' : 'Set as default'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="account-address-card-btn account-address-card-btn--danger"
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              {lang === 'zh' ? '删除' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <header className="account-settings-form-header">
                    <button
                      type="button"
                      className="account-settings-back"
                      aria-label={lang === 'zh' ? '返回' : 'Back'}
                      onClick={() => setSettingsView('list')}
                    >
                      &lt;
                    </button>
                    <h1 className="account-settings-form-title">
                      {settingsView === 'loginPwd'
                        ? (lang === 'zh' ? '修改登录密码' : 'Change login password')
                        : settingsView === 'tradePwdEdit'
                          ? (lang === 'zh' ? '修改交易密码' : 'Change payment PIN')
                          : (lang === 'zh' ? '交易密码设置' : 'Set payment PIN')}
                    </h1>
                  </header>
                  {settingsView === 'loginPwd' ? (
                    <div className="account-settings-form">
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '旧密码' : 'Current password'}
                        </label>
                        <div className={`account-settings-input-wrap${loginPwdErrors.old ? ' account-settings-input-wrap--error' : ''}`}>
                          <input
                            type={loginPwdShowOld ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={lang === 'zh' ? '请输入当前密码' : 'Please enter your current password'}
                            value={loginPwdOld}
                            onChange={(e) => {
                              setLoginPwdOld(e.target.value)
                              if (loginPwdErrors.old) setLoginPwdErrors((prev) => ({ ...prev, old: '' }))
                            }}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                loginPwdShowOld
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide password')
                                  : (lang === 'zh' ? '显示密码' : 'Show password')
                              }
                            onClick={() => setLoginPwdShowOld((v) => !v)}
                          >
                            {loginPwdShowOld ? (
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
                        <div className="login-error-slot">
                          {loginPwdErrors.old && <p className="login-error-text">{loginPwdErrors.old}</p>}
                        </div>
                      </div>
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '新密码' : 'New password'}
                        </label>
                        <div className={`account-settings-input-wrap${loginPwdErrors.new ? ' account-settings-input-wrap--error' : ''}`}>
                          <input
                            type={loginPwdShowNew ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请设置密码（6-22 位字母和数字组合）'
                                : '6–22 characters with letters and numbers'
                            }
                            value={loginPwdNew}
                            onChange={(e) => {
                              setLoginPwdNew(e.target.value)
                              if (loginPwdErrors.new) setLoginPwdErrors((prev) => ({ ...prev, new: '' }))
                            }}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                loginPwdShowNew
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide password')
                                  : (lang === 'zh' ? '显示密码' : 'Show password')
                              }
                            onClick={() => setLoginPwdShowNew((v) => !v)}
                          >
                            {loginPwdShowNew ? (
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
                        <div className="login-error-slot">
                          {loginPwdErrors.new && <p className="login-error-text">{loginPwdErrors.new}</p>}
                        </div>
                      </div>
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '确认密码' : 'Confirm password'}
                        </label>
                        <div className={`account-settings-input-wrap${loginPwdErrors.confirm ? ' account-settings-input-wrap--error' : ''}`}>
                          <input
                            type={loginPwdShowConfirm ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请再次输入密码'
                                : 'Please enter the password again'
                            }
                            value={loginPwdConfirm}
                            onChange={(e) => {
                              setLoginPwdConfirm(e.target.value)
                              if (loginPwdErrors.confirm) setLoginPwdErrors((prev) => ({ ...prev, confirm: '' }))
                            }}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                loginPwdShowConfirm
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide password')
                                  : (lang === 'zh' ? '显示密码' : 'Show password')
                              }
                            onClick={() => setLoginPwdShowConfirm((v) => !v)}
                          >
                            {loginPwdShowConfirm ? (
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
                        <div className="login-error-slot">
                          {loginPwdErrors.confirm && <p className="login-error-text">{loginPwdErrors.confirm}</p>}
                        </div>
                      </div>
                      <button type="button" className="account-settings-submit" onClick={handleLoginPwdSubmit}>
                        {lang === 'zh' ? '确认' : 'Confirm'}
                      </button>
                    </div>
                  ) : settingsView === 'tradePwdEdit' ? (
                    <div className="account-settings-form">
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '旧密码' : 'Current PIN'}
                        </label>
                        <div className="account-settings-input-wrap">
                          <input
                            type={tradePwdShowOld ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请输入6位数字旧密码'
                                : 'Please enter your current 6‑digit PIN'
                            }
                            value={tradePwdOld}
                            onChange={(e) => setTradePwdOld(restrictToSixDigits(e.target.value))}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                tradePwdShowOld
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                                  : (lang === 'zh' ? '显示密码' : 'Show PIN')
                              }
                            onClick={() => setTradePwdShowOld((v) => !v)}
                          >
                            {tradePwdShowOld ? (
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
                      </div>
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '新密码' : 'New PIN'}
                        </label>
                        <div className="account-settings-input-wrap">
                          <input
                            type={tradePwdShowNew ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请输入6位数字密码'
                                : 'Please enter a new 6‑digit PIN'
                            }
                            value={tradePwdNew}
                            onChange={(e) => setTradePwdNew(restrictToSixDigits(e.target.value))}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                tradePwdShowNew
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                                  : (lang === 'zh' ? '显示密码' : 'Show PIN')
                              }
                            onClick={() => setTradePwdShowNew((v) => !v)}
                          >
                            {tradePwdShowNew ? (
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
                      </div>
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '确认密码' : 'Confirm PIN'}
                        </label>
                        <div className="account-settings-input-wrap">
                          <input
                            type={tradePwdShowConfirm ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请再次输入6位数字密码'
                                : 'Please confirm the 6‑digit PIN'
                            }
                            value={tradePwdConfirm}
                            onChange={(e) => setTradePwdConfirm(restrictToSixDigits(e.target.value))}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                tradePwdShowConfirm
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                                  : (lang === 'zh' ? '显示密码' : 'Show PIN')
                              }
                            onClick={() => setTradePwdShowConfirm((v) => !v)}
                          >
                            {tradePwdShowConfirm ? (
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
                      </div>
                      <button type="button" className="account-settings-submit" onClick={handleTradePwdEditSubmit}>
                        {lang === 'zh' ? '确认' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <div className="account-settings-form">
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '新密码' : 'New PIN'}
                        </label>
                        <div className="account-settings-input-wrap">
                          <input
                            type={tradePwdShowNew ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请输入6位数字密码'
                                : 'Please enter a new 6‑digit PIN'
                            }
                            value={tradePwdNew}
                            onChange={(e) => setTradePwdNew(restrictToSixDigits(e.target.value))}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                tradePwdShowNew
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                                  : (lang === 'zh' ? '显示密码' : 'Show PIN')
                              }
                            onClick={() => setTradePwdShowNew((v) => !v)}
                          >
                            {tradePwdShowNew ? (
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
                      </div>
                      <div className="account-settings-field">
                        <label className="account-settings-label">
                          <span className="account-settings-required">*</span>
                          {lang === 'zh' ? '确认密码' : 'Confirm PIN'}
                        </label>
                        <div className="account-settings-input-wrap">
                          <input
                            type={tradePwdShowConfirm ? 'text' : 'password'}
                            className="account-settings-input"
                            placeholder={
                              lang === 'zh'
                                ? '请再次输入6位数字密码'
                                : 'Please confirm the 6‑digit PIN'
                            }
                            value={tradePwdConfirm}
                            onChange={(e) => setTradePwdConfirm(restrictToSixDigits(e.target.value))}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="account-settings-pwd-toggle"
                              aria-label={
                                tradePwdShowConfirm
                                  ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                                  : (lang === 'zh' ? '显示密码' : 'Show PIN')
                              }
                            onClick={() => setTradePwdShowConfirm((v) => !v)}
                          >
                            {tradePwdShowConfirm ? (
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
                      </div>
                      <button type="button" className="account-settings-submit" onClick={handleTradePwdSubmit}>
                        {lang === 'zh' ? '确定' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </main>

      </div>

      <AddressModal
        open={addressModalOpen}
        onClose={() => { setAddressModalOpen(false); setEditingAddressId(null) }}
        initialAddress={editingAddressId ? addressList.find((a) => a.id === editingAddressId) ?? null : null}
        onSuccess={handleAddressSuccess}
      />
      <LogoutSuccessModal
        open={logoutSuccessOpen}
        onClose={() => {
          setLogoutSuccessOpen(false)
          navigate('/')
        }}
      />
    </div>
  )
}

export default AccountCenter

