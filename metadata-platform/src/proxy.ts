import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/standards', '/domains', '/codes', '/workflow', '/admin']
const authPaths = ['/login', '/signup']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth.api.getSession({ headers: request.headers })
  const isLoggedIn = !!session?.user

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isAuthPage = authPaths.some((path) => pathname === path)
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/standards', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
