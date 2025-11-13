import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { slug, name, color } = req.query

  if (!slug || !name) {
    return res.status(400).json({ error: 'Missing required parameters: slug, name' })
  }

  const manifest = {
    name: `${name} - Loyalty Card`,
    short_name: name as string,
    description: 'Your loyalty card, always with you',
    start_url: `/${slug}/home`,
    scope: `/${slug}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: (color as string) || '#dc2626',
    orientation: 'portrait',
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

  // Set proper headers for manifest
  res.setHeader('Content-Type', 'application/manifest+json')
  res.setHeader('Cache-Control', 'public, max-age=3600')

  return res.status(200).json(manifest)
}
