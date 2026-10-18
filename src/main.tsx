import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/ui/Globals.css'
import App from './App.tsx'
import './firebase'

// Prevent mouse wheel scrolling and up/down arrow keys from changing values on all number inputs globally
document.addEventListener('wheel', () => {
  if (document.activeElement && (document.activeElement as HTMLInputElement).type === 'number') {
    (document.activeElement as HTMLElement).blur();
  }
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (
    document.activeElement &&
    (document.activeElement as HTMLInputElement).type === 'number' &&
    (e.key === 'ArrowUp' || e.key === 'ArrowDown')
  ) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
