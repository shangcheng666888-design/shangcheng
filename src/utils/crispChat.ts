declare global {
  interface Window {
    $crisp?: { push: (cmd: unknown[]) => void }
  }
}

export interface CrispChatOptions {
  /** 店铺名称，会传给 Crisp 会话数据，客服端可见 */
  shopName?: string
  /** 店铺 ID，会传给 Crisp 会话数据，客服端可见 */
  shopId?: string
}

/**
 * 打开 Crisp 客服聊天窗口（配合自定义客服图标使用，默认 Crisp 按钮已在 index.html 中隐藏）。
 * 传入 options.shopName / options.shopId 时，会写入 Crisp 的 session:data，客服在会话中可看到「来自哪家店铺」。
 */
export function openCrispChat(options?: CrispChatOptions): void {
  if (typeof window === 'undefined') return
  const crisp = window.$crisp
  if (!crisp || typeof crisp.push !== 'function') return

  if (options?.shopName != null || options?.shopId != null) {
    const shopName = options.shopName != null ? String(options.shopName).trim() : ''
    const shopId = options.shopId != null ? String(options.shopId).trim() : ''
    if (shopName) {
      // 对话列表左侧显示的昵称设为店铺名，不再显示 visitor2
      crisp.push(['set', 'user:nickname', [shopName]])
    }
    const data: [string, string][] = []
    if (shopName) data.push(['shop_name', shopName])
    if (shopId) data.push(['shop_id', shopId])
    if (data.length > 0) {
      crisp.push(['set', 'session:data', [data]])
    }
  }

  crisp.push(['do', 'chat:show'])
  setTimeout(() => {
    if (window.$crisp && typeof window.$crisp.push === 'function') {
      window.$crisp.push(['do', 'chat:open'])
    }
  }, 100)
}
