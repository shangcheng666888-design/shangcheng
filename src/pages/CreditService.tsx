import type React from 'react'
import { useState } from 'react'
import creditAmountIcon from '../assets/credit-feature-amount.png'
import creditFastIcon from '../assets/credit-feature-fast.png'
import creditSafeIcon from '../assets/credit-feature-safe.png'
import { useLang } from '../context/LangContext'

const CreditService: React.FC = () => {
  const { lang } = useLang()
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  return (
    <div className="page credit-page">
      <section className="credit-hero">
        <div className="credit-hero-inner">
          <div className="credit-hero-content">
            <h1 className="credit-hero-title">
              {lang === 'zh'
                ? '创业贷款 解决借钱的烦恼'
                : 'Startup loans to solve your funding worries'}
            </h1>
            <h2 className="credit-hero-subtitle">
              {lang === 'zh'
                ? '提供创业贷款 资金周转服务'
                : 'Entrepreneurship loans and cash‑flow services'}
            </h2>
            <p className="credit-hero-description">
              {lang === 'zh'
                ? '为你解决资金紧张、无处借钱、不愿意再向朋友开口借钱等贷款难题，全程专业人员服务，随时解答你的疑惑。我们的目标是让每一笔贷款都透明化，让客户快速放心的使用。'
                : 'We help you solve funding pressure, lack of borrowing channels, and the awkwardness of asking friends for money. Professional staff accompany you throughout the process and answer questions at any time. Our goal is to make every loan transparent so that you can use funds quickly and with peace of mind.'}
            </p>
            <div className="credit-hero-actions">
              <button
                type="button"
                className="credit-hero-btn credit-hero-btn-primary"
                onClick={() => setApplyModalOpen(true)}
              >
                {lang === 'zh' ? '在线申请' : 'Apply online'}
              </button>
              <button type="button" className="credit-hero-btn credit-hero-btn-secondary">
                {lang === 'zh' ? '我的贷款' : 'My loans'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="credit-feature-section">
        <h2 className="credit-feature-title">
          {lang === 'zh' ? '安全无忧' : 'Secure and worry‑free'}
        </h2>
        <div className="credit-feature-title-underline" />
        <div className="credit-feature-grid">
          <div className="credit-feature-card">
            <div className="credit-feature-icon">
              <img
                src={creditAmountIcon}
                alt={lang === 'zh' ? '灵活额度' : 'Flexible credit limit'}
                className="credit-feature-icon-img"
              />
            </div>
            <h3 className="credit-feature-card-title">
              {lang === 'zh' ? '灵活额度' : 'Flexible limits'}
            </h3>
            <p className="credit-feature-card-text">
              {lang === 'zh'
                ? '额度区间、利息、还款方式都可根据你的实际情况灵活配置，支持随借随还，提前结清无额外手续费。'
                : 'Credit limit, interest and repayment method can all be tailored to your situation. Support borrow‑as‑you‑go and early repayment with no extra fees.'}
            </p>
          </div>
          <div className="credit-feature-card">
            <div className="credit-feature-icon">
              <img
                src={creditFastIcon}
                alt={lang === 'zh' ? '急速放款' : 'Fast disbursement'}
                className="credit-feature-icon-img"
              />
            </div>
            <h3 className="credit-feature-card-title">
              {lang === 'zh' ? '急速放款' : 'Fast approval'}
            </h3>
            <p className="credit-feature-card-text">
              {lang === 'zh'
                ? '最快一个小时内完成审核，通过后资金实时到账，助你把握每一次创业和周转机会。'
                : 'Approval can be completed in as fast as one hour, and funds are credited in real time after approval so you can seize every opportunity.'}
            </p>
          </div>
          <div className="credit-feature-card">
            <div className="credit-feature-icon">
              <img
                src={creditSafeIcon}
                alt={lang === 'zh' ? '安全无忧' : 'Secure and reliable'}
                className="credit-feature-icon-img"
              />
            </div>
            <h3 className="credit-feature-card-title">
              {lang === 'zh' ? '安全无忧' : 'Secure and reliable'}
            </h3>
            <p className="credit-feature-card-text">
              {lang === 'zh'
                ? '正规金融合作机构，全程数据加密，严格保护你的隐私和资金安全，让借款更安心。'
                : 'We work with licensed financial institutions, encrypt your data end‑to‑end, and strictly protect your privacy and funds.'}
            </p>
          </div>
        </div>
      </section>

      <section className="credit-about-section">
        <div className="credit-about-inner">
          <div className="credit-about-illustration" aria-hidden>
            <img src="/credit-about-illustration.png" alt="" className="credit-about-img" />
          </div>
          <div className="credit-about-content">
            <h2 className="credit-about-title">
              {lang === 'zh' ? '关于我们' : 'About us'}
            </h2>
            <p className="credit-about-text">
              {lang === 'zh'
                ? '我们致力于为客户提供高效、基于客户至上的资金解决服务，以解决客户资金周转和贷款问题为使命。公司从风控、安全、合规多维度搭建风险管理体系，帮助市面各类客户解决资金难题。'
                : 'We are committed to providing efficient, customer‑first funding solutions, focusing on cash‑flow and loan needs. From risk control to security and compliance, we build a multi‑dimensional risk management system to help customers solve funding challenges.'}
            </p>
            <p className="credit-about-text">
              {lang === 'zh'
                ? '额度：100,000 至 30,000,000，利息及还款方式灵活，无任何前期费用，线上放款，不打审核电话，信息保密，当天放款。如有特别需求可单独沟通定制，请联系我们。'
                : 'Limits from 100,000 to 30,000,000, with flexible interest and repayment options. No upfront fees, online disbursement, no intrusive verification calls, and strict confidentiality. Same‑day disbursement is available. For special needs, please contact us for a tailored plan.'}
            </p>
            <div className="credit-about-actions">
              <button type="button" className="credit-about-btn credit-about-btn-primary">
                {lang === 'zh'
                  ? '致力于创业者贷款服务'
                  : 'Focused on loans for entrepreneurs'}
              </button>
              <button type="button" className="credit-about-btn credit-about-btn-secondary">
                {lang === 'zh' ? '解决您的资金困扰' : 'Solving your funding problems'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {applyModalOpen && (
        <div
          className="credit-apply-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'zh' ? '在线申请提示' : 'Online application hint'}
          onClick={() => setApplyModalOpen(false)}
        >
          <div
            className="credit-apply-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="credit-apply-modal-text">
              {lang === 'zh'
                ? '请联系在线客服人员办理您的业务'
                : 'Please contact our online customer service to process your request.'}
            </p>
            <button
              type="button"
              className="credit-apply-modal-btn"
              onClick={() => setApplyModalOpen(false)}
            >
              {lang === 'zh' ? '知道了' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreditService

