import { useEffect } from 'react'
import { Crisp } from 'crisp-sdk-web'

const WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID as string | undefined

/**
 * Crisp 客服聊天插件。需在 .env 中配置 VITE_CRISP_WEBSITE_ID（从 Crisp 后台获取）。
 * 文档：https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/
 */
const CrispChat: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !WEBSITE_ID || !WEBSITE_ID.trim()) return
    Crisp.configure(WEBSITE_ID.trim())
  }, [])
  return null
}

export default CrispChat
