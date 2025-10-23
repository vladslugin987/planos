export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    '/',
    '/year',
    '/notes',
    '/homework',
    '/api/user/:path*',
  ]
}

