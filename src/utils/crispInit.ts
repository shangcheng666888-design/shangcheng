/**
 * 登录/注册成功后同步当前用户信息到 Crisp，便于客服识别。
 */
export function updateCrispUser(): void {
  if (typeof window === 'undefined') return
  const crisp = (window as Window & { $crisp?: { push: (cmd: unknown[]) => void } }).$crisp
  if (!crisp || typeof crisp.push !== 'function') return
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return
    const user = JSON.parse(raw) as { id?: string; account?: string; value?: string; email?: string }
    const email = user.email ?? user.account ?? user.value
    const nickname = user.account ?? user.value ?? user.id
    if (email) crisp.push(['set', 'user:email', [email]])
    if (nickname) crisp.push(['set', 'user:nickname', [String(nickname)]])
  } catch {
    // ignore
  }
}
