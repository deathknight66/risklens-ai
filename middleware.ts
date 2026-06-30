import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "risklens_secret_key_for_development" })
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isApi = req.nextUrl.pathname.startsWith('/api') 
    && !req.nextUrl.pathname.startsWith('/api/auth') 
    && !req.nextUrl.pathname.startsWith('/api/ingest');

  if (!token && (isDashboard || isApi)) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (token && req.nextUrl.pathname === '/dashboard') {
    if (token.role === 'Board Member') {
      return NextResponse.redirect(new URL('/dashboard/board', req.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard/soc', req.url))
    }
  }

  // Board Member Hard Deny for Operational Areas
  if (token && token.role === 'Board Member') {
    const isRestrictedDashboard = req.nextUrl.pathname.startsWith('/dashboard/ingestion') || req.nextUrl.pathname.startsWith('/dashboard/actions');
    const isRestrictedApi = req.nextUrl.pathname.startsWith('/api/incidents') || req.nextUrl.pathname.startsWith('/api/actions');
    // Note: in a real app, GET requests to API might be allowed for Board if they need to read incidents. We'll block mutation or just block entirely per instructions.
    
    if (isRestrictedDashboard) {
      return NextResponse.redirect(new URL('/dashboard/board', req.url))
    }

    if (isRestrictedApi && req.method !== 'GET') {
      return NextResponse.json({ error: 'Forbidden. Board Members cannot perform this action.' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/login'],
}
