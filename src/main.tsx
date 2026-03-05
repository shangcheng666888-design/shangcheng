import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LangProvider } from './context/LangContext'

if (import.meta.env.DEV) {
  const runValidation = () => {
    import('./constants/countries').then(({ COUNTRY_OPTIONS }) =>
      import('./constants/countryRegions').then(({ validateCountryRegions }) => {
        const v = validateCountryRegions(COUNTRY_OPTIONS.map((c) => c.value))
        if (!v.ok) console.warn('[countryRegions] 数据校验未通过:', v)
      })
    )
  }
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(runValidation, { timeout: 3000 })
  } else {
    setTimeout(runValidation, 500)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <App />
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
