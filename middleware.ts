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
      
      // 🆕 新しい権限チェック：
      // - 管理者は常にアクセス可能
      // - 発表者は自分のチームのみアクセス可能（editingAllowedチェックはページ側で実施）
      const canAccess = token.role === 'admin' || 
                       (token.role === 'presenter' && token.teamId === teamId);
      
      if (!canAccess) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // 🆕 発表者の場合は、editingAllowedのチェックはページコンポーネントで行う
      // （データベースへのアクセスが必要なため、ミドルウェアでは実行しない）
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