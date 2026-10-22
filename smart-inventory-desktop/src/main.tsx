import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RealmContext } from './models/RealmContext'

const { RealmProvider } = RealmContext;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RealmProvider>
      <App />
    </RealmProvider>
  </StrictMode>,
)
