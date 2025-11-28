// import NextAuth from "next-auth";
// import authConfig from "@/auth.config";
// import { NextResponse } from "next/server";

// const { auth } = NextAuth(authConfig);

// export default auth(async (req) => {
//   // ✅ Always allow
//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|mov|avi|mkv|webm|ogg|wav|mp3)).*)",
//     "/(api|trpc)(.*)",
//   ],
// };

// import NextAuth from "next-auth";
// import authConfig from "@/auth.config";
// import { NextResponse } from "next/server";

// const { auth } = NextAuth(authConfig);

// export default auth(async (req) => {
//   // ✅ Always allow
//   return NextResponse.next();
// });

// export const config = {
//   // Only run on specific protected routes
//   matcher: [
//     "/dashboard/:path*",
//     "/admin/:path*", 
//     "/profile/:path*"
//     // Add only the routes you actually want to protect
//   ],
// };



import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes jo bina login ke accessible honge
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Agar user logged in hai aur login page par jaana chahta hai
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Agar user logged in nahi hai aur protected route access kar raha hai
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Ye config batata hai ki middleware kis routes par chalega
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
