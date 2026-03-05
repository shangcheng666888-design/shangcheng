import type React from 'react'
import { useState, useRef } from 'react'
import footerLogo from '../assets/logo2.png'

export interface CustomerServiceChatProps {
  /** 是否显示客服窗口 */
  open: boolean
  /** 关闭回调（如点击收起/关闭） */
  onClose: () => void
  /** 可选：自定义头部 Logo 图片地址，不传则使用 logo2 */
  logoUrl?: string
}

type MessageItem = { id: number; type: 'text' | 'image'; content: string; from: 'user' }

const CustomerServiceChat: React.FC<CustomerServiceChatProps> = ({
  open,
  onClose,
  logoUrl = footerLogo,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<MessageItem[]>([])
  const nextId = useRef(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!inputValue.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, type: 'text', content: inputValue.trim(), from: 'user' },
    ])
    setInputValue('')
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, type: 'image', content: url, from: 'user' },
    ])
    e.target.value = ''
  }

  if (!open) return null

  return (
    <div
      className="customer-service-chat"
      role="dialog"
      aria-label="在线客服"
      onClick={onClose}
    >
      <div
        className="customer-service-chat-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="customer-service-chat-header">
          <img src={logoUrl} alt="TikTok Mall" className="customer-service-chat-logo" />
          <span className="customer-service-chat-title">在线客服</span>
          <button
            type="button"
            className="customer-service-chat-close"
            aria-label="收起客服窗口"
            onClick={onClose}
          >
            <span className="customer-service-chat-chevron">▾</span>
          </button>
        </header>
        <div className="customer-service-chat-body">
          <div className="customer-service-chat-messages">
            {messages.map((msg) =>
              msg.type === 'text' ? (
                <div key={msg.id} className="customer-service-chat-msg customer-service-chat-msg--user">
                  <span className="customer-service-chat-msg-text">{msg.content}</span>
                </div>
              ) : (
                <div key={msg.id} className="customer-service-chat-msg customer-service-chat-msg--user">
                  <img src={msg.content} alt="上传的图片" className="customer-service-chat-msg-img" />
                </div>
              ),
            )}
          </div>
        </div>
        <div className="customer-service-chat-footer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="customer-service-chat-file-input"
            aria-hidden="true"
            tabIndex={-1}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="customer-service-chat-attach"
            aria-label="上传图片"
            onClick={handleAttachClick}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              />
            </svg>
          </button>
          <input
            type="text"
            className="customer-service-chat-input"
            placeholder="请输入"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            aria-label="输入消息"
          />
          <button
            type="button"
            className="customer-service-chat-send"
            onClick={handleSend}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerServiceChat
