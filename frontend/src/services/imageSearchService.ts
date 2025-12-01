/**
 * Image Search Service
 * Integrazione con Unsplash e Pexels per ricerca automatica immagini rewards
 */

// CHIAVI API (NON COMMITTARE LA SECRET KEY - USA SOLO ACCESS KEY)
const UNSPLASH_ACCESS_KEY = 'KqGcgDfdNSJTWn3NG6v3zrPKgyMOYyXK7YUpWxEN_Lo'

// Backup: Pexels API (registrati su pexels.com/api per chiave gratuita)
const PEXELS_API_KEY = '' // Opzionale: aggiungi se vuoi doppio fallback

export interface ImageSearchResult {
  url: string
  thumbnail: string
  author: string
  authorUrl: string
  source: 'unsplash' | 'pexels' | 'default'
}

/**
 * Cerca immagine su Unsplash
 */
async function searchUnsplashImage(query: string): Promise<ImageSearchResult | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not configured')
    return null
  }

  try {
    console.log('🔍 Searching Unsplash for:', query)

    const response = await fetch(
      `https://api.unsplash.com/search/photos?` +
      `query=${encodeURIComponent(query)}` +
      `&per_page=1` +
      `&orientation=landscape` +
      `&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    )

    if (!response.ok) {
      console.error('Unsplash API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      console.log('No results found on Unsplash for:', query)
      return null
    }

    const photo = data.results[0]

    console.log('✅ Found image on Unsplash:', photo.urls.regular)

    return {
      url: photo.urls.regular,
      thumbnail: photo.urls.thumb,
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      source: 'unsplash'
    }
  } catch (error: any) {
    console.error('Error searching Unsplash:', error.message)
    return null
  }
}

/**
 * Cerca immagine su Pexels (fallback)
 */
async function searchPexelsImage(query: string): Promise<ImageSearchResult | null> {
  if (!PEXELS_API_KEY) {
    console.log('Pexels API key not configured, skipping')
    return null
  }

  try {
    console.log('🔍 Searching Pexels for:', query)

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Pexels API error:', response.status)
      return null
    }

    const data = await response.json()

    if (!data.photos || data.photos.length === 0) {
      console.log('No results found on Pexels for:', query)
      return null
    }

    const photo = data.photos[0]

    console.log('✅ Found image on Pexels:', photo.src.large)

    return {
      url: photo.src.large,
      thumbnail: photo.src.medium,
      author: photo.photographer,
      authorUrl: photo.photographer_url,
      source: 'pexels'
    }
  } catch (error: any) {
    console.error('Error searching Pexels:', error.message)
    return null
  }
}

/**
 * Cerca immagine per reward (con fallback multipli)
 */
export async function searchRewardImage(query: string): Promise<ImageSearchResult | null> {
  if (!query || query.trim() === '') {
    console.warn('Empty search query provided')
    return null
  }

  // 1. Prova Unsplash (50k richieste/mese gratis)
  const unsplashResult = await searchUnsplashImage(query)
  if (unsplashResult) {
    return unsplashResult
  }

  // 2. Fallback: Prova Pexels (illimitato gratis)
  if (PEXELS_API_KEY) {
    const pexelsResult = await searchPexelsImage(query)
    if (pexelsResult) {
      return pexelsResult
    }
  }

  // 3. Nessuna immagine trovata
  console.log('❌ No image found for:', query)
  return null
}

/**
 * Cerca immagini per multipli rewards in parallelo
 */
export async function searchMultipleRewardImages(
  queries: string[]
): Promise<(ImageSearchResult | null)[]> {
  console.log(`🔍 Searching images for ${queries.length} rewards...`)

  const results = await Promise.all(
    queries.map(query => searchRewardImage(query))
  )

  const successCount = results.filter(r => r !== null).length
  console.log(`✅ Found ${successCount}/${queries.length} images`)

  return results
}

/**
 * Test della connessione API
 */
export async function testUnsplashConnection(): Promise<boolean> {
  try {
    const result = await searchUnsplashImage('coffee')
    return result !== null
  } catch {
    return false
  }
}
