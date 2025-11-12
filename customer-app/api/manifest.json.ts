import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { org } = req.query

  if (!org || typeof org !== 'string') {
    return res.status(400).json({ error: 'Organization slug required' })
  }

  const manifest = {
    name: 'Omnily Loyalty',
    short_name: 'Omnily',
    description: 'Your loyalty card, always with you',
    theme_color: '#dc2626',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: `/${org}`,
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
  res.status(200).json(manifest)
}
