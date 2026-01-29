import { sessionMinutes } from '@misc'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    const { pathname, search } = request.nextUrl
    const sessionCookie = request.cookies.get('pos')
    const currentSessionID = sessionCookie ? sessionCookie.value : ""
    const date = new Date()
    const dateValueOf = date.valueOf().toString()

    const encodedPathname = encodeURIComponent( pathname + search )

    if (pathname === '/sign-in'){
        if (currentSessionID !== "") {
            response.cookies.set({
                name: 'pos',
                value: dateValueOf,
                path: '/',
                maxAge:sessionMinutes * 60,
                httpOnly:true,
            })
            return NextResponse.redirect(new URL('/', request.url))
        }
    } else {
        if (currentSessionID === "") return NextResponse.redirect(new URL(`/sign-in?rd=${ encodedPathname }`, request.url));
        else {
            response.cookies.set({
                name: 'pos',
                value: dateValueOf,
                path: '/',
                maxAge:sessionMinutes * 60,
                httpOnly:true,
            })
        }
    }

    return response
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       */
      '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
  }