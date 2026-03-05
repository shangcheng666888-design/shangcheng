import React, { useEffect, useRef, useState } from 'react'
import { COUNTRY_CODES } from '../constants/countryCodes'
import { useLang } from '../context/LangContext'

interface PhoneCodeSelectProps {
  value: string
  onChange: (code: string) => void
}

const PhoneCodeSelect: React.FC<PhoneCodeSelectProps> = ({ value, onChange }) => {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  const filterText = keyword.trim().toLowerCase()
  const filteredCodes = COUNTRY_CODES.filter((code) =>
    code.toLowerCase().includes(filterText),
  )

  const handleSelect = (code: string) => {
    onChange(code)
    setOpen(false)
  }

  const displayCode = (code: string) => (code.startsWith('+') ? code.slice(1) : code)

  return (
    <div className="phone-code-select" ref={wrapperRef}>
      <button
        type="button"
        className="login-phone-code-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {displayCode(value)}
      </button>
      {open && (
        <div className="phone-code-dropdown">
          <div className="phone-code-dropdown-search">
            <input
              className="phone-code-dropdown-search-input"
              placeholder={lang === 'zh' ? '输入区号搜索' : 'Search country code'}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="phone-code-dropdown-list" role="listbox">
            {filteredCodes.map((code) => (
              <button
                key={code}
                type="button"
                className={`phone-code-option${
                  code === value ? ' phone-code-option--active' : ''
                }`}
                onClick={() => handleSelect(code)}
              >
                <span className="phone-code-option-text">{displayCode(code)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PhoneCodeSelect

