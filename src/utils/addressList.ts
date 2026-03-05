/** 收件地址项，与账户中心、下单页共用 */
export type AddressItem = {
  id: string
  recipient: string
  email: string
  phoneCode: string
  phone: string
  country: string
  province: string
  city: string
  postal: string
  detail: string
  isDefault: boolean
}

export const ADDRESS_LIST_KEY = 'accountAddressList'

export function loadAddressList(): AddressItem[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(ADDRESS_LIST_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as AddressItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveAddressList(list: AddressItem[]) {
  try {
    window.localStorage.setItem(ADDRESS_LIST_KEY, JSON.stringify(list))
  } catch {}
}
