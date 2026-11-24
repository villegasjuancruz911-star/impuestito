import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './state.jsx'
import App from './App.jsx'
import { applyA11y, loadA11y } from './lib/a11y.js'
import './styles.css'

applyA11y(loadA11y())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
