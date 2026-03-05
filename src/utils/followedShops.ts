const STORAGE_KEY = 'followedShops'

export interface FollowedShop {
  id: string
  name: string
  logo?: string | null
}

export function getFollowedShops(): FollowedShop[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    return Array.isArray(list) ? list.filter(isFollowedShop) : []
  } catch {
    return []
  }
}

function isFollowedShop(x: unknown): x is FollowedShop {
  return (
    typeof x === 'object' &&
    x !== null &&
    'id' in x &&
    'name' in x &&
    typeof (x as FollowedShop).id === 'string' &&
    typeof (x as FollowedShop).name === 'string'
  )
}

export function setFollowedShops(list: FollowedShop[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export function isShopFollowed(shopId: string): boolean {
  return getFollowedShops().some((s) => s.id === shopId)
}

export function followShop(shopId: string, shopName: string): void {
  const list = getFollowedShops()
  if (list.some((s) => s.id === shopId)) return
  setFollowedShops([...list, { id: shopId, name: shopName }])
}

export function unfollowShop(shopId: string): void {
  setFollowedShops(getFollowedShops().filter((s) => s.id !== shopId))
}
