import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // additional middleware logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/chat/:path*",
    "/profile/:path*",
    "/settings/:path*"
  ]
}
