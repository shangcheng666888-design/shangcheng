import React, { useEffect, useRef, useState } from 'react'
import { getRegions } from '../constants/countryRegions'

interface RegionSelectProps {
  countryCode: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const RegionSelect: React.FC<RegionSelectProps> = ({
  countryCode,
  value,
  onChange,
  placeholder = '省/州/邦',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const options = getRegions(countryCode)

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
  const fallbackOption = options.length === 1 && options[0].value === '_' ? options[0] : null
  const filteredOptions = (() => {
    const filtered = options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(filterText) ||
        opt.value.toLowerCase().includes(filterText),
    )
    if (filtered.length === 0 && fallbackOption) return [fallbackOption]
    return filtered
  })()

  const handleSelect = (regionValue: string) => {
    onChange(regionValue)
    setOpen(false)
    setKeyword('')
  }

  const selectedLabel = value ? options.find((o) => o.value === value)?.label ?? value : ''

  return (
    <div className="phone-code-select region-select" ref={wrapperRef}>
      <button
        type="button"
        className="login-phone-code-select region-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        {selectedLabel || placeholder}
      </button>
      {open && !disabled && (
        <div className="phone-code-dropdown">
          <div className="phone-code-dropdown-search">
            <input
              className="phone-code-dropdown-search-input"
              placeholder="输入省/州/邦搜索"
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

export default RegionSelect
