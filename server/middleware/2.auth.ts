// server/middleware/2.auth.ts
export default eventHandler((event) => {
  // First check for Authorization header (Bearer token)
  let token = getHeader(event, 'Authorization')?.replace(/^Bearer\s+/, '')
  
  // If no Authorization header, check for Cloudflare Access cookie
  if (!token) {
    const cookies = parseCookies(event)
    token = cookies.CF_Authorization
  }
  
  // Check if API route requires authentication
  if (event.path.startsWith('/api/') && !event.path.startsWith('/api/_')) {
    // If no token found at all
    if (!token) {
      throw createError({
        status: 401,
        statusText: 'Authentication required',
      })
    }
    
    // Check against site token (if you're using a simple token-based auth)
    const siteToken = useRuntimeConfig(event).siteToken
    if (siteToken && token !== siteToken) {
      // If you're using Cloudflare Access tokens, you might want to validate the JWT instead
      // For now, we'll skip the siteToken check if it's a JWT (starts with 'eyJ')
      if (!token.startsWith('eyJ')) {
        throw createError({
          status: 401,
          statusText: 'Invalid token',
        })
      }
    }
  }
  
  // Basic token validation
  if (token && token.length < 8) {
    throw createError({
      status: 401,
      statusText: 'Token is too short',
    })
  }
})
