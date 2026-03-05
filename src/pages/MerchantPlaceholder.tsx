import React from 'react'

interface MerchantPlaceholderProps {
  title: string
}

const MerchantPlaceholder: React.FC<MerchantPlaceholderProps> = ({ title }) => (
  <div className="merchant-placeholder">
    <h1 className="merchant-placeholder-title">{title}</h1>
    <p className="merchant-placeholder-text">功能开发中，敬请期待。</p>
  </div>
)

export default MerchantPlaceholder
