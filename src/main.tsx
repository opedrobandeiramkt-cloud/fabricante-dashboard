import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { StoresProvider } from './contexts/StoresContext.tsx'
import { UsersProvider } from './contexts/UsersContext.tsx'
import { OrcamentosProvider } from './contexts/OrcamentosContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UsersProvider>
      <AuthProvider>
        <StoresProvider>
          <OrcamentosProvider>
            <App />
          </OrcamentosProvider>
        </StoresProvider>
      </AuthProvider>
    </UsersProvider>
  </StrictMode>,
)
