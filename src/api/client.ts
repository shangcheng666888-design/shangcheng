/**
 * 前端请求后端 API 的封装，统一 baseURL 与错误处理。
 * 访问 /api/admin/*（除登录外）时自动附加管理员 Bearer token。
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  if (import.meta.env.DEV) return 'http://localhost:3001'
  return ''
}

export const apiBase = getBaseUrl()

const ADMIN_AUTH_KEY = 'adminAuth'

/** 从 localStorage 读取管理员 token，用于请求头鉴权 */
export function getAdminToken(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_AUTH_KEY) : null
    if (!raw) return null
    const data = JSON.parse(raw) as { token?: string }
    return (data?.token && typeof data.token === 'string') ? data.token : null
  } catch {
    return null
  }
}

export interface ApiRes<T = unknown> {
  success?: boolean
  message?: string
  [key: string]: T | boolean | string | undefined
}

/** 是否为需要携带 admin token 的请求（排除登录接口） */
function isAdminApiRequest(path: string): boolean {
  const p = path.replace(/^\//, '')
  return p.startsWith('api/admin/') && !p.startsWith('api/admin/auth/login')
}

export async function apiFetch<T = ApiRes>(
  path: string,
  options?: RequestInit & { body?: object }
): Promise<T> {
  const url = apiBase ? `${apiBase}${path.startsWith('/') ? '' : '/'}${path}` : path
  const { body, ...rest } = options ?? {}
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((rest.headers as Record<string, string>) ?? {}),
  }
  if (isAdminApiRequest(path)) {
    const token = getAdminToken()
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : rest.body,
  })
  const data = (await res.json().catch(() => ({}))) as T & ApiRes
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'message' in data && data.message) || res.statusText
    throw new Error(String(msg))
  }
  return data as T
}

export const api = {
  get: <T = ApiRes>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T = ApiRes>(path: string, body?: object) => apiFetch<T>(path, { method: 'POST', body }),
  patch: <T = ApiRes>(path: string, body?: object) => apiFetch<T>(path, { method: 'PATCH', body }),
  put: <T = ApiRes>(path: string, body?: object) => apiFetch<T>(path, { method: 'PUT', body }),
  delete: <T = ApiRes>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  /** 上传图片：multipart/form-data，返回 { url }。bucket: 'commodity' 仅用于管理员商品仓库，需携带 admin token */
  uploadImage: async (file: File, options?: { bucket?: 'commodity' }): Promise<{ url: string }> => {
    const url = apiBase ? `${apiBase}/api/upload` : '/api/upload'
    const form = new FormData()
    form.append('file', file)
    if (options?.bucket === 'commodity') form.append('bucket', 'commodity')
    const headers: HeadersInit = {}
    if (options?.bucket === 'commodity') {
      const token = getAdminToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
    const res = await fetch(url, { method: 'POST', body: form, headers })
    const data = (await res.json().catch(() => ({}))) as ApiRes & { url?: string }
    if (!res.ok) throw new Error(String((data && data.message) || res.statusText))
    if (!data.url) throw new Error('上传未返回 URL')
    return { url: data.url }
  },
}
