import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import idFrontExample from '../assets/id-front-example.png'
import idBackExample from '../assets/id-back-example.png'
import idHandheldExample from '../assets/id-handheld-example.png'
import { api } from '../api/client'
import { useToast } from '../components/ToastProvider'
import { useLang } from '../context/LangContext'

const MerchantApply: React.FC = () => {
  const { lang } = useLang()
  const [_verifyMethod, _setVerifyMethod] = useState<'email' | 'phone'>('email')
  const [_passwordVisible, _setPasswordVisible] = useState(false)
  const [_confirmPasswordVisible, _setConfirmPasswordVisible] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [agreementModalOpen, setAgreementModalOpen] = useState(false)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [partyBSignature, setPartyBSignature] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null)
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null)
  const [idHandheldPreview, setIdHandheldPreview] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [formData, setFormData] = useState({
    storeName: '',
    storeAddress: '',
    country: '',
    idNumber: '',
    realName: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState<'logo' | 'idFront' | 'idBack' | 'idHandheld' | 'signature' | null>(null)
  const { showToast } = useToast()

  /** 将 Data URL 转为 File，用于签名上传 */
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',')
    const mime = (arr[0].match(/:(.*);/)?.[1] ?? 'image/png').trim()
    const bstr = atob(arr[1])
    const n = bstr.length
    const u8 = new Uint8Array(n)
    for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i)
    return new File([new Blob([u8], { type: mime })], filename, { type: mime })
  }

  const allRequiredFilled =
    agreed &&
    !!logoPreview &&
    !!idFrontPreview &&
    !!idBackPreview &&
    !!idHandheldPreview &&
    formData.storeName.trim() !== '' &&
    formData.storeAddress.trim() !== '' &&
    formData.country.trim() !== '' &&
    formData.idNumber.trim() !== '' &&
    formData.realName.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRequiredFilled) {
      const missing: string[] = []
      if (!agreed || !partyBSignature)
        missing.push(
          lang === 'zh'
            ? '请先阅读并签署入驻协议'
            : 'Please read and sign the onboarding agreement first',
        )
      if (!logoPreview)
        missing.push(
          lang === 'zh' ? '请上传店铺标志' : 'Please upload your shop logo',
        )
      if (!idFrontPreview || !idBackPreview || !idHandheldPreview)
        missing.push(
          lang === 'zh'
            ? '请上传完整的证件照片（正反面和手持照）'
            : 'Please upload all ID photos (front, back and handheld)',
        )
      if (!formData.storeName.trim())
        missing.push(
          lang === 'zh' ? '请填写店铺名称' : 'Please fill in your shop name',
        )
      if (!formData.storeAddress.trim())
        missing.push(
          lang === 'zh' ? '请填写店铺地址' : 'Please fill in your shop address',
        )
      if (!formData.country.trim())
        missing.push(
          lang === 'zh'
            ? '请填写国家或地区'
            : 'Please fill in your country or region',
        )
      if (!formData.idNumber.trim())
        missing.push(
          lang === 'zh'
            ? '请填写证件/护照号码'
            : 'Please fill in your ID/passport number',
        )
      if (!formData.realName.trim())
        missing.push(
          lang === 'zh'
            ? '请填写真实姓名'
            : 'Please fill in your real name',
        )
      showToast(
        missing[0] ??
          (lang === 'zh'
            ? '还有必填信息未填写'
            : 'Some required fields are still empty'),
        'error',
      )
      return
    }
    setSubmitting(true)
    try {
      let userId: string | null = null
      try {
        const raw = window.localStorage.getItem('authUser')
        if (raw) {
          const auth = JSON.parse(raw) as { id?: string }
          if (typeof auth.id === 'string') userId = auth.id
        }
      } catch {
        userId = null
      }
      if (!userId) {
        showToast(
          lang === 'zh'
            ? '请先登录商城账号，再提交入驻申请'
            : 'Please log in to your mall account before applying',
          'error',
        )
        setSubmitting(false)
        return
      }
      await api.post('/api/shop-applications', {
        storeName: formData.storeName.trim(),
        storeAddress: formData.storeAddress.trim(),
        country: formData.country,
        idNumber: formData.idNumber.trim(),
        realName: formData.realName.trim(),
        logo: logoPreview || null,
        idFront: idFrontPreview || null,
        idBack: idBackPreview || null,
        idHandheld: idHandheldPreview || null,
        signature: partyBSignature || null,
        userId,
      })
      showToast(
        lang === 'zh'
          ? '申请已提交，请等待管理员审核'
          : 'Application submitted, please wait for admin review',
      )
      setFormData({ storeName: '', storeAddress: '', country: '', idNumber: '', realName: '' })
      setLogoPreview(null)
      setIdFrontPreview(null)
      setIdBackPreview(null)
      setIdHandheldPreview(null)
      setPartyBSignature(null)
      setAgreed(false)
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : lang === 'zh'
            ? '提交失败，请稍后重试'
            : 'Submission failed, please try again later',
        'error',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    if (!signatureModalOpen) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w
    canvas.height = h
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    return () => {}
  }, [signatureModalOpen])

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const p = getCanvasPoint(e)
    if (!p || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    drawingRef.current = true
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  const moveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!drawingRef.current) return
    const p = getCanvasPoint(e)
    if (!p || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  const endDraw = () => {
    drawingRef.current = false
  }

  const confirmSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setImageUploading('signature')
    try {
      const file = dataURLtoFile(dataUrl, 'signature.png')
      const { url } = await api.uploadImage(file)
      setPartyBSignature(url)
      setSignatureModalOpen(false)
      setAgreed(true)
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : lang === 'zh'
            ? '签名上传失败'
            : 'Failed to upload signature',
        'error',
      )
    } finally {
      setImageUploading(null)
    }
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo' | 'idFront' | 'idBack' | 'idHandheld',
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    e.target.value = ''
    setImageUploading(field)
    try {
      const { url } = await api.uploadImage(file)
      setPreview(url)
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : lang === 'zh'
            ? '图片上传失败'
            : 'Image upload failed',
        'error',
      )
    } finally {
      setImageUploading(null)
    }
  }

  return (
    <div className="page merchant-apply-page">
      <section className="merchant-apply-hero">
        <div className="merchant-apply-hero-inner">
          <div className="merchant-apply-hero-text">
            <h1 className="merchant-apply-hero-title">
              {lang === 'zh'
                ? 'TikTok Shop 商家入驻'
                : 'TikTok Shop merchant onboarding'}
            </h1>
            <p className="merchant-apply-hero-subtitle">
              {lang === 'zh'
                ? '我们的合作伙伴计划为您提供全方位的营销支持和服务，我们的客户服务团队将提供专业的支持和建议，帮助您优化您的产品展示和销售策略。现在就加入我们吧！让我们一起创造更大的商业机会，共同成长！'
                : 'Our partner program provides full marketing support and services. Our customer service team offers professional advice to optimize your product display and sales strategy. Join us now to create more business opportunities and grow together!'}
            </p>
          </div>
          <div className="merchant-apply-hero-illustration" aria-hidden="true">
            <div className="merchant-apply-hero-dashboard">
              <div className="merchant-apply-hero-dashboard-header">
                <span className="merchant-apply-hero-dot" />
                <span className="merchant-apply-hero-dot" />
                <span className="merchant-apply-hero-dot" />
              </div>
              <div className="merchant-apply-hero-dashboard-body">
                <div className="merchant-apply-hero-chart">
                  <span className="merchant-apply-hero-chart-line" />
                  <span className="merchant-apply-hero-chart-bar merchant-apply-hero-chart-bar--1" />
                  <span className="merchant-apply-hero-chart-bar merchant-apply-hero-chart-bar--2" />
                  <span className="merchant-apply-hero-chart-bar merchant-apply-hero-chart-bar--3" />
                </div>
                <div className="merchant-apply-hero-metrics">
                  <div className="merchant-apply-hero-metric">
                    <span className="merchant-apply-hero-metric-label">
                      {lang === 'zh' ? '本月订单' : 'Orders this month'}
                    </span>
                    <span className="merchant-apply-hero-metric-value">+128%</span>
                  </div>
                  <div className="merchant-apply-hero-metric">
                    <span className="merchant-apply-hero-metric-label">
                      {lang === 'zh' ? '活跃买家' : 'Active buyers'}
                    </span>
                    <span className="merchant-apply-hero-metric-value">3.2K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 商业信息 / Business info */}
      <section className="merchant-apply-section">
        <header className="merchant-apply-header">
          <h1 className="merchant-apply-title">
            {lang === 'zh' ? '商业信息' : 'Business information'}
          </h1>
          <p className="merchant-apply-login-hint">
            {lang === 'zh'
              ? '如果您已是卖家,请'
              : 'If you are already a seller, please '}
            <Link to="/shop-login" className="merchant-apply-login-link">
              {lang === 'zh' ? '点击登录' : 'click to log in'}
            </Link>
          </p>
        </header>

        <form className="merchant-apply-form merchant-apply-form--row">
          <div className="merchant-apply-field">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '店铺标志' : 'Shop logo'}
            </label>
            <label className="merchant-apply-upload merchant-apply-upload--logo">
              <input
                type="file"
                accept="image/*"
                className="merchant-apply-upload-input"
                onChange={(e) => handleImageUpload(e, 'logo', setLogoPreview)}
              />
              {imageUploading === 'logo' ? (
                <span className="merchant-apply-upload-loading">
                  {lang === 'zh' ? '上传中…' : 'Uploading…'}
                </span>
              ) : logoPreview ? (
                <img
                  src={logoPreview}
                  alt={lang === 'zh' ? '店铺标志' : 'Shop logo'}
                  className="merchant-apply-upload-preview"
                />
              ) : (
                <svg className="merchant-apply-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </label>
          </div>

          <div className="merchant-apply-field">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '店铺名称' : 'Shop name'}
            </label>
            <input
              type="text"
              className="merchant-apply-input"
              placeholder={
                lang === 'zh'
                  ? '请输入店铺名称,不包含特殊字符'
                  : 'Please enter your shop name without special characters'
              }
              value={formData.storeName}
              onChange={(e) => setFormData((d) => ({ ...d, storeName: e.target.value }))}
            />
          </div>

          <div className="merchant-apply-field">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '店铺地址' : 'Shop address'}
            </label>
            <input
              type="text"
              className="merchant-apply-input"
              placeholder={
                lang === 'zh'
                  ? '请输入店铺地址,不包含特殊字符'
                  : 'Please enter your shop address without special characters'
              }
              value={formData.storeAddress}
              onChange={(e) => setFormData((d) => ({ ...d, storeAddress: e.target.value }))}
            />
          </div>

          <div className="merchant-apply-field">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '国家' : 'Country/Region'}
            </label>
            <input
              type="text"
              className="merchant-apply-input"
              placeholder={
                lang === 'zh'
                  ? '请输入国家或地区'
                  : 'Please enter country or region'
              }
              value={formData.country}
              onChange={(e) => setFormData((d) => ({ ...d, country: e.target.value }))}
            />
          </div>

          <div className="merchant-apply-field">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '证件/护照号码' : 'ID / Passport number'}
            </label>
            <input
              type="text"
              className="merchant-apply-input"
              placeholder={
                lang === 'zh'
                  ? '请输入身份证或者护照号'
                  : 'Please enter your ID or passport number'
              }
              value={formData.idNumber}
              onChange={(e) => setFormData((d) => ({ ...d, idNumber: e.target.value }))}
            />
          </div>

          <div className="merchant-apply-field">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '真实姓名' : 'Full legal name'}
            </label>
            <input
              type="text"
              className="merchant-apply-input"
              placeholder={
                lang === 'zh'
                  ? '请输入真实姓名,不包含特殊字符'
                  : 'Please enter your real name without special characters'
              }
              value={formData.realName}
              onChange={(e) => setFormData((d) => ({ ...d, realName: e.target.value }))}
            />
          </div>

          <div className="merchant-apply-field merchant-apply-field--id-photos">
            <label className="merchant-apply-label">
              <span className="merchant-apply-required">*</span>
              {lang === 'zh' ? '证件照/上传护照' : 'ID / passport photos'}
            </label>
            <div className="merchant-apply-id-uploads">
              <div className="merchant-apply-id-upload-item">
                <label className="merchant-apply-upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="merchant-apply-upload-input"
                    onChange={(e) => handleImageUpload(e, 'idFront', setIdFrontPreview)}
                  />
                  {imageUploading === 'idFront' ? (
                    <span className="merchant-apply-upload-loading">
                      {lang === 'zh' ? '上传中…' : 'Uploading…'}
                    </span>
                  ) : idFrontPreview ? (
                    <img
                      src={idFrontPreview}
                      alt={lang === 'zh' ? '证件正面' : 'Front of ID'}
                      className="merchant-apply-upload-preview"
                    />
                  ) : (
                    <svg className="merchant-apply-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </label>
                <span className="merchant-apply-id-upload-label">
                  {lang === 'zh' ? '证件正面' : 'Front side'}
                </span>
              </div>
              <div className="merchant-apply-id-upload-item">
                <label className="merchant-apply-upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="merchant-apply-upload-input"
                    onChange={(e) => handleImageUpload(e, 'idBack', setIdBackPreview)}
                  />
                  {imageUploading === 'idBack' ? (
                    <span className="merchant-apply-upload-loading">
                      {lang === 'zh' ? '上传中…' : 'Uploading…'}
                    </span>
                  ) : idBackPreview ? (
                    <img
                      src={idBackPreview}
                      alt={lang === 'zh' ? '证件反面' : 'Back of ID'}
                      className="merchant-apply-upload-preview"
                    />
                  ) : (
                    <svg className="merchant-apply-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </label>
                <span className="merchant-apply-id-upload-label">
                  {lang === 'zh' ? '证件反面' : 'Back side'}
                </span>
              </div>
              <div className="merchant-apply-id-upload-item">
                <label className="merchant-apply-upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="merchant-apply-upload-input"
                    onChange={(e) => handleImageUpload(e, 'idHandheld', setIdHandheldPreview)}
                  />
                  {imageUploading === 'idHandheld' ? (
                    <span className="merchant-apply-upload-loading">
                      {lang === 'zh' ? '上传中…' : 'Uploading…'}
                    </span>
                  ) : idHandheldPreview ? (
                    <img
                      src={idHandheldPreview}
                      alt={lang === 'zh' ? '手持证件照' : 'Handheld ID photo'}
                      className="merchant-apply-upload-preview"
                    />
                  ) : (
                    <svg className="merchant-apply-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </label>
                <span className="merchant-apply-id-upload-label">
                  {lang === 'zh' ? '手持证件照' : 'Handheld photo'}
                </span>
              </div>
            </div>
            <span className="merchant-apply-example-col-label">
              {lang === 'zh' ? '拍照示例' : 'Photo examples'}
            </span>
            <div className="merchant-apply-example-list">
              <div className="merchant-apply-example-item">
                <img
                  src={idFrontExample}
                  alt={lang === 'zh' ? '证件正面示例' : 'Front of ID example'}
                  className="merchant-apply-example-img"
                />
              </div>
              <div className="merchant-apply-example-item">
                <img
                  src={idBackExample}
                  alt={lang === 'zh' ? '证件反面示例' : 'Back of ID example'}
                  className="merchant-apply-example-img"
                />
              </div>
              <div className="merchant-apply-example-item">
                <img
                  src={idHandheldExample}
                  alt={lang === 'zh' ? '手持证件照示例' : 'Handheld ID photo example'}
                  className="merchant-apply-example-img"
                />
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* 入驻协议与提交 / Agreement & submit */}
      <section className="merchant-apply-section">
        <form className="merchant-apply-form merchant-apply-form--row" onSubmit={handleSubmit}>
          <div className="merchant-apply-field merchant-apply-field--checkbox">
            <div
              className="merchant-apply-checkbox-wrap"
              role="button"
              tabIndex={0}
              onClick={() => setAgreementModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setAgreementModalOpen(true)
                }
              }}
            >
              <span
                className={`merchant-apply-checkbox${agreed ? ' merchant-apply-checkbox--checked' : ''}`}
                aria-hidden
              />
              <span className="merchant-apply-checkbox-label">
                {lang === 'zh' ? '我已阅读并同意' : 'I have read and agree to the '}
                <span className="merchant-apply-checkbox-agreement">
                  {lang === 'zh' ? '入驻协议' : 'Onboarding agreement'}
                </span>
              </span>
            </div>
          </div>

          <div className="merchant-apply-field merchant-apply-field--submit">
            <button
              type="submit"
              className={`merchant-apply-submit-btn${
                allRequiredFilled ? '' : ' merchant-apply-submit-btn--disabled'
              }`}
              disabled={!allRequiredFilled || submitting}
            >
              {submitting
                ? lang === 'zh'
                  ? '提交中…'
                  : 'Submitting…'
                : lang === 'zh'
                  ? '提交申请表'
                  : 'Submit application'}
            </button>
          </div>
        </form>
      </section>

      {/* 入驻协议弹窗 / Agreement modal */}
      {agreementModalOpen && (
        <div
          className="merchant-apply-agreement-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agreement-modal-title"
          onClick={() => setAgreementModalOpen(false)}
        >
          <div className="merchant-apply-agreement-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="merchant-apply-agreement-close"
              aria-label="关闭"
              onClick={() => setAgreementModalOpen(false)}
            >
              ×
            </button>
            <h2 id="agreement-modal-title" className="merchant-apply-agreement-title">
              {lang === 'zh' ? '经营合同' : 'Business contract'}
            </h2>
            <div className="merchant-apply-agreement-body">
              {lang === 'zh' ? (
                <>
                  <p>双方经友好协商，对于商城合作一事达成如下协议：</p>

                  <h3>一、甲方责任</h3>
                  <p>1.甲方需提供足够的供应商以及商品，用于合作。</p>
                  <p>2.甲方需提供安全及运输工作，以其一切工商税务和运输费用等。其包括：打包、安装、售后、运输、公共关系，等一切费用。</p>
                  <p>3.甲方需保证物流运输的正常运行，并负责商品和工作人员的安全。如出现人为破坏，被盗，物品损坏，均由甲方全面负责，照价赔偿。</p>

                  <h3>二、乙方责任</h3>
                  <p>1.乙方需提供商品成本、维护商城买家（客户关系）。</p>
                  <p>2.乙方保证良好的个人信用。</p>
                  <p>3.乙方需48小时内及时处理订单。</p>

                  <h3>三、违约条款</h3>
                  <p>1.如有特殊情况，经双方协商协议解决。</p>
                  <p>2.如受政策影响，特殊情况和经营状态不好，乙方全权负责。</p>
                  <p>3.双方必须严格遵守合同规定，如单方违约，任何一方需负法律责任或者赔偿。</p>
                  <p>4.即签字之日起效。</p>

                  <h3>四、补充规定</h3>
                  <p>本协议为电子合同，具有同等法律效力。</p>
                  <p>本协议未尽事宜，双方可通过友好协商达成补充协议解决。补充协议与本协议具有同等法律效力。</p>
                  <p>本协议一经签署，即视为双方已充分理解并同意本合同的全部条款。</p>
                </>
              ) : (
                <>
                  <p>
                    After friendly negotiation, both parties reach the following agreement on mall
                    cooperation:
                  </p>

                  <h3>1. Party A&apos;s responsibilities</h3>
                  <p>
                    (1) Party A shall provide sufficient suppliers and products for cooperation.
                  </p>
                  <p>
                    (2) Party A shall be responsible for logistics safety and transportation, and bear
                    all related industrial and commercial taxes and transportation costs, including
                    packing, installation, after‑sales service, transportation and public relations.
                  </p>
                  <p>
                    (3) Party A shall ensure normal logistics operation and the safety of goods and
                    staff. In case of human damage, theft or damage of goods, Party A shall be fully
                    responsible and make compensation at cost.
                  </p>

                  <h3>2. Party B&apos;s responsibilities</h3>
                  <p>
                    (1) Party B shall provide product cost and maintain mall buyers (customer
                    relationship).
                  </p>
                  <p>(2) Party B shall ensure good personal credit.</p>
                  <p>(3) Party B shall process orders in time within 48 hours.</p>

                  <h3>3. Breach of contract</h3>
                  <p>
                    (1) In case of special circumstances, both parties shall resolve them through
                    negotiation.
                  </p>
                  <p>
                    (2) If affected by policies or poor business conditions, Party B shall bear full
                    responsibility.
                  </p>
                  <p>
                    (3) Both parties must strictly abide by this contract. In case of unilateral
                    breach, the breaching party shall bear legal liability or compensation.
                  </p>
                  <p>(4) This agreement takes effect from the date of signing.</p>

                  <h3>4. Supplementary provisions</h3>
                  <p>This agreement is an electronic contract with the same legal effect.</p>
                  <p>
                    For matters not covered herein, both parties may sign supplementary agreements
                    through friendly negotiation, which shall have the same legal effect.
                  </p>
                  <p>
                    Once signed, this agreement is deemed that both parties have fully understood and
                    agreed to all its terms.
                  </p>
                </>
              )}

              <div className="merchant-apply-agreement-signatures">
                <div className="merchant-apply-agreement-party merchant-apply-agreement-party--a">
                  <p className="merchant-apply-agreement-party-line">
                    <span className="merchant-apply-agreement-party-label">
                      {lang === 'zh' ? '甲方：' : 'Party A:'}
                    </span>
                    <span className="merchant-apply-agreement-party-name-wrap">
                      <span className="merchant-apply-agreement-party-name">TikTok Shop</span>
                      <img
                        src="/party-a-signature.png"
                        alt={lang === 'zh' ? '甲方签名' : "Party A's signature"}
                        className="merchant-apply-agreement-signature-img"
                      />
                    </span>
                  </p>
                  <p>
                    {lang === 'zh' ? '日期：2026-02-27' : 'Date: 2026-02-27'}
                  </p>
                </div>
                <div className="merchant-apply-agreement-party merchant-apply-agreement-party--b">
                  <p className="merchant-apply-agreement-party-line">
                    <span className="merchant-apply-agreement-party-label">
                      {lang === 'zh' ? '乙方：' : 'Party B:'}
                    </span>
                    <span className="merchant-apply-agreement-party-name-wrap">
                      <span className="merchant-apply-agreement-party-name"> </span>
                      {partyBSignature ? (
                        <img
                          src={partyBSignature}
                          alt={lang === 'zh' ? '乙方签名' : "Party B's signature"}
                          className="merchant-apply-agreement-signature-img"
                        />
                      ) : null}
                    </span>
                  </p>
                  <p>
                    <span className="merchant-apply-agreement-party-label">
                      {lang === 'zh' ? '日期：' : 'Date: '}
                    </span>
                    2026-02-27
                  </p>
                </div>
              </div>
            </div>
            <div className="merchant-apply-agreement-actions">
              <button
                type="button"
                className="merchant-apply-agreement-btn merchant-apply-agreement-btn--primary"
                onClick={() => setSignatureModalOpen(true)}
              >
                {lang === 'zh' ? '同意并签名' : 'Agree and sign'}
              </button>
              <button
                type="button"
                className="merchant-apply-agreement-btn merchant-apply-agreement-btn--secondary"
                onClick={() => setAgreementModalOpen(false)}
              >
                {lang === 'zh' ? '确认' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 签名确认弹窗（叠在协议弹窗之上） / Signature confirm modal */}
      {signatureModalOpen && (
        <div
          className="merchant-apply-signature-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'zh' ? '签名确认' : 'Signature confirmation'}
          onClick={() => setSignatureModalOpen(false)}
        >
          <div className="merchant-apply-signature-modal" onClick={(e) => e.stopPropagation()}>
            <p className="merchant-apply-signature-title">
              {lang === 'zh' ? '请在此处签名' : 'Please sign here'}
            </p>
            <div className="merchant-apply-signature-pad-wrap">
              <canvas
                ref={canvasRef}
                className="merchant-apply-signature-canvas"
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
              />
            </div>
            <div className="merchant-apply-signature-actions">
              <button
                type="button"
                className="merchant-apply-agreement-btn merchant-apply-agreement-btn--primary"
                onClick={clearSignatureCanvas}
              >
                {lang === 'zh' ? '重置' : 'Reset'}
              </button>
              <button
                type="button"
                className="merchant-apply-agreement-btn merchant-apply-agreement-btn--primary"
                onClick={() => setSignatureModalOpen(false)}
              >
                {lang === 'zh' ? '上一步' : 'Back'}
              </button>
              <button
                type="button"
                className="merchant-apply-agreement-btn merchant-apply-agreement-btn--primary"
                onClick={confirmSignature}
                disabled={imageUploading === 'signature'}
              >
                {imageUploading === 'signature'
                  ? lang === 'zh'
                    ? '上传中…'
                    : 'Uploading…'
                  : lang === 'zh'
                    ? '确认'
                    : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantApply
