import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { formatDateTime } from '../../utils/datetime'
import { useToast } from '../../components/ToastProvider'

type UserStatus = 'normal' | 'disabled'

/** 管理后台展示用收件地址（与账户中心结构一致） */
interface UserAddress {
  id: string
  recipient: string
  phoneCode: string
  phone: string
  country: string
  province: string
  city: string
  postal: string
  detail: string
  isDefault: boolean
}

/** 用户仅通过手机或邮箱其一注册，登录账号二选一 */
interface MallUser {
  id: string
  /** 登录账号：手机或邮箱，注册时只填其一 */
  loginAccount: string
  /** 登录密码（管理后台展示用） */
  loginPassword?: string
  /** 交易密码（管理后台展示用，未设置可为空） */
  tradePassword?: string
  /** 商城账户余额（元） */
  balance: number
  /** 是否为机器人账号（系统自动创建） */
  isBot: boolean
  /** 是否已开通店铺 */
  hasShop: boolean
  /** 店铺 ID（已开通时可选，用于跳转） */
  shopId?: string
  avatar: string | null
  registeredAt: string
  status: UserStatus
  /** 该用户的收件地址列表 */
  addresses?: UserAddress[]
}

const PAGE_SIZE = 30

function cloneUser(u: MallUser): MallUser {
  return {
    ...u,
    addresses: (u.addresses || []).map((a) => ({ ...a })),
  }
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<MallUser[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detailUser, setDetailUser] = useState<MallUser | null>(null)
  const [editForm, setEditForm] = useState<MallUser | null>(null)
  const { showToast } = useToast()

  const PAGE_SIZE_NUMBER = PAGE_SIZE

  const formatTime = (iso: string) => formatDateTime(iso)

  const normalizeAddress = (a: unknown): UserAddress | null => {
    if (!a || typeof a !== 'object') return null
    const o = a as Record<string, unknown>
    return {
      id: typeof o.id === 'string' ? o.id : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      recipient: typeof o.recipient === 'string' ? o.recipient : '',
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

  const fetchUsers = useCallback(
    async (mode: 'normal' | 'silent' = 'normal') => {
      if (mode === 'normal') setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(PAGE_SIZE_NUMBER))
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (search.trim()) params.set('search', search.trim())
        const res = await api.get<{
          list: Array<{
            id: string
            account: string
            balance: number
            shopId: string | null
            isBot: boolean
            createdAt: string
            status: 'normal' | 'disabled'
          }>
          total: number
        }>(`/api/users?${params.toString()}`)
        const list = (res.list ?? []).map((u) => ({
          id: u.id,
          loginAccount: u.account,
          loginPassword: undefined,
          tradePassword: undefined,
          balance: u.balance ?? 0,
          isBot: !!u.isBot,
          hasShop: !!u.shopId,
          shopId: u.shopId ?? undefined,
          avatar: null,
          registeredAt: formatTime((u as any).createdAt ?? ''),
          status: (u.status ?? 'normal') as UserStatus,
          addresses: [],
        }))
        setUsers(list)
        setTotal(res.total ?? list.length)
      } catch (e) {
        if (mode === 'normal') {
          showToast(e instanceof Error ? e.message : '加载用户列表失败', 'error')
          setUsers([])
          setTotal(0)
        }
        // 静默轮询出错时不打断当前界面，也不打扰用户
      } finally {
        if (mode === 'normal') setLoading(false)
      }
    },
    [PAGE_SIZE_NUMBER, formatTime, page, search, statusFilter, showToast],
  )

  useEffect(() => {
    fetchUsers('normal')
  }, [fetchUsers])

  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // 页面重新可见时做一次静默刷新
        fetchUsers('silent')
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
    const timer = window.setInterval(() => {
      // 静默轮询：仅在列表视图空闲时后台刷新，不显示 loading，不弹错误
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (detailUser || editForm) return
      void fetchUsers('silent')
    }, 10000)
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [detailUser, editForm, fetchUsers])

  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / PAGE_SIZE_NUMBER))

  const openDetail = async (u: MallUser) => {
    try {
      const res = await api.get<{
        id: string
        account: string
        balance: number
        password?: string
        tradePassword?: string
        hasTradePassword?: boolean
        addresses?: unknown[]
        shopId?: string | null
        isBot?: boolean
        status?: 'normal' | 'disabled'
        createdAt?: string
      }>(`/api/users/${encodeURIComponent(u.id)}`)
      const addrs = (res.addresses ?? []).map((a) => normalizeAddress(a)).filter((a): a is UserAddress => a !== null)
      const detail: MallUser = {
        id: res.id,
        loginAccount: res.account,
        loginPassword: res.password,
        tradePassword: res.tradePassword,
        balance: res.balance ?? u.balance,
        isBot: res.isBot ?? u.isBot ?? false,
        hasShop: !!res.shopId,
        shopId: res.shopId ?? undefined,
        avatar: null,
        registeredAt: formatTime(res.createdAt ?? ''),
        status: (res.status ?? u.status ?? 'normal') as UserStatus,
        addresses: addrs,
      }
      setDetailUser(detail)
      setEditForm(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '加载用户详情失败', 'error')
    }
  }

  const startEdit = () => {
    if (detailUser) setEditForm(cloneUser(detailUser))
  }

  const cancelEdit = () => {
    setEditForm(null)
  }

  const saveEdit = async () => {
    if (!editForm) return
    const payload: Record<string, unknown> = {
      fromAdmin: true,
      balance: editForm.balance,
      addresses: (editForm.addresses ?? []).map((a) => ({
        id: a.id,
        recipient: a.recipient,
        phoneCode: a.phoneCode,
        phone: a.phone,
        country: a.country,
        province: a.province,
        city: a.city,
        postal: a.postal,
        detail: a.detail,
        isDefault: a.isDefault,
      })),
      shopId: editForm.hasShop ? (editForm.shopId || null) : null,
    }
    if (editForm.loginPassword && editForm.loginPassword.trim()) {
      payload.password = editForm.loginPassword
    }
    if (editForm.tradePassword !== undefined) {
      payload.tradePassword = editForm.tradePassword || ''
    }
    try {
      await api.patch(`/api/users/${encodeURIComponent(editForm.id)}`, payload)
      const updated = { ...editForm, addresses: editForm.addresses?.map((a) => ({ ...a })) ?? [] }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? {
                ...u,
                balance: updated.balance,
                hasShop: updated.hasShop,
                shopId: updated.shopId,
              }
            : u
        )
      )
      setDetailUser(updated)
      setEditForm(null)
      showToast('保存成功')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败', 'error')
    }
  }

  const updateEditForm = (patch: Partial<MallUser>) => {
    setEditForm((prev) => (prev ? { ...prev, ...patch } : null))
  }

  const updateEditAddress = (index: number, patch: Partial<UserAddress>) => {
    setEditForm((prev) => {
      if (!prev) return null
      const next = [...(prev.addresses || [])]
      next[index] = { ...next[index], ...patch }
      return { ...prev, addresses: next }
    })
  }

  const addEditAddress = () => {
    setEditForm((prev) => {
      if (!prev) return null
      const newAddr: UserAddress = {
        id: `A-${Date.now()}`,
        recipient: '',
        phoneCode: '+86',
        phone: '',
        country: '',
        province: '',
        city: '',
        postal: '',
        detail: '',
        isDefault: (prev.addresses?.length ?? 0) === 0,
      }
      return { ...prev, addresses: [...(prev.addresses || []), newAddr] }
    })
  }

  const removeEditAddress = (index: number) => {
    setEditForm((prev) => {
      if (!prev || !prev.addresses) return prev
      return { ...prev, addresses: prev.addresses.filter((_, i) => i !== index) }
    })
  }

  const displayUser = editForm ?? detailUser

  return (
    <div className="admin-users">
      <header className="admin-users-header">
        <h2 className="admin-users-title">商城用户</h2>
        <p className="admin-users-desc">
          仅管理在商城注册的买家账号（购物用户），不含入驻开店商家。可查询、禁用/恢复账号。
        </p>
      </header>

      <section className="admin-users-toolbar">
        <div className="admin-users-search-wrap">
          <span className="admin-users-search-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            className="admin-users-search"
            placeholder="用户ID / 登录账号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-users-filters">
          <button
            type="button"
            className={`admin-users-filter-btn${statusFilter === 'all' ? ' admin-users-filter-btn--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            全部
          </button>
          <button
            type="button"
            className={`admin-users-filter-btn${statusFilter === 'normal' ? ' admin-users-filter-btn--active' : ''}`}
            onClick={() => setStatusFilter('normal')}
          >
            正常
          </button>
          <button
            type="button"
            className={`admin-users-filter-btn${statusFilter === 'disabled' ? ' admin-users-filter-btn--active' : ''}`}
            onClick={() => setStatusFilter('disabled')}
          >
            已禁用
          </button>
        </div>
      </section>

      <section className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>用户 ID</th>
              <th>登录账号（手机/邮箱）</th>
              <th>类型</th>
              <th>账户余额</th>
              <th>店铺</th>
              <th>注册时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-users-empty">
                  加载中…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-users-empty">
                  暂无符合条件的用户
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td><code className="admin-users-id">{u.id}</code></td>
                  <td>{u.loginAccount}</td>
                  <td>
                    <span className="admin-users-type">
                      {u.isBot ? '机器人' : '普通用户'}
                    </span>
                  </td>
                  <td><span className="admin-users-balance">¥{u.balance.toFixed(2)}</span></td>
                  <td>
                    <span className={`admin-users-shop admin-users-shop--${u.hasShop ? 'yes' : 'no'}`}>
                      {u.hasShop ? (u.shopId ? '已开通' : '已开通') : '未开通'}
                    </span>
                    {u.hasShop && u.shopId && (
                      <Link to={`/admin/shops?shop=${u.shopId}`} className="admin-users-shop-link">查看店铺</Link>
                    )}
                  </td>
                  <td>{u.registeredAt}</td>
                  <td>
                    <span className={`admin-users-status admin-users-status--${u.status}`}>
                      {u.status === 'normal' ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="admin-users-action" onClick={() => openDetail(u)}>查看</button>
                    {u.status === 'normal' ? (
                      <button
                        type="button"
                        className="admin-users-action admin-users-action--warn"
                        onClick={async () => {
                          try {
                            await api.patch(`/api/users/${encodeURIComponent(u.id)}`, { status: 'disabled' })
                            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: 'disabled' } : x)))
                            if (detailUser?.id === u.id) setDetailUser({ ...(detailUser as MallUser), status: 'disabled' })
                            showToast('已禁用账号')
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : '禁用失败', 'error')
                          }
                        }}
                      >
                        禁用
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-users-action"
                        onClick={async () => {
                          try {
                            await api.patch(`/api/users/${encodeURIComponent(u.id)}`, { status: 'normal' })
                            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: 'normal' } : x)))
                            if (detailUser?.id === u.id) setDetailUser({ ...(detailUser as MallUser), status: 'normal' })
                            showToast('已恢复账号')
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : '恢复失败', 'error')
                          }
                        }}
                      >
                        恢复
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {detailUser && (
        <>
          <div
            className="admin-users-drawer-overlay"
            onClick={() => { setDetailUser(null); setEditForm(null) }}
            role="presentation"
            aria-hidden="true"
          />
          <div
            className="admin-users-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-users-drawer-title"
          >
            <div className="admin-users-drawer-head">
              <h2 id="admin-users-drawer-title" className="admin-users-drawer-title">
                {editForm ? '编辑用户' : '用户详情'}
              </h2>
              <button
                type="button"
                className="admin-users-drawer-close"
                onClick={() => { setDetailUser(null); setEditForm(null) }}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="admin-users-drawer-body">
              {editForm ? (
                <>
                  <div className="admin-users-edit-form">
                    <div className="admin-users-edit-row">
                      <label className="admin-users-edit-label">用户 ID</label>
                      <span className="admin-users-edit-readonly">{editForm.id}</span>
                    </div>
                    <div className="admin-users-edit-row">
                      <label className="admin-users-edit-label">登录账号（手机/邮箱）</label>
                      <span className="admin-users-edit-readonly">{editForm.loginAccount}</span>
                    </div>
                    <div className="admin-users-edit-row">
                      <label className="admin-users-edit-label">登录密码</label>
                      <input
                        type="text"
                        className="admin-users-edit-input"
                        value={editForm.loginPassword ?? ''}
                        onChange={(e) => updateEditForm({ loginPassword: e.target.value || undefined })}
                        placeholder="留空表示不修改"
                      />
                    </div>
                    <div className="admin-users-edit-row">
                      <label className="admin-users-edit-label">交易密码</label>
                      <input
                        type="text"
                        className="admin-users-edit-input"
                        value={editForm.tradePassword ?? ''}
                        onChange={(e) => updateEditForm({ tradePassword: e.target.value || undefined })}
                        placeholder="留空表示未设置"
                      />
                    </div>
                    <div className="admin-users-edit-row">
                      <label className="admin-users-edit-label">账户余额（元）</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="admin-users-edit-input"
                        value={editForm.balance}
                        onChange={(e) => updateEditForm({ balance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="admin-users-edit-row">
                      <label className="admin-users-edit-label">店铺开通状态</label>
                      <label className="admin-users-edit-check-wrap">
                        <input
                          type="checkbox"
                          checked={editForm.hasShop}
                          onChange={(e) => updateEditForm({ hasShop: e.target.checked, shopId: e.target.checked ? (editForm.shopId || '') : undefined })}
                        />
                        <span>已开通店铺</span>
                      </label>
                      {editForm.hasShop && (
                        <input
                          type="text"
                          className="admin-users-edit-input admin-users-edit-shop-id"
                          value={editForm.shopId ?? ''}
                          onChange={(e) => updateEditForm({ shopId: e.target.value || undefined })}
                          placeholder="店铺 ID"
                        />
                      )}
                    </div>
                  </div>
                  <section className="admin-users-drawer-addresses">
                    <div className="admin-users-drawer-addresses-head">
                      <h3 className="admin-users-drawer-addresses-title">收件地址</h3>
                      <button type="button" className="admin-users-edit-add-addr" onClick={addEditAddress}>+ 添加地址</button>
                    </div>
                    {(!editForm.addresses || editForm.addresses.length === 0) ? (
                      <p className="admin-users-drawer-addresses-empty">暂无收件地址，可点击上方添加</p>
                    ) : (
                      <ul className="admin-users-edit-address-list">
                        {editForm.addresses.map((addr, idx) => (
                          <li key={addr.id} className="admin-users-edit-address-card">
                            <div className="admin-users-edit-address-fields">
                              <input
                                type="text"
                                className="admin-users-edit-input admin-users-edit-addr-field"
                                placeholder="收件人"
                                value={addr.recipient}
                                onChange={(e) => updateEditAddress(idx, { recipient: e.target.value })}
                              />
                              <div className="admin-users-edit-addr-row">
                                <input
                                  type="text"
                                  className="admin-users-edit-input admin-users-edit-addr-short"
                                  placeholder="区号"
                                  value={addr.phoneCode}
                                  onChange={(e) => updateEditAddress(idx, { phoneCode: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="admin-users-edit-input admin-users-edit-addr-phone"
                                  placeholder="手机号"
                                  value={addr.phone}
                                  onChange={(e) => updateEditAddress(idx, { phone: e.target.value })}
                                />
                              </div>
                              <input
                                type="text"
                                className="admin-users-edit-input admin-users-edit-addr-field"
                                placeholder="国家"
                                value={addr.country}
                                onChange={(e) => updateEditAddress(idx, { country: e.target.value })}
                              />
                              <div className="admin-users-edit-addr-row">
                                <input
                                  type="text"
                                  className="admin-users-edit-input admin-users-edit-addr-short"
                                  placeholder="省/州"
                                  value={addr.province}
                                  onChange={(e) => updateEditAddress(idx, { province: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="admin-users-edit-input admin-users-edit-addr-field"
                                  placeholder="城市"
                                  value={addr.city}
                                  onChange={(e) => updateEditAddress(idx, { city: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="admin-users-edit-input admin-users-edit-addr-short"
                                  placeholder="邮编"
                                  value={addr.postal}
                                  onChange={(e) => updateEditAddress(idx, { postal: e.target.value })}
                                />
                              </div>
                              <input
                                type="text"
                                className="admin-users-edit-input admin-users-edit-addr-field"
                                placeholder="详细地址"
                                value={addr.detail}
                                onChange={(e) => updateEditAddress(idx, { detail: e.target.value })}
                              />
                              <label className="admin-users-edit-check-wrap">
                                <input
                                  type="checkbox"
                                  checked={addr.isDefault}
                                  onChange={(_e) => {
                                    const next = (editForm.addresses || []).map((a, i) =>
                                      i === idx ? { ...a, isDefault: true } : { ...a, isDefault: false }
                                    )
                                    setEditForm((prev) => prev ? { ...prev, addresses: next } : null)
                                  }}
                                />
                                <span>默认地址</span>
                              </label>
                            </div>
                            <button type="button" className="admin-users-edit-addr-remove" onClick={() => removeEditAddress(idx)}>删除</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <div className="admin-users-drawer-actions">
                    <button type="button" className="admin-users-drawer-btn" onClick={saveEdit}>保存</button>
                    <button type="button" className="admin-users-drawer-btn admin-users-drawer-btn--secondary" onClick={cancelEdit}>取消</button>
                  </div>
                </>
              ) : (
                <>
                  <dl className="admin-users-detail-list">
                    <div className="admin-users-detail-row">
                      <dt>用户 ID</dt>
                      <dd><code className="admin-users-id">{displayUser!.id}</code></dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>登录账号（手机/邮箱）</dt>
                      <dd>{displayUser!.loginAccount}</dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>登录密码</dt>
                      <dd className="admin-users-detail-password">{displayUser!.loginPassword ?? '未设置'}</dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>交易密码</dt>
                      <dd className="admin-users-detail-password">{displayUser!.tradePassword ?? '未设置'}</dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>账户余额</dt>
                      <dd><span className="admin-users-balance">¥{displayUser!.balance.toFixed(2)}</span></dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>账号类型</dt>
                      <dd>{displayUser!.isBot ? '机器人账号' : '普通用户'}</dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>店铺</dt>
                      <dd>
                        {displayUser!.hasShop ? (
                          <>
                            <span className="admin-users-shop admin-users-shop--yes">已开通</span>
                            {displayUser!.shopId && (
                              <Link to={`/admin/shops?shop=${displayUser!.shopId}`} className="admin-users-shop-link" onClick={() => { setDetailUser(null); setEditForm(null) }}>查看店铺</Link>
                            )}
                          </>
                        ) : (
                          <span className="admin-users-shop admin-users-shop--no">未开通</span>
                        )}
                      </dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>注册时间</dt>
                      <dd>{displayUser!.registeredAt}</dd>
                    </div>
                    <div className="admin-users-detail-row">
                      <dt>账号状态</dt>
                      <dd>
                        <span className={`admin-users-status admin-users-status--${displayUser!.status}`}>
                          {displayUser!.status === 'normal' ? '正常' : '已禁用'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <section className="admin-users-drawer-addresses">
                    <h3 className="admin-users-drawer-addresses-title">收件地址</h3>
                    {!displayUser!.addresses || displayUser!.addresses.length === 0 ? (
                      <p className="admin-users-drawer-addresses-empty">暂无收件地址</p>
                    ) : (
                      <ul className="admin-users-drawer-address-list">
                        {displayUser!.addresses.map((addr) => (
                          <li key={addr.id} className="admin-users-drawer-address-card">
                            {addr.isDefault && <span className="admin-users-drawer-address-default">默认</span>}
                            <p className="admin-users-drawer-address-recipient">{addr.recipient}</p>
                            <p className="admin-users-drawer-address-phone">{addr.phoneCode} {addr.phone}</p>
                            <p className="admin-users-drawer-address-detail">
                              {[addr.country, addr.province, addr.city].filter(Boolean).join(' ')}{addr.postal ? ` ${addr.postal}` : ''} {addr.detail}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <div className="admin-users-drawer-actions">
                    {displayUser!.status === 'normal' ? (
                      <button
                        type="button"
                        className="admin-users-drawer-btn admin-users-drawer-btn--warn"
                        onClick={async () => {
                          try {
                            await api.patch(`/api/users/${encodeURIComponent(displayUser!.id)}`, { status: 'disabled' })
                            setUsers((prev) => prev.map((x) => (x.id === displayUser!.id ? { ...x, status: 'disabled' } : x)))
                            setDetailUser((prev) => (prev ? { ...prev, status: 'disabled' } : prev))
                            showToast('已禁用账号')
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : '禁用失败', 'error')
                          }
                        }}
                      >
                        禁用账号
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-users-drawer-btn"
                        onClick={async () => {
                          try {
                            await api.patch(`/api/users/${encodeURIComponent(displayUser!.id)}`, { status: 'normal' })
                            setUsers((prev) => prev.map((x) => (x.id === displayUser!.id ? { ...x, status: 'normal' } : x)))
                            setDetailUser((prev) => (prev ? { ...prev, status: 'normal' } : prev))
                            showToast('已恢复账号')
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : '恢复失败', 'error')
                          }
                        }}
                      >
                        恢复账号
                      </button>
                    )}
                    <button type="button" className="admin-users-drawer-btn admin-users-drawer-btn--secondary" onClick={startEdit}>编辑</button>
                    <button type="button" className="admin-users-drawer-btn admin-users-drawer-btn--secondary" onClick={() => { setDetailUser(null); setEditForm(null) }}>关闭</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="admin-users-pagination">
          <button
            type="button"
            className="admin-users-page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </button>
          <span className="admin-users-page-info">
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <button
            type="button"
            className="admin-users-page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
