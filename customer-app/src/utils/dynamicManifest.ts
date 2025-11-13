// Dynamic manifest generator for multi-tenant PWA
// Injects a dynamic manifest based on the current organization
// Uses a server endpoint instead of blob URL for better stability

export function injectDynamicManifest(slug: string, orgName: string, primaryColor: string) {
  // Remove any existing manifest link
  const existingLink = document.querySelector('link[rel="manifest"]')
  if (existingLink) {
    existingLink.remove()
  }

  // Build the manifest URL with query parameters
  // The server will generate the manifest dynamically
  const manifestURL = `/api/manifest?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(orgName)}&color=${encodeURIComponent(primaryColor)}`

  // Create and inject the new manifest link
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = manifestURL
  document.head.appendChild(link)

  console.log('📱 Dynamic manifest injected:', {
    name: `${orgName} - Loyalty Card`,
    start_url: `/${slug}/home`,
    scope: `/${slug}/`,
    theme_color: primaryColor,
    manifestURL
  })
}
