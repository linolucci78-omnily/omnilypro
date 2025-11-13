// Dynamic manifest generator for multi-tenant PWA
// Injects a dynamic manifest based on the current organization

export function injectDynamicManifest(slug: string, orgName: string, primaryColor: string) {
  // Remove any existing manifest link
  const existingLink = document.querySelector('link[rel="manifest"]')
  if (existingLink) {
    existingLink.remove()
  }

  // Create the manifest object
  const manifest = {
    name: `${orgName} - Loyalty Card`,
    short_name: orgName,
    description: 'Your loyalty card, always with you',
    start_url: `/${slug}/home`,
    scope: `/${slug}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: primaryColor,
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

  // Convert to JSON string
  const manifestJSON = JSON.stringify(manifest)

  // Create a blob URL (this should work better than data: URL)
  const blob = new Blob([manifestJSON], { type: 'application/json' })
  const manifestURL = URL.createObjectURL(blob)

  // Create and inject the new manifest link
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = manifestURL
  document.head.appendChild(link)

  console.log('📱 Dynamic manifest injected:', {
    name: manifest.name,
    start_url: manifest.start_url,
    scope: manifest.scope,
    theme_color: manifest.theme_color
  })
}
