const STORAGE_KEY = 'productFavorites'

export interface FavProduct {
  id: number | string
  image: string
  price: string
  title: string
  subtitle: string
  discount?: string
  /** 店铺 ID，收藏时一并保存便于加购 */
  shopId?: string
}

function isFavProduct(x: unknown): x is FavProduct {
  return (
    typeof x === 'object' &&
    x !== null &&
    'id' in x &&
    'image' in x &&
    'price' in x &&
    'title' in x &&
    'subtitle' in x
  )
}

export function getProductFavorites(): FavProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    return Array.isArray(list) ? list.filter(isFavProduct) : []
  } catch {
    return []
  }
}

function setProductFavorites(list: FavProduct[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export function isProductFavorited(id: number | string): boolean {
  return getProductFavorites().some((p) => String(p.id) === String(id))
}

export function addProductFavorite(product: FavProduct): void {
  const list = getProductFavorites()
  const idStr = String(product.id)
  if (list.some((p) => String(p.id) === idStr)) return
  setProductFavorites([...list, { ...product }])
}

export function removeProductFavorite(id: number | string): void {
  const idStr = String(id)
  setProductFavorites(getProductFavorites().filter((p) => String(p.id) !== idStr))
}

export function toggleProductFavorite(product: FavProduct): boolean {
  const idStr = String(product.id)
  const list = getProductFavorites()
  const exists = list.some((p) => String(p.id) === idStr)
  if (exists) {
    setProductFavorites(list.filter((p) => String(p.id) !== idStr))
    return false
  }
  setProductFavorites([...list, { ...product }])
  return true
}
