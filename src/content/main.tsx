import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

console.log('[CRXJS] Hello world from content script!')

const container = document.createElement('div')
container.id = 'crxjs-app'
document.body.appendChild(container)
createRoot(container).render(
  <StrictMode>
    <div />
  </StrictMode>,
)
