import React, { useState, useEffect } from 'react'
import type { AddressItem } from '../utils/addressList'
import { useToast } from './ToastProvider'
import PhoneCodeSelect from './PhoneCodeSelect'
import CountrySelect from './CountrySelect'
import RegionSelect from './RegionSelect'
import CitySelect from './CitySelect'
import { getRegions } from '../constants/countryRegions'
import { useLang } from '../context/LangContext'

export interface AddressModalProps {
  open: boolean
  onClose: () => void
  /** 编辑时传入，新增时传 null/undefined */
  initialAddress?: AddressItem | null
  onSuccess: (item: AddressItem) => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 手机号：仅数字，7～15 位（国际常见长度） */
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

const AddressModal: React.FC<AddressModalProps> = ({ open, onClose, initialAddress, onSuccess }) => {
  const { showToast } = useToast()
  const { lang } = useLang()
  const [recipient, setRecipient] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCode, setPhoneCode] = useState('+86')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  const [detail, setDetail] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (!open) return
    setEmailError('')
    setPhoneError('')
    if (initialAddress) {
      setRecipient(initialAddress.recipient)
      setEmail(initialAddress.email)
      setPhoneCode(initialAddress.phoneCode)
      setPhone(initialAddress.phone)
      setCountry(initialAddress.country)
      setProvince(initialAddress.province)
      setCity(initialAddress.city)
      setPostal(initialAddress.postal)
      setDetail(initialAddress.detail)
      setIsDefault(initialAddress.isDefault)
    } else {
      setRecipient('')
      setEmail('')
      setPhoneCode('+86')
      setPhone('')
      setCountry('')
      setProvince('')
      setCity('')
      setPostal('')
      setDetail('')
      setIsDefault(false)
    }
  }, [open, initialAddress])

  const handleSubmit = () => {
    const r = recipient.trim()
    const e = email.trim()
    const p = phone.trim()
    const d = detail.trim()

    setEmailError('')
    setPhoneError('')

    if (!r) {
      showToast(lang === 'zh' ? '请填写收货人姓名' : 'Please enter the recipient name', 'error')
      return
    }
    if (!e) {
      setEmailError(lang === 'zh' ? '请输入邮箱' : 'Please enter your email')
      return
    }
    if (!EMAIL_REGEX.test(e)) {
      setEmailError(lang === 'zh' ? '请输入正确合法的邮箱格式' : 'Please enter a valid email address')
      return
    }
    if (!p) {
      setPhoneError(lang === 'zh' ? '请输入手机号码' : 'Please enter your phone number')
      return
    }
    if (!isValidPhone(p)) {
      setPhoneError(
        lang === 'zh'
          ? '请输入正确合法的手机号码（7～15 位数字）'
          : 'Please enter a valid phone number (7–15 digits)',
      )
      return
    }
    if (!country) {
      showToast(lang === 'zh' ? '请选择国家' : 'Please select a country', 'error')
      return
    }
    if (!d) {
      showToast(lang === 'zh' ? '请填写详细地址' : 'Please enter your full address', 'error')
      return
    }
    const item: AddressItem = {
      id: initialAddress?.id ?? `addr_${Date.now()}`,
      recipient: r,
      email: e,
      phoneCode,
      phone: p,
      country,
      province,
      city,
      postal: postal.trim(),
      detail: d,
      isDefault,
    }
    onSuccess(item)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="account-tradepwd-overlay address-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      onClick={handleClose}
    >
      <div className="address-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="account-tradepwd-close address-modal-close"
          aria-label={lang === 'zh' ? '关闭' : 'Close'}
          onClick={handleClose}
        >
          ×
        </button>
        <h2 id="address-modal-title" className="address-modal-title">
          {initialAddress
            ? (lang === 'zh' ? '修改地址' : 'Edit address')
            : (lang === 'zh' ? '添加地址' : 'Add address')}
        </h2>
        <div className="address-modal-form">
          <div className="address-modal-field">
            <input
              type="text"
              className="address-modal-input"
              placeholder={lang === 'zh' ? '收货人姓名' : 'Recipient name'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="address-modal-field">
            <input
              type="email"
              className={`address-modal-input${emailError ? ' address-modal-input--error' : ''}`}
              placeholder={lang === 'zh' ? '邮箱' : 'Email'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
            />
            {emailError && <p className="address-modal-error-text">{emailError}</p>}
          </div>
          <div className="address-modal-field">
            <div className="address-modal-phone-combo-wrap">
              <div className="address-modal-phone-combo">
                <PhoneCodeSelect value={phoneCode} onChange={setPhoneCode} />
                <input
                  type="tel"
                  className={`address-modal-phone-input${phoneError ? ' address-modal-input--error' : ''}`}
                  placeholder={lang === 'zh' ? '请设置手机号码' : 'Please enter your phone number'}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (phoneError) setPhoneError('')
                  }}
                />
              </div>
            </div>
            {phoneError && <p className="address-modal-error-text">{phoneError}</p>}
          </div>
          {(() => {
            const regions = getRegions(country)
            const hasRegions = regions.length > 1 || (regions[0]?.value !== '_')
            const regionValue = hasRegions ? province : '_'
            return (
              <div
                className={`address-modal-field address-modal-field--row ${hasRegions ? 'address-modal-field--three' : 'address-modal-field--two'}`}
              >
                <CountrySelect
                  value={country}
                  onChange={(code) => {
                    setCountry(code)
                    setProvince('')
                    const nextRegions = getRegions(code)
                    const nextHasRegions = nextRegions.length > 1 || (nextRegions[0]?.value !== '_')
                    setCity(nextHasRegions ? '' : '_')
                  }}
                  placeholder={lang === 'zh' ? '国家' : 'Country'}
                />
                {hasRegions && (
                  <RegionSelect
                    countryCode={country}
                    value={province}
                    onChange={(regionValue) => {
                      setProvince(regionValue)
                      setCity('')
                    }}
                    placeholder={lang === 'zh' ? '省/州/邦' : 'State / province'}
                    disabled={!country}
                  />
                )}
                <CitySelect
                  countryCode={country}
                  regionValue={regionValue}
                  value={city}
                  onChange={setCity}
                  placeholder={lang === 'zh' ? '城市' : 'City'}
                  disabled={!country || (hasRegions && !province)}
                />
                {country && !hasRegions && regions[0]?.value === '_' && (
                  <div className="address-modal-field address-modal-field-hint" style={{ flexBasis: '100%', marginTop: '-0.25rem' }}>
                    <span className="address-modal-field-hint-text">
                      {lang === 'zh'
                        ? '该国家暂无省/市列表，可直接填写下方详细地址'
                        : 'No province/city list for this country. You can fill the full address directly below.'}
                    </span>
                  </div>
                )}
              </div>
            )
          })()}
          <div className="address-modal-field">
            <input
              type="text"
              className="address-modal-input"
              placeholder={lang === 'zh' ? '邮编' : 'Postal code'}
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
            />
          </div>
          <div className="address-modal-field">
            <textarea
              className="address-modal-input address-modal-textarea"
              placeholder={lang === 'zh' ? '详细地址' : 'Full address'}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
            />
          </div>
          <div className="address-modal-toggle-row">
            <span className="address-modal-toggle-label">
              {lang === 'zh' ? '设为默认地址' : 'Set as default address'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isDefault}
              className={`address-modal-toggle${isDefault ? ' address-modal-toggle--on' : ''}`}
              onClick={() => setIsDefault((v) => !v)}
            >
              <span className="address-modal-toggle-thumb" />
            </button>
          </div>
          <button
            type="button"
            className="account-settings-submit address-modal-submit"
            onClick={handleSubmit}
          >
            {lang === 'zh' ? '确定' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddressModal
