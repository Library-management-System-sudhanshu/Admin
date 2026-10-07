import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/ui/Globals.css'
import App from './App.tsx'
import './firebase'

// Prevent mouse wheel scrolling from changing values on all number inputs globally
document.addEventListener('wheel', () => {
  if (document.activeElement && (document.activeElement as HTMLInputElement).type === 'number') {
    (document.activeElement as HTMLElement).blur();
  }
}, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
