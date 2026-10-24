import type { CSSProperties } from 'react'

// Inline styles built on Payload's admin theme variables, so the cards follow light and dark mode.

export const cardStyle: CSSProperties = {
  marginBottom: 'var(--base)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 'calc(var(--base) / 2)',
}

export const listStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }

export const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '9rem minmax(0, 2fr) minmax(0, 1fr) 7rem',
  alignItems: 'center',
  gap: 'calc(var(--base) / 2)',
  padding: 'calc(var(--base) / 3) 0',
  borderTop: '1px solid var(--theme-elevation-100)',
}

export const mutedStyle: CSSProperties = { color: 'var(--theme-elevation-500)', margin: 0 }

export const tagStyle = (urgent: boolean): CSSProperties => ({
  justifySelf: 'start',
  padding: '0 calc(var(--base) / 3)',
  borderRadius: 'var(--style-radius-s)',
  fontSize: '0.85em',
  background: urgent ? 'var(--theme-error-100)' : 'var(--theme-elevation-100)',
  color: urgent ? 'var(--theme-error-800)' : 'var(--theme-elevation-800)',
})
