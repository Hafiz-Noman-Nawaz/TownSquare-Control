import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // 1. Allow public routes, static assets, and auth endpoints unconditionally
  const publicRoutes = ["/login", "/admin/login", "/auth/callback", "/manifest.json", "/offline", "/api/webhooks"];
  if (publicRoutes.some((route) => pathname.startsWith(route)) || pathname.startsWith("/_next") || pathname.includes(".")) {
    return response;
  }

  // 2. Initialize SSR Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-ref.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 3. Check authenticated session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no active user session, redirect to login
  if (!user) {
    // Only redirect if running in real deployed Supabase environment
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // 4. Role-based Route Protection
  const role = user.user_metadata?.role || "control_room_operator";

  // Prevent contractor users from snooping on admin dashboards or raw incident creation
  if (role === "contractor") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/incidents/new")) {
      return NextResponse.redirect(new URL("/contractor", request.url));
    }
  }

  // Prevent non-super_admins from accessing privileged admin configuration
  if (pathname.startsWith("/admin") && role !== "super_admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
