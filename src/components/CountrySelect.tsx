import React, { useEffect, useRef, useState } from 'react'
import { COUNTRY_OPTIONS } from '../constants/countries'

interface CountrySelectProps {
  value: string
  onChange: (code: string) => void
  placeholder?: string
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = '国家',
}) => {
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
  const filteredOptions = COUNTRY_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(filterText) ||
      opt.value.toLowerCase().includes(filterText),
  )

  const handleSelect = (code: string) => {
    onChange(code)
    setOpen(false)
    setKeyword('')
  }

  const selectedLabel = value ? COUNTRY_OPTIONS.find((o) => o.value === value)?.label ?? value : ''

  return (
    <div className="phone-code-select country-select" ref={wrapperRef}>
      <button
        type="button"
        className="login-phone-code-select country-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLabel || placeholder}
      </button>
      {open && (
        <div className="phone-code-dropdown">
          <div className="phone-code-dropdown-search">
            <input
              className="phone-code-dropdown-search-input"
              placeholder="输入国家或代码搜索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="phone-code-dropdown-list" role="listbox">
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`phone-code-option${opt.value === value ? ' phone-code-option--active' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="phone-code-option-text">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CountrySelect
