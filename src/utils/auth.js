const AUTH_TOKEN_KEY = 'portal_token'
const AUTH_USER_KEY = 'portal_user'

export const saveAuth = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
