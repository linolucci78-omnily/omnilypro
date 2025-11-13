// Cookie utilities for PWA - cookies are shared between browser and installed PWA
// unlike localStorage which is isolated

export function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  console.log(`🍪 Cookie set: ${name}=${value}`)
}

export function getCookie(name: string): string | null {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length)
      console.log(`🍪 Cookie read: ${name}=${value}`)
      return value
    }
  }
  console.log(`🍪 Cookie not found: ${name}`)
  return null
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  console.log(`🍪 Cookie deleted: ${name}`)
}
