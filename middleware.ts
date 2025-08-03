import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 管理者ページのアクセス制御
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    // チーム編集ページのアクセス制御
    if (pathname.match(/^\/teams\/[^\/]+\/edit$/)) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }

      // チームIDを取得
      const teamId = pathname.split('/')[2];
      
      // 管理者または該当チームの発表者のみアクセス可能
      const canAccess = token.role === 'admin' || 
                       (token.role === 'presenter' && token.teamId === teamId);
      
      if (!canAccess) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // 認証が必要なページの判定
        const protectedPaths = ['/admin', '/teams/[^/]+/edit'];
        const isProtectedPath = protectedPaths.some(pattern => 
          new RegExp(pattern).test(pathname)
        );

        if (isProtectedPath) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/teams/:id/edit',
  ]
};