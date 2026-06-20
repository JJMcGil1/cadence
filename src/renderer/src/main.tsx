import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme, getInitialTheme } from './lib/theme'
import './styles.css'

// Set the theme attribute before the first paint to avoid a flash.
applyTheme(getInitialTheme())

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
