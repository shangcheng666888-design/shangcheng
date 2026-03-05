/** 规格属性名（英文/代码）→ 中文展示 */
const ATTR_KEY_ZH: Record<string, string> = {
  color: '颜色',
  colour: '颜色',
  size: '尺码',
  style: '款式',
  spec: '规格',
  weight: '重量',
  volume: '容量',
  quantity: '数量',
  package: '包装',
}

/** 规格属性值（英文）→ 中文展示，含常见配色词 */
const ATTR_VALUE_ZH: Record<string, string> = {
  red: '红色',
  blue: '蓝色',
  black: '黑色',
  white: '白色',
  green: '绿色',
  yellow: '黄色',
  gray: '灰色',
  grey: '灰色',
  pink: '粉色',
  purple: '紫色',
  orange: '橙色',
  brown: '棕色',
  gold: '金色',
  silver: '银色',
  navy: '藏青',
  beige: '米色',
  khaki: '卡其',
  cream: '米白',
  charcoal: '炭灰',
  coral: '珊瑚色',
  mint: '薄荷绿',
  lavender: '薰衣草紫',
  olive: '橄榄绿',
  maroon: '酒红',
  burgundy: '勃艮第红',
  // 常见品牌配色（运动鞋等）
  'core black': '深黑色',
  'cloud white': '云白色',
}

function attrKeyDisplay(key: string): string {
  const k = String(key).trim()
  if (!k) return ''
  return ATTR_KEY_ZH[k] ?? ATTR_KEY_ZH[k.toLowerCase()] ?? k
}

/** 翻译单个颜色/属性值 */
function translateValuePart(part: string): string {
  const p = part.trim()
  if (!p) return ''
  const lower = p.toLowerCase()
  return ATTR_VALUE_ZH[lower] ?? ATTR_VALUE_ZH[p] ?? p
}

/** 翻译属性值：支持复合值如 "White/Black/White" 分部分翻译 */
function attrValueDisplay(value: string, isColorAttr = false): string {
  const v = String(value).trim()
  if (!v) return v
  if (!isColorAttr) {
    const lower = v.toLowerCase()
    return ATTR_VALUE_ZH[lower] ?? ATTR_VALUE_ZH[v] ?? v
  }
  const parts = v.split(/\s*\/\s*/)
  const seen = new Set<string>()
  const translated: string[] = []
  for (const p of parts) {
    const t = translateValuePart(p)
    if (!t) continue
    if (seen.has(t)) continue
    seen.add(t)
    translated.push(t)
  }
  return translated.length > 0 ? translated.join(' · ') : v
}

/** 从对象中取可展示的属性值 */
function getItemValue(item: Record<string, unknown>): string | null {
  const raw =
    item.attrValueDisplay ??
    item.attrValueNameCn ??
    item.displayValue ??
    item.valueLabel ??
    item.attrValueName ??
    item.value
  if (raw == null) return null
  const s = String(raw).trim()
  return s || null
}

/** 解析出 [key, value] 数组，支持对象、数组两种格式 */
function parseToEntries(attrs: unknown): [string, string][] {
  if (attrs == null) return []

  // 先尝试解析字符串
  let parsed: unknown = attrs
  if (typeof attrs === 'string') {
    const s = attrs.trim()
    if (!s) return []
    try {
      parsed = JSON.parse(s)
    } catch {
      return fallbackExtractFromString(s)
    }
  }

  // 数组格式：[{attrName, attrValueName}, ...] 或 [{name, value}, ...]
  if (Array.isArray(parsed)) {
    const entries: [string, string][] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const obj = item as Record<string, unknown>
      const key = obj.attrName ?? obj.name ?? obj.key ?? obj.attrKey
      const val = getItemValue(obj) ?? obj.attrValueName ?? obj.value ?? obj.attrValue
      if (key != null && val != null && String(val).trim() !== '') {
        entries.push([String(key), String(val)])
      }
    }
    return entries
  }

  // 对象格式：{ key: value, ... }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return Object.entries(parsed as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
      .map(([k, v]): [string, string] => [k, String(v)])
      .filter(([, v]) => v.trim() !== '')
  }

  return []
}

/** 无法解析时，从字符串中尽量提取 "key":"value" 形式，去掉 JSON 符号 */
function fallbackExtractFromString(s: string): [string, string][] {
  const entries: [string, string][] = []
  // 匹配 "key":"value" 或 "key": "value" 或 'key':'value'
  const regex = /["']([^"']+)["']\s*:\s*["']([^"']*)["']/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(s)) !== null) {
    const key = m[1].trim()
    const val = (m[2] ?? '').trim()
    if (key && !/^[{}\[\],]$/.test(key)) {
      entries.push([key, val])
    }
  }
  if (entries.length > 0) return entries
  // 最后尝试：按逗号分割，每个部分取冒号前后
  const parts = s.split(/[,，]/)
  for (const p of parts) {
    const idx = p.indexOf(':')
    if (idx > 0) {
      const k = p.slice(0, idx).replace(/["{}\[\]]/g, '').trim()
      const v = p.slice(idx + 1).replace(/["{}\[\]]/g, '').trim()
      if (k && v) entries.push([k, v])
    }
  }
  return entries
}

/** 解析后的单条属性：用于结构化展示 */
export interface SkuAttrItem {
  label: string
  value: string
  rawValue: string
}

/** 判断是否为颜色属性（需转译颜色值为中文） */
function isColorAttr(key: string): boolean {
  const k = attrKeyDisplay(key)
  return k === '颜色'
}

/**
 * 解析 SKU attrs 为结构化数组（含原始值用于匹配）。
 * 颜色类属性值会转译为中文。
 */
export function getSkuAttrEntries(attrs: unknown): SkuAttrItem[] {
  const entries = parseToEntries(attrs)
  return entries
    .filter(([k, v]) => k && v && !/^[{}\[\]]+$/.test(k) && !/^[{}\[\]]+$/.test(v))
    .map(([k, v]) => ({
      label: attrKeyDisplay(k),
      value: attrValueDisplay(String(v), isColorAttr(k)),
      rawValue: String(v),
    }))
}

export interface SkuAttrOptionItem {
  raw: string
  display: string
  image?: string
}

/** 从每个 SKU 取一张图：cover_img / coverImg / images[0] */
function getOneImageFromSku(sku: {
  cover_img?: string | null
  coverImg?: string | null
  images?: string[] | null
}): string | undefined {
  const cover = sku.cover_img ?? sku.coverImg
  if (cover && typeof cover === 'string') return cover
  const arr = sku.images
  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0]
  return undefined
}

/**
 * 从 SKU 列表提取各属性的唯一选项：
 * - 每个 SKU 只贡献一张图（cover_img 或 images[0]）
 * - 颜色：同一颜色（仅尺码等不同）合并为一项，该项只展示一张图（取该颜色下第一个 SKU 的图）
 * - 尺码等：从 SKU 的 attrs 中提取并去重展示
 */
export function getAttrOptionsFromSkus(
  skus: Array<{
    attrs: unknown
    cover_img?: string | null
    coverImg?: string | null
    images?: string[] | null
  }>
): Array<{ label: string; options: SkuAttrOptionItem[] }> {
  const byLabel = new Map<string, Map<string, SkuAttrOptionItem>>()
  for (const sku of skus) {
    const items = getSkuAttrEntries(sku.attrs)
    const oneImage = getOneImageFromSku(sku)
    for (const { label, value, rawValue } of items) {
      if (!label || !rawValue) continue
      let opts = byLabel.get(label)
      if (!opts) {
        opts = new Map()
        byLabel.set(label, opts)
      }
      if (label === '颜色') {
        const parts = rawValue.split(/\s*\/\s*/)
        for (const p of parts) {
          const raw = p.trim()
          if (!raw) continue
          const display = translateValuePart(raw)
          if (!display) continue
          const key = display
          const existing = opts.get(key)
          if (!existing) {
            opts.set(key, { raw, display, image: oneImage })
          } else if (oneImage && !existing.image) {
            opts.set(key, { ...existing, image: oneImage })
          }
        }
      } else {
        const key = String(rawValue).trim()
        if (!key) continue
        if (!opts.has(key)) opts.set(key, { raw: rawValue, display: value })
      }
    }
  }
  const order = ['颜色', '尺码', '款式', '规格', '重量', '容量']
  const result: Array<{ label: string; options: SkuAttrOptionItem[] }> = []
  const seen = new Set<string>()
  for (const lbl of order) {
    const opts = byLabel.get(lbl)
    if (opts && !seen.has(lbl)) {
      seen.add(lbl)
      let optionsList = Array.from(opts.values())
      if (lbl === '颜色') {
        const byDisplay = new Map<string, SkuAttrOptionItem>()
        for (const opt of optionsList) {
          const d = (opt.display || '').trim()
          if (!d) continue
          if (!byDisplay.has(d)) {
            byDisplay.set(d, { raw: opt.raw, display: opt.display, image: opt.image ? String(opt.image) : undefined })
          }
        }
        optionsList = Array.from(byDisplay.values())
      }
      result.push({ label: lbl, options: optionsList })
    }
  }
  for (const [lbl, opts] of byLabel) {
    if (!seen.has(lbl)) {
      let optionsList = Array.from(opts.values())
      if (lbl === '颜色') {
        const byDisplay = new Map<string, SkuAttrOptionItem>()
        for (const opt of optionsList) {
          const d = (opt.display || '').trim()
          if (!d) continue
          if (!byDisplay.has(d)) {
            byDisplay.set(d, { raw: opt.raw, display: opt.display, image: opt.image ? String(opt.image) : undefined })
          }
        }
        optionsList = Array.from(byDisplay.values())
      }
      result.push({ label: lbl, options: optionsList })
    }
  }
  return result
}

/** 根据选中的属性值查找匹配的 SKU。颜色按「包含」匹配（选中的单一颜色在 SKU 配色中即可） */
export function findSkuByAttrs(
  skus: Array<{ attrs: unknown; sku_id: string; [k: string]: unknown }>,
  selected: Record<string, string>
): typeof skus[0] | null {
  if (Object.keys(selected).length === 0) return null
  for (const sku of skus) {
    const items = getSkuAttrEntries(sku.attrs)
    const attrsMap = Object.fromEntries(items.map((i) => [i.label, i.rawValue]))
    const match = Object.entries(selected).every(([k, v]) => {
      const skuVal = attrsMap[k]
      if (skuVal == null) return false
      if (k === '颜色') {
        const parts = String(skuVal).split(/\s*\/\s*/).map((s) => s.trim())
        const selectedDisplay = translateValuePart(v)
        return parts.some((part) => {
          const partLower = part.toLowerCase()
          const vLower = v.toLowerCase()
          if (partLower === vLower) return true
          if (translateValuePart(part) === selectedDisplay) return true
          return false
        })
      }
      return skuVal === v
    })
    if (match) return sku
  }
  return null
}

/**
 * 将 SKU attrs 转为单行文案（用于购物车等）。
 * 使用 · 分隔各属性，避免与颜色值中的 / 混淆。
 */
export function formatSkuAttrsDisplay(attrs: unknown): string {
  const items = getSkuAttrEntries(attrs)
  if (items.length === 0) return ''
  return items.map(({ label, value }) => `${label}: ${value}`).join(' · ')
}
