import React from 'react'

export const metadata = {
  description: 'CRM y alertas de precios para empresas de granos.',
  title: 'ShipAgro',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
