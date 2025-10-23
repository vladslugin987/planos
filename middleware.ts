export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    '/',
    '/year',
    '/notes',
    '/tasks',
    '/finance',
    '/api/user/:path*',
  ]
}

