import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { StoresProvider } from './contexts/StoresContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <StoresProvider>
        <App />
      </StoresProvider>
    </AuthProvider>
  </StrictMode>,
)
