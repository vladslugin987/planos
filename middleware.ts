export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    '/',
    '/year',
    '/notes',
    '/tasks',
    '/finance',
    '/investments',
    '/api/user/:path*',
  ]
}

